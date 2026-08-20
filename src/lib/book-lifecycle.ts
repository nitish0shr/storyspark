/**
 * Pure lifecycle logic for the canonical book fulfilment flow.
 *
 * All exports are pure functions with no I/O or side effects.
 * The database RPC (transition_book_lifecycle) enforces the same rules
 * transactionally; this module lets callers validate locally before
 * hitting the network and drives comprehensive unit tests.
 */

import type { LifecycleStage, BookVersion, BookVersionPage } from "@/types/book";

// ─── Stage list ───────────────────────────────────────────────────────────────

/** Ordered list of all canonical lifecycle stages. */
export const LIFECYCLE_STAGES: readonly LifecycleStage[] = [
  "Generated",
  "Under Review",
  "Changes Requested",
  "Revised",
  "Approved",
  "Ready for Purchase",
  "Purchased",
  "Delivered",
] as const;

/**
 * Legacy operational `status` column values, mapped to the canonical lifecycle
 * stage they best correspond to. Used ONLY as a fallback when
 * `lifecycle_stage` is null (pre-lifecycle or legacy rows). Never used to
 * override a present canonical stage.
 */
const LEGACY_STATUS_TO_STAGE: Readonly<Record<string, LifecycleStage>> = {
  draft: "Generated",
  preview_generating: "Generated",
  preview_ready: "Generated",
  generating: "Generated",
  complete: "Generated",
  pending_review: "Under Review",
  reviewing: "Under Review",
  needs_regeneration: "Changes Requested",
};

/**
 * Resolves the canonical lifecycle stage for display.
 *
 * Rule: prefer the canonical `lifecycleStage` when present. Only fall back to
 * the legacy `status` mapping when `lifecycleStage` is null. Returns null when
 * neither yields a canonical stage.
 */
export function resolveCanonicalStage(
  lifecycleStage: LifecycleStage | string | null | undefined,
  legacyStatus?: string | null,
): LifecycleStage | null {
  if (lifecycleStage && (LIFECYCLE_STAGES as readonly string[]).includes(lifecycleStage)) {
    return lifecycleStage as LifecycleStage;
  }
  if (!lifecycleStage && legacyStatus) {
    return LEGACY_STATUS_TO_STAGE[legacyStatus] ?? null;
  }
  return null;
}

/** True when the resolved canonical stage is the terminal "Delivered" stage. */
export function isDeliveredStage(
  lifecycleStage: LifecycleStage | string | null | undefined,
  legacyStatus?: string | null,
): boolean {
  return resolveCanonicalStage(lifecycleStage, legacyStatus) === "Delivered";
}

// ─── Legal transition map ─────────────────────────────────────────────────────

/**
 * Transition map: from-stage (or null for initial entry) -> allowed to-stages.
 * Must be kept in sync with the SQL RPC transition_book_lifecycle.
 */
const LEGAL_TRANSITIONS: ReadonlyMap<LifecycleStage | null, ReadonlySet<LifecycleStage>> = new Map([
  [null,                  new Set<LifecycleStage>(["Generated"])],
  ["Generated",           new Set<LifecycleStage>(["Under Review"])],
  ["Under Review",        new Set<LifecycleStage>(["Approved", "Changes Requested"])],
  ["Changes Requested",   new Set<LifecycleStage>(["Revised", "Generated"])],
  ["Revised",             new Set<LifecycleStage>(["Under Review", "Approved"])],
  ["Approved",            new Set<LifecycleStage>(["Ready for Purchase"])],
  ["Ready for Purchase",  new Set<LifecycleStage>(["Purchased"])],
  ["Purchased",           new Set<LifecycleStage>(["Delivered"])],
  ["Delivered",           new Set<LifecycleStage>()],
]);

export interface TransitionValidation {
  allowed: boolean;
  reason?: string;
}

/**
 * Returns whether transitioning from `from` to `to` is a legal move.
 * Pass `null` for `from` to test the initial entry into the lifecycle.
 */
export function isLegalTransition(
  from: LifecycleStage | null,
  to: LifecycleStage,
): TransitionValidation {
  const allowed = LEGAL_TRANSITIONS.get(from);
  if (allowed === undefined) {
    return { allowed: false, reason: `Unknown from-stage: ${String(from)}` };
  }
  if (!allowed.has(to)) {
    return {
      allowed: false,
      reason: `Transition from '${String(from)}' to '${to}' is not permitted`,
    };
  }
  return { allowed: true };
}

/**
 * Returns all stages reachable from `from` in a single step.
 */
export function legalNextStages(from: LifecycleStage | null): LifecycleStage[] {
  const allowed = LEGAL_TRANSITIONS.get(from);
  return allowed ? Array.from(allowed) : [];
}

// ─── Version completeness ─────────────────────────────────────────────────────

export interface VersionCompletenessResult {
  complete: boolean;
  missingFields: string[];
}

/**
 * Checks whether a book version is complete enough for its intended purpose.
 *
 * Default behaviour (suitable for submitting to Under Review):
 *   - pageCount > 0 and pages array is non-empty
 *   - every page has non-empty text_content
 *   - every page has a non-empty illustration_url
 *   - pdf_url NOT required (reviewers work without a PDF)
 *
 * Pass `requirePdf: true` when validating an assembled deliverable.
 *
 * The `isComplete` flag on the BookVersion row is the canonical server-side
 * check; this function lets callers pre-validate before hitting the RPC.
 */
export function checkVersionCompleteness(
  version: Pick<BookVersion, "pageCount" | "pdfUrl">,
  pages: Pick<BookVersionPage, "pageNumber" | "textContent" | "illustrationUrl">[],
  options: { requirePdf?: boolean } = {},
): VersionCompletenessResult {
  const missing: string[] = [];
  // PDF is NOT required by default; reviewers operate before the PDF is generated.
  const requirePdf = options.requirePdf ?? false;

  if (version.pageCount === 0 || pages.length === 0) {
    missing.push("pages (none recorded)");
  }

  if (requirePdf && !version.pdfUrl) {
    missing.push("pdf_url");
  }

  for (const page of pages) {
    if (!page.textContent || page.textContent.trim().length === 0) {
      missing.push(`page ${page.pageNumber}: text_content`);
    }
    if (!page.illustrationUrl || page.illustrationUrl.trim().length === 0) {
      missing.push(`page ${page.pageNumber}: illustration_url`);
    }
  }

  return { complete: missing.length === 0, missingFields: missing };
}

// ─── Material difference helper ───────────────────────────────────────────────

export interface MaterialDifferenceResult {
  hasMaterialDifference: boolean;
  changedPages: number[];
  reason: string[];
}

/**
 * Determines whether two sets of pages have a material difference.
 * A material difference is: different page count, changed text content, or
 * changed illustration URL on any page.
 * Minor metadata changes are NOT considered material.
 */
export function hasMaterialDifference(
  previousPages: Pick<BookVersionPage, "pageNumber" | "textContent" | "illustrationUrl">[],
  nextPages: Pick<BookVersionPage, "pageNumber" | "textContent" | "illustrationUrl">[],
): MaterialDifferenceResult {
  const reasons: string[] = [];
  const changedPages: number[] = [];

  if (previousPages.length !== nextPages.length) {
    reasons.push(
      `Page count changed: ${previousPages.length} -> ${nextPages.length}`,
    );
  }

  const prevMap = new Map(previousPages.map((p) => [p.pageNumber, p]));
  const nextMap = new Map(nextPages.map((p) => [p.pageNumber, p]));

  const allPageNumbers = new Set([
    ...Array.from(prevMap.keys()),
    ...Array.from(nextMap.keys()),
  ]);
  for (const num of Array.from(allPageNumbers)) {
    const prev = prevMap.get(num);
    const next = nextMap.get(num);

    if (!prev && next) {
      changedPages.push(num);
      reasons.push(`Page ${num}: added`);
      continue;
    }
    if (prev && !next) {
      changedPages.push(num);
      reasons.push(`Page ${num}: removed`);
      continue;
    }
    if (prev && next) {
      const textChanged = (prev.textContent ?? "") !== (next.textContent ?? "");
      const illustrationChanged =
        (prev.illustrationUrl ?? "") !== (next.illustrationUrl ?? "");

      if (textChanged || illustrationChanged) {
        changedPages.push(num);
        const fields = [
          textChanged ? "text" : null,
          illustrationChanged ? "illustration" : null,
        ]
          .filter(Boolean)
          .join(", ");
        reasons.push(`Page ${num}: ${fields} changed`);
      }
    }
  }

  return {
    hasMaterialDifference: reasons.length > 0,
    changedPages,
    reason: reasons,
  };
}

// ─── Preview page selection (max 2) ──────────────────────────────────────────

/**
 * Selects up to 2 pages to expose as a preview.
 *
 * Strategy:
 *   1. Pages already marked is_preview = true, sorted by page_number.
 *   2. If fewer than 2 are marked, fill with heuristic selection:
 *      - first page (page 1), then the middle page.
 *   3. Returns at most 2 pages, sorted by page_number ascending.
 */
export function selectPreviewPages(
  pages: (Pick<BookVersionPage, "pageNumber" | "isPreview"> & Record<string, unknown>)[],
): typeof pages {
  const PREVIEW_LIMIT = 2;

  const marked = pages
    .filter((p) => p.isPreview)
    .sort((a, b) => a.pageNumber - b.pageNumber);

  if (marked.length >= PREVIEW_LIMIT) {
    return marked.slice(0, PREVIEW_LIMIT);
  }

  const markedNumbers = new Set(marked.map((p) => p.pageNumber));
  const sorted = pages
    .filter((p) => !markedNumbers.has(p.pageNumber))
    .sort((a, b) => a.pageNumber - b.pageNumber);

  const candidates: typeof pages = [];
  if (sorted.length > 0) candidates.push(sorted[0]);
  if (sorted.length > 2) {
    const mid = Math.floor((sorted.length - 1) / 2);
    if (mid > 0) candidates.push(sorted[mid]);
  } else if (sorted.length === 2) {
    candidates.push(sorted[1]);
  }

  return [...marked, ...candidates]
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .slice(0, PREVIEW_LIMIT);
}

// ─── Delivery prerequisites ───────────────────────────────────────────────────

export interface DeliveryPrerequisiteResult {
  ready: boolean;
  blockers: string[];
}

export interface DeliveryCheckInput {
  /** Current lifecycle stage of the book */
  lifecycleStage: LifecycleStage | null;
  /** True if a paid/fulfilled order with stripe_payment_intent_id and payment_verified_at exists */
  hasPaidOrder: boolean;
  /** True if a delivery_attempt with status='sent', notification_sent_at, access_verified_at exists */
  hasSuccessfulDeliveryAttempt: boolean;
  /** True if a pdf_digital or epub product_artefact with durable_verified_at exists */
  hasDurableVerifiedArtefact: boolean;
  /** True if a non-expired, non-revoked access grant with verified_at exists */
  hasVerifiedAccessGrant: boolean;
  /** The version being delivered (must match approved_version_id if set) */
  currentVersionId: string | null;
  /** The approved version on the book (must match currentVersionId) */
  approvedVersionId: string | null;
}

/**
 * Checks all prerequisites for marking a book as Delivered.
 *
 * Mirrors the database-level checks in transition_book_lifecycle (step 10)
 * so callers can surface actionable errors before the RPC round-trip.
 *
 * Prerequisites:
 *   1. Book must be in 'Purchased' stage.
 *   2. Paid order with verified payment must exist.
 *   3. Successful delivery attempt with notification AND access verification.
 *   4. Durable-verified digital artefact (pdf_digital or epub).
 *   5. Verified, usable access grant.
 *   6. Current version must match the approved version.
 */
export function checkDeliveryPrerequisites(
  input: DeliveryCheckInput,
): DeliveryPrerequisiteResult {
  const blockers: string[] = [];

  if (input.lifecycleStage !== "Purchased") {
    blockers.push(
      `Book must be in 'Purchased' stage before delivery (current: ${String(input.lifecycleStage)})`,
    );
  }

  if (!input.hasPaidOrder) {
    blockers.push(
      "No paid order with verified payment (stripe_payment_intent_id + payment_verified_at) exists",
    );
  }

  if (!input.hasSuccessfulDeliveryAttempt) {
    blockers.push(
      "No successful delivery attempt with notification_sent_at and access_verified_at recorded",
    );
  }

  if (!input.hasDurableVerifiedArtefact) {
    blockers.push(
      "No durable-verified digital artefact (pdf_digital or epub) available for delivery",
    );
  }

  if (!input.hasVerifiedAccessGrant) {
    blockers.push(
      "No verified, usable access grant (full_book / download / gift) exists for this version",
    );
  }

  if (!input.currentVersionId) {
    blockers.push("No version is set on the book");
  } else if (
    input.approvedVersionId !== null &&
    input.approvedVersionId !== undefined &&
    input.approvedVersionId !== input.currentVersionId
  ) {
    blockers.push(
      `Delivering version '${input.currentVersionId}' does not match approved version '${input.approvedVersionId}'`,
    );
  }

  return { ready: blockers.length === 0, blockers };
}

// ─── Re-exports ───────────────────────────────────────────────────────────────
export type { LifecycleStage, BookVersion, BookVersionPage };
