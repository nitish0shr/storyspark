/**
 * Targeted revision engine (canonical lifecycle edition).
 *
 * When a reviewer requests changes the engine:
 *   1. Records EXACTLY ONE canonical structured revision request
 *      (revision_requests) plus per-page items (revision_request_items,
 *      scoped by `scope`), then transitions once Under Review ->
 *      Changes Requested via the canonical RPC.
 *   2. On revision execution: fetches the current version's pages, copies
 *      unaffected pages as-is, re-generates ONLY the requested pages, performs
 *      duplicate checks (content hash + text similarity), creates an immutable
 *      successor version with a predecessor pointer, resolves the open request,
 *      and transitions the book to "Revised".
 *
 * Rules:
 *   - EVERY lifecycle change goes through the canonical RPC
 *     transition_book_lifecycle — never a direct stage/status UPDATE.
 *   - applyRevision reports ok ONLY if the "Revised" transition actually
 *     succeeds.
 *   - Operational failures (duplicate output, retry exhaustion, transition
 *     failure) are recorded via recordOperationalError.
 *   - Bounded to MAX_REVISION_ATTEMPTS (2) to prevent infinite loops. The
 *     attempt count is derived from the durable count of successor versions,
 *     not a mutable counter column.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createBookVersion,
  fetchVersionPages,
  computeVersionContentHash,
  textSimilarity,
  persistPageFindings,
} from "@/lib/book-versions";
import {
  hasMaterialDifference,
  reviewTokenVersionForStage,
} from "@/lib/book-lifecycle";
import { recordOperationalError } from "@/lib/lifecycle-service";
import type { BookPage, BookVersionPage, LifecycleStage } from "@/types/book";

export type RevisionPageScope = "text" | "illustration" | "both";

export const MAX_REVISION_ATTEMPTS = 2;

// ─── Canonical lifecycle transition (RPC gateway) ──────────────────────────────

interface RpcTransitionResult {
  ok: boolean;
  error?: string;
  message?: string;
  from_stage?: string | null;
  to_stage?: string;
  version_id?: string | null;
  idempotent_replay?: boolean;
}

/** The ONLY way this module changes a lifecycle stage. */
async function transitionLifecycle(params: {
  bookId: string;
  expectedStage: LifecycleStage | null;
  toStage: LifecycleStage;
  versionId: string | null;
  actor: string;
  /**
   * Optimistic-lock counter (books.lifecycle_revision) the caller observed.
   * Passed through as p_expected_revision so a concurrent transition that
   * bumped the counter causes the RPC to reject with revision_conflict rather
   * than silently racing.
   */
  expectedRevision?: number | null;
  reason?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<RpcTransitionResult> {
  const { data, error } = await supabaseAdmin.rpc("transition_book_lifecycle", {
    p_book_id: params.bookId,
    p_expected_stage: params.expectedStage,
    p_to_stage: params.toStage,
    p_version_id: params.versionId,
    p_expected_revision: params.expectedRevision ?? null,
    p_actor: params.actor,
    p_reason: params.reason ?? null,
    p_idempotency_key: params.idempotencyKey ?? null,
    p_metadata: params.metadata ?? null,
  });

  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false, error: "empty_rpc_result" }) as RpcTransitionResult;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RevisionTarget {
  /** Page numbers to re-generate. Empty = regenerate all. */
  pageNumbers: number[];
  /** Human-readable description of what needs to change. */
  reason: string;
  /**
   * Per-page requested scope. Determines which content is regenerated and which
   * is preserved from the predecessor:
   *   - "text":         regenerate story text, RETAIN the existing illustration.
   *   - "illustration": regenerate the illustration, RETAIN the existing text.
   *   - "both":         regenerate both.
   * Pages not present here fall back to `defaultScope`.
   */
  scopeByPage?: Record<number, RevisionPageScope>;
  /** Scope applied to any targeted page missing from `scopeByPage`. Default "both". */
  defaultScope?: RevisionPageScope;
}

/** @deprecated Use RevisionTarget */
export type RevisionScope = RevisionTarget;

export interface RevisionResult {
  ok: boolean;
  newVersionId: string | null;
  newVersionNumber: number | null;
  attemptNumber: number;
  changedPages: number[];
  error?: string;
}

// ─── Injected helpers (pure, testable) ────────────────────────────────────────

export interface RevisionHelpers {
  /**
   * Regenerates story text for the specified pages.
   * Returns an array of BookPages in the same order as `pageNumbers`.
   */
  regenerateStoryPages: (
    bookId: string,
    pageNumbers: number[],
    revisionReason: string,
    currentPages: BookVersionPage[],
  ) => Promise<BookPage[]>;

  /**
   * Regenerates illustrations for the specified pages.
   * Returns URLs in the same order as `storyPages`.
   * MUST return a non-empty URL for every page it is asked to regenerate;
   * a null/empty entry for a regenerated page is treated as a generation
   * failure and aborts the revision (recorded as an operational error).
   */
  regenerateIllustrations: (
    bookId: string,
    storyPages: BookPage[],
    revisionReason: string,
  ) => Promise<(string | null)[]>;

  /**
   * Optional: re-runs automated validation against the freshly-merged
   * successor content BEFORE the "Revised" transition. Returns the findings
   * discovered per page. If ANY blocker finding is returned the revision is
   * aborted (the requested problems were not actually resolved) and the
   * findings are persisted against the new version so a human can see them.
   *
   * When omitted, no automated revalidation runs (the DB RPC still rejects a
   * transition into "Revised" if blocker findings already exist on the version).
   */
  revalidate?: (
    bookId: string,
    mergedPages: BookPage[],
    mergedIllustrationUrls: (string | null)[],
    revisionReason: string,
  ) => Promise<RevisionFinding[]>;
}

export interface RevisionFinding {
  pageNumber: number | null;
  code: string;
  detail: string;
  severity: "minor" | "major" | "blocker";
  source?: "text" | "image" | "both";
}

// ─── Canonical structured revision request ─────────────────────────────────────

export interface RevisionRequestItem {
  pageNumber: number | null;
  /** Content type affected. Canonical column is `scope`. */
  scope: "text" | "illustration" | "both";
  description: string;
  beforeValue?: string | null;
  afterValue?: string | null;
  severity?: "minor" | "major" | "blocker";
}

export interface CanonicalRevisionRequest {
  id: string;
  bookId: string;
  versionId: string | null;
  requestedBy: string;
  decision: "reject" | "request_changes";
  feedback: string;
  items: RevisionRequestItem[];
  createdAt: string;
}

/**
 * Creates EXACTLY ONE canonical structured revision request (revision_requests)
 * with per-page items (revision_request_items) and transitions the book once
 * from "Under Review" -> "Changes Requested" via the canonical RPC.
 *
 * Mandatory: at least one item; every item has a description. The decision is
 * "reject" (hard) or "request_changes" (soft) — both create the same structure
 * and the same single transition. There is no auto-regeneration here.
 */
export async function createRevisionRequest(params: {
  bookId: string;
  versionId: string | null;
  requestedBy: string;
  decision: "reject" | "request_changes";
  feedback: string;
  items: RevisionRequestItem[];
}): Promise<{ ok: boolean; requestId: string | null; error?: string }> {
  const { bookId, versionId, requestedBy, decision, feedback, items } = params;

  if (!feedback || !feedback.trim()) {
    return { ok: false, requestId: null, error: "Feedback is required." };
  }
  if (!items || items.length === 0) {
    return { ok: false, requestId: null, error: "At least one revision item is required." };
  }
  for (const item of items) {
    if (!item.description || !item.description.trim()) {
      return { ok: false, requestId: null, error: "Every revision item needs a description." };
    }
    if (
      item.scope !== "text" &&
      item.scope !== "illustration" &&
      item.scope !== "both"
    ) {
      return { ok: false, requestId: null, error: "Every revision item needs a valid scope." };
    }
  }

  // Resolve the exact version the reviewer acted upon.
  let effectiveVersionId = versionId;
  let expectedRevision: number | null = null;
  {
    const { data: book } = await supabaseAdmin
      .from("books")
      .select("lifecycle_stage, lifecycle_revision, review_version_id, current_version_id")
      .eq("id", bookId)
      .maybeSingle();
    const currentStage = (book?.lifecycle_stage ?? null) as LifecycleStage | null;
    expectedRevision =
      book?.lifecycle_revision === null || book?.lifecycle_revision === undefined
        ? null
        : Number(book.lifecycle_revision);
    if (!effectiveVersionId) {
      effectiveVersionId = reviewTokenVersionForStage({
        stage: currentStage,
        currentVersionId:
          (book?.current_version_id as string | null) ?? null,
        reviewVersionId:
          (book?.review_version_id as string | null) ?? null,
      });
    }
    if (currentStage !== "Under Review") {
      return {
        ok: false,
        requestId: null,
        error: `Book is not Under Review (current stage: ${currentStage ?? "none"}).`,
      };
    }
    if (
      effectiveVersionId === null ||
      book?.review_version_id !== effectiveVersionId
    ) {
      return {
        ok: false,
        requestId: null,
        error: "The reviewed version is stale or no longer under review.",
      };
    }
  }

  if (expectedRevision === null || !effectiveVersionId) {
    return {
      ok: false,
      requestId: null,
      error: "The book has no canonical lifecycle revision or review version.",
    };
  }
  const decisionKey = computeVersionContentHash([
    {
      pageNumber: expectedRevision,
      textContent: `${bookId}:${effectiveVersionId}:${decision}:${requestedBy}:${feedback}`,
      illustrationUrl: null,
    },
  ]);
  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
    "create_revision_request_and_transition",
    {
      p_book_id: bookId,
      p_version_id: effectiveVersionId,
      p_expected_revision: expectedRevision,
      p_requested_by: requestedBy,
      p_decision: decision,
      p_feedback: feedback,
      p_items: items.map((item) => ({
        page_number: item.pageNumber,
        scope: item.scope,
        description: item.description,
        before_value: item.beforeValue ?? null,
        after_value: item.afterValue ?? null,
        severity: item.severity ?? "major",
      })),
      p_idempotency_key: `changes-requested-${decisionKey}`,
    },
  );
  const result = (rpcData ?? {}) as {
    ok?: boolean;
    request_id?: string;
    error?: string;
    message?: string;
  };
  if (rpcError || !result.ok || !result.request_id) {
    return {
      ok: false,
      requestId: null,
      error:
        "Failed to record the atomic revision decision: " +
        (rpcError?.message ?? result.error ?? result.message ?? "unknown"),
    };
  }
  return { ok: true, requestId: result.request_id };
}

/**
 * Reads the per-page scopes recorded on a canonical revision request's items.
 * Returns a page-number -> scope map plus the set of explicitly-targeted page
 * numbers (null page = whole-book comment, ignored for page targeting). When
 * multiple items touch the same page, "both" wins over a single-content scope.
 */
async function fetchRequestScopes(
  revisionRequestId: string,
): Promise<{ scopeByPage: Record<number, RevisionPageScope>; pageNumbers: number[] }> {
  const scopeByPage: Record<number, RevisionPageScope> = {};
  const pageNumbers = new Set<number>();

  const { data, error } = await supabaseAdmin
    .from("revision_request_items")
    .select("page_number, scope")
    .eq("revision_request_id", revisionRequestId);

  if (error || !data) {
    return { scopeByPage, pageNumbers: [] };
  }

  for (const row of data as Array<{ page_number: number | null; scope: string }>) {
    if (row.page_number === null || row.page_number === undefined) continue;
    const pn = row.page_number;
    pageNumbers.add(pn);
    const scope = (row.scope as RevisionPageScope) ?? "both";
    const existing = scopeByPage[pn];
    // "both" is the widest scope; escalate when scopes conflict.
    if (!existing) {
      scopeByPage[pn] = scope;
    } else if (existing !== scope) {
      scopeByPage[pn] = "both";
    }
  }

  return { scopeByPage, pageNumbers: Array.from(pageNumbers).sort((a, b) => a - b) };
}

/** Marks an open revision request as addressed. */
async function resolveRevisionRequest(requestId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("revision_requests")
    .update({ status: "addressed", resolved_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "open");

  if (error) {
    console.warn("[revision-engine] Failed to resolve revision request:", error.message);
  }
}

// ─── Duplicate detection ───────────────────────────────────────────────────────

const TEXT_SIMILARITY_THRESHOLD = 0.95; // Jaccard similarity

function isDuplicateContent(
  previousPages: BookVersionPage[],
  newPages: BookPage[],
  newIllustrationUrls: (string | null)[],
): { isDuplicate: boolean; reason: string } {
  // 1. Content hash check (exact duplicate)
  const previousHash = computeVersionContentHash(
    previousPages.map((p) => ({
      pageNumber: p.pageNumber,
      textContent: p.textContent,
      illustrationUrl: p.illustrationUrl,
    })),
  );
  const newHash = computeVersionContentHash(
    newPages.map((p, i) => ({
      pageNumber: p.pageNumber,
      textContent: p.text,
      illustrationUrl: newIllustrationUrls[i] ?? null,
    })),
  );

  if (previousHash === newHash) {
    return { isDuplicate: true, reason: "Content hash identical to previous version" };
  }

  // 2. Text similarity check across all pages
  const prevText = previousPages.map((p) => p.textContent ?? "").join(" ");
  const newText = newPages.map((p) => p.text).join(" ");
  const sim = textSimilarity(prevText, newText);

  if (sim >= TEXT_SIMILARITY_THRESHOLD) {
    return {
      isDuplicate: true,
      reason: `Text similarity ${(sim * 100).toFixed(1)}% >= ${TEXT_SIMILARITY_THRESHOLD * 100}% threshold`,
    };
  }

  return { isDuplicate: false, reason: "" };
}

/**
 * Durable attempt count: the number of successor versions already created for
 * this book (versions with a predecessor). Used to enforce
 * MAX_REVISION_ATTEMPTS without a mutable counter column.
 */
async function countRevisionAttempts(bookId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("book_versions")
    .select("id", { count: "exact", head: true })
    .eq("book_id", bookId)
    .not("predecessor_id", "is", null);
  return count ?? 0;
}

// ─── Main revision function ────────────────────────────────────────────────────

/**
 * Executes a targeted revision for a book in "Changes Requested" stage.
 *
 * Reports ok ONLY if the successor version is created AND the "Revised"
 * transition succeeds. Duplicate output and retry exhaustion are recorded as
 * operational failures.
 *
 * @param bookId       - Book to revise
 * @param scope        - Which pages to regenerate and why
 * @param helpers      - Injected regeneration helpers (pure, testable)
 * @param revisionRequestId - Optional ID of the canonical revision request to resolve
 */
export async function applyRevision(
  bookId: string,
  scope: RevisionTarget,
  helpers: RevisionHelpers,
  revisionRequestId?: string | null,
): Promise<RevisionResult> {
  const fail = (attemptNumber: number, changedPages: number[], error: string): RevisionResult => ({
    ok: false,
    newVersionId: null,
    newVersionNumber: null,
    attemptNumber,
    changedPages,
    error,
  });

  // ── Fetch book ──────────────────────────────────────────────────────────────
  const { data: book, error: bookErr } = await supabaseAdmin
    .from("books")
    .select("id, lifecycle_stage, lifecycle_revision, current_version_id")
    .eq("id", bookId)
    .maybeSingle();

  if (bookErr || !book) {
    return fail(0, [], "Book not found: " + (bookErr?.message ?? "unknown"));
  }

  const currentStage = (book.lifecycle_stage ?? null) as LifecycleStage | null;
  const expectedRevision: number | null =
    book.lifecycle_revision === null || book.lifecycle_revision === undefined
      ? null
      : Number(book.lifecycle_revision);

  // ── Enforce stage constraint ────────────────────────────────────────────────
  if (currentStage !== "Changes Requested") {
    return fail(0, [], `Book must be in 'Changes Requested' stage (currently '${currentStage}')`);
  }

  // ── Enforce max revision attempts (durable count of successor versions) ─────
  const priorAttempts = await countRevisionAttempts(bookId);
  if (priorAttempts >= MAX_REVISION_ATTEMPTS) {
    await recordOperationalError(
      bookId,
      "revision_retry_exhausted",
      new Error(`Maximum revision attempts (${MAX_REVISION_ATTEMPTS}) reached`),
    );
    return fail(priorAttempts, [], `Maximum revision attempts (${MAX_REVISION_ATTEMPTS}) reached`);
  }

  const attemptNumber = priorAttempts + 1;

  // ── Fetch current version pages ────────────────────────────────────────────
  const predecessorVersionId = book.current_version_id as string | null;
  if (!predecessorVersionId) {
    return fail(attemptNumber, [], "No current_version_id on book — cannot derive predecessor");
  }

  const predecessorPages = await fetchVersionPages(predecessorVersionId);
  if (predecessorPages.length === 0) {
    return fail(attemptNumber, [], "Predecessor version has no pages");
  }

  // ── Resolve per-page scopes ────────────────────────────────────────────────
  // Priority: explicit scopeByPage on the target > scopes recorded on the
  // canonical revision request items > defaultScope > "both".
  const defaultScope: RevisionPageScope = scope.defaultScope ?? "both";
  const scopeByPage: Record<number, RevisionPageScope> = { ...(scope.scopeByPage ?? {}) };
  let requestPageNumbers: number[] = [];
  if (revisionRequestId) {
    const fetched = await fetchRequestScopes(revisionRequestId);
    requestPageNumbers = fetched.pageNumbers;
    for (const [pn, s] of Object.entries(fetched.scopeByPage)) {
      const num = Number(pn);
      if (scopeByPage[num] === undefined) scopeByPage[num] = s;
    }
  }

  // ── Determine which pages to regenerate ────────────────────────────────────
  // Explicit target > canonical request items > whole book.
  const targetPageNumbers =
    scope.pageNumbers.length > 0
      ? scope.pageNumbers
      : requestPageNumbers.length > 0
        ? requestPageNumbers
        : predecessorPages.map((p) => p.pageNumber);

  const predecessorByNumber = new Map<number, BookVersionPage>(
    predecessorPages.map((p) => [p.pageNumber, p]),
  );

  const scopeFor = (pageNumber: number): RevisionPageScope =>
    scopeByPage[pageNumber] ?? defaultScope;

  const unaffectedPages = predecessorPages.filter(
    (p) => !targetPageNumbers.includes(p.pageNumber),
  );

  // Pages whose STORY TEXT must be regenerated (scope "text" or "both").
  const textTargets = targetPageNumbers.filter((n) => {
    const s = scopeFor(n);
    return s === "text" || s === "both";
  });
  // Pages whose ILLUSTRATION must be regenerated (scope "illustration" or "both").
  const illustrationTargets = new Set(
    targetPageNumbers.filter((n) => {
      const s = scopeFor(n);
      return s === "illustration" || s === "both";
    }),
  );

  // ── Regenerate targeted story text (only text/both pages) ──────────────────
  let regeneratedStory: BookPage[] = [];
  if (textTargets.length > 0) {
    try {
      regeneratedStory = await helpers.regenerateStoryPages(
        bookId,
        textTargets,
        scope.reason,
        predecessorPages,
      );
    } catch (err) {
      await recordOperationalError(
        bookId,
        "revision_story_regeneration_failed",
        err instanceof Error ? err : new Error(String(err)),
      );
      return fail(
        attemptNumber,
        [],
        "Story regeneration failed: " + (err instanceof Error ? err.message : String(err)),
      );
    }
  }
  const regeneratedStoryByNumber = new Map<number, BookPage>(
    regeneratedStory.map((p) => [p.pageNumber, p]),
  );

  // ── Build the merged story: preserve unaffected + illustration-only text ───
  const mergedPages: BookPage[] = predecessorPages
    .map((p) => {
      const regen = regeneratedStoryByNumber.get(p.pageNumber);
      return {
        pageNumber: p.pageNumber,
        // illustration-only and unaffected pages RETAIN their original text.
        text: regen ? regen.text : (p.textContent ?? ""),
      };
    })
    .sort((a, b) => a.pageNumber - b.pageNumber);

  // ── Regenerate targeted illustrations (only illustration/both pages) ───────
  // We only ask the illustration helper for pages that actually need a new
  // image; text-only and unaffected pages keep the predecessor URL.
  const illustrationInputs = mergedPages.filter((p) => illustrationTargets.has(p.pageNumber));
  let regeneratedUrls: (string | null)[] = [];
  if (illustrationInputs.length > 0) {
    try {
      regeneratedUrls = await helpers.regenerateIllustrations(
        bookId,
        illustrationInputs,
        scope.reason,
      );
    } catch (err) {
      // Illustration generation is a REQUESTED change here — failing it means
      // the revision cannot honour the reviewer's request. Record explicitly.
      await recordOperationalError(
        bookId,
        "revision_illustration_generation_failed",
        err instanceof Error ? err : new Error(String(err)),
      );
      return fail(
        attemptNumber,
        [],
        "Illustration generation failed: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
    // A null/empty URL for a page we explicitly asked to regenerate is a
    // generation failure — do not silently ship a page with no image.
    const missingIndex = regeneratedUrls.findIndex(
      (u) => !u || !String(u).trim(),
    );
    if (regeneratedUrls.length !== illustrationInputs.length || missingIndex !== -1) {
      const failedPage =
        missingIndex !== -1 ? illustrationInputs[missingIndex]?.pageNumber : "unknown";
      await recordOperationalError(
        bookId,
        "revision_illustration_generation_failed",
        new Error(
          `Illustration generation returned no image for page ${String(failedPage)}`,
        ),
      );
      return fail(
        attemptNumber,
        [],
        `Illustration generation returned no image for page ${String(failedPage)}`,
      );
    }
  }
  const regeneratedUrlByNumber = new Map<number, string | null>();
  illustrationInputs.forEach((p, i) =>
    regeneratedUrlByNumber.set(p.pageNumber, regeneratedUrls[i] ?? null),
  );

  // ── Build merged illustration URLs (aligned to mergedPages order) ──────────
  const mergedUrls: (string | null)[] = mergedPages.map((p) => {
    if (illustrationTargets.has(p.pageNumber)) {
      return regeneratedUrlByNumber.get(p.pageNumber) ?? null;
    }
    // text-only and unaffected pages RETAIN their existing illustration.
    return predecessorByNumber.get(p.pageNumber)?.illustrationUrl ?? null;
  });

  // Reference unaffectedPages so its intent is explicit (used for clarity/tests).
  void unaffectedPages;

  // ── Duplicate detection ────────────────────────────────────────────────────
  const { isDuplicate, reason: dupReason } = isDuplicateContent(
    predecessorPages,
    mergedPages,
    mergedUrls,
  );

  if (isDuplicate) {
    await recordOperationalError(
      bookId,
      "revision_duplicate_output",
      new Error(dupReason),
    );
    return fail(attemptNumber, [], `Revision produced no material change: ${dupReason}`);
  }

  // ── Material difference check ──────────────────────────────────────────────
  const { hasMaterialDifference: hasDiff, changedPages } = hasMaterialDifference(
    predecessorPages.map((p) => ({
      pageNumber: p.pageNumber,
      textContent: p.textContent,
      illustrationUrl: p.illustrationUrl,
    })),
    mergedPages.map((p, i) => ({
      pageNumber: p.pageNumber,
      textContent: p.text,
      illustrationUrl: mergedUrls[i] ?? null,
    })),
  );

  if (!hasDiff) {
    await recordOperationalError(
      bookId,
      "revision_no_material_difference",
      new Error("Revision produced no material difference from predecessor"),
    );
    return fail(attemptNumber, [], "Revision produced no material difference from predecessor");
  }

  // ── Create immutable successor version ────────────────────────────────────
  const createResult = await createBookVersion({
    bookId,
    storyPages: mergedPages,
    illustrationUrls: mergedUrls,
    predecessorVersionId,
    metadata: {
      revisionAttempt: attemptNumber,
      revisionReason: scope.reason,
      changedPages,
      scopeByPage,
      revisionRequestId: revisionRequestId ?? null,
    },
  });

  if (!createResult.ok || !createResult.versionId) {
    return fail(
      attemptNumber,
      changedPages,
      createResult.error ?? "Failed to create successor version",
    );
  }

  const newVersionId = createResult.versionId;

  // ── Revalidate the successor BEFORE advancing to Revised ───────────────────
  // The reviewer asked for specific fixes; we must confirm the successor does
  // not still carry blocker-level problems. Findings are persisted against the
  // NEW version (per page) so a human can see them if the gate blocks. This
  // mirrors the DB RPC, which independently refuses "Revised" while any blocker
  // finding exists on the version.
  if (helpers.revalidate) {
    let findings: RevisionFinding[] = [];
    try {
      findings = await helpers.revalidate(bookId, mergedPages, mergedUrls, scope.reason);
    } catch (err) {
      await recordOperationalError(
        bookId,
        "revision_revalidation_failed",
        err instanceof Error ? err : new Error(String(err)),
      );
      return {
        ...fail(attemptNumber, changedPages, "Revalidation of the successor failed: " +
          (err instanceof Error ? err.message : String(err))),
        newVersionId,
        newVersionNumber: createResult.versionNumber,
      };
    }

    // Persist findings per page against the new version.
    if (findings.length > 0) {
      const byPage = new Map<number | null, RevisionFinding[]>();
      for (const f of findings) {
        const key = f.pageNumber ?? null;
        byPage.set(key, [...(byPage.get(key) ?? []), f]);
      }
      for (const [pageNumber, list] of Array.from(byPage.entries())) {
        await persistPageFindings(
          newVersionId,
          pageNumber,
          list.map((f: RevisionFinding) => ({
            code: f.code,
            detail: f.detail,
            severity: f.severity,
            source: f.source ?? "both",
          })),
        );
      }
    }

    const blockers = findings.filter((f) => f.severity === "blocker");
    if (blockers.length > 0) {
      await recordOperationalError(
        bookId,
        "revision_unresolved_findings",
        new Error(
          "Revision did not resolve requested findings: " +
            blockers.map((f) => `${f.pageNumber ?? "book"}:${f.code}`).join(", "),
        ),
      );
      return {
        ...fail(
          attemptNumber,
          changedPages,
          "Revision did not resolve the requested findings; " +
            blockers.length +
            " blocker(s) remain.",
        ),
        newVersionId,
        newVersionNumber: createResult.versionNumber,
      };
    }
  }

  // ── Transition to Revised (bind exact successor version) ──────────────────
  const transition = await transitionLifecycle({
    bookId,
    expectedStage: "Changes Requested",
    expectedRevision,
    toStage: "Revised",
    versionId: newVersionId,
    actor: "revision-engine",
    reason: `Revision attempt ${attemptNumber}: ${scope.reason}`,
    idempotencyKey: "revised-" + newVersionId,
    metadata: { attemptNumber, changedPages },
  });

  if (!transition.ok) {
    // The version exists, but the workflow did NOT advance — report failure.
    await recordOperationalError(
      bookId,
      "revised_transition",
      new Error(transition.error ?? transition.message ?? "transition rejected"),
    );
    return {
      ok: false,
      newVersionId,
      newVersionNumber: createResult.versionNumber,
      attemptNumber,
      changedPages,
      error:
        "Successor version created but transition to Revised failed: " +
        (transition.error ?? transition.message ?? "unknown"),
    };
  }

  // The canonical transition owns the current-version pointer. Only after it
  // succeeds do we synchronise legacy render fields and resolve the request.
  const { error: legacySyncError } = await supabaseAdmin
    .from("books")
    .update({
      updated_at: new Date().toISOString(),
      story_text: mergedPages as unknown as Record<string, unknown>[],
      illustration_urls: mergedUrls,
    })
    .eq("id", bookId)
    .eq("current_version_id", newVersionId);
  if (legacySyncError) {
    await recordOperationalError(
      bookId,
      "revision_legacy_sync",
      new Error(legacySyncError.message),
    );
  }
  if (revisionRequestId) {
    await resolveRevisionRequest(revisionRequestId);
  }

  return {
    ok: true,
    newVersionId,
    newVersionNumber: createResult.versionNumber,
    attemptNumber,
    changedPages,
  };
}
