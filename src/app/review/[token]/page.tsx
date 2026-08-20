/**
 * Reviewer screen. Reached from a signed, expiring, single-use link.
 *
 * Opening this page is READ ONLY — it never changes an order. Approving,
 * rejecting, or requesting changes requires submitting one of the forms below,
 * which POSTs to /api/review/action.
 *
 * The page renders the exact version the token was issued for:
 *   - every page as a text + illustration pair in page_number order
 *   - per-page quality findings from canonical book_quality_findings rows
 *   - before/after diff when the version has a predecessor
 *
 * "Under Review" and "Revised" are both actionable lifecycle stages.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveReviewToken } from "@/lib/review-tokens";
import { toViewableUrls } from "@/lib/storage-urls";
import {
  canRenderCanonicalReview,
  hasCanonicalReviewIdentity,
} from "@/lib/review-page-access";

export const dynamic = "force-dynamic";

const CARD = "rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm";
const LABEL = "text-xs uppercase tracking-wide text-gray-400";
const VALUE = "text-sm text-gray-900 font-medium break-words";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFFBF5] px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Starmee review</h1>
        {children}
      </div>
    </div>
  );
}

function ReviewUnavailable() {
  return (
    <Shell>
      <div className={CARD}>
        <p className="text-gray-700">
          This review link is no longer available. Ask an administrator for a
          fresh link or reconciliation.
        </p>
      </div>
    </Shell>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface QualityFinding {
  code?: string;
  explanation?: string;
  detail?: string;
  severity?: string | null;
  source?: string | null;
  page_number?: number | null;
}

interface VersionPage {
  page_number: number;
  text_content: string | null;
  illustration_url: string | null;
  audio_url?: string | null;
  is_preview: boolean;
  quality_findings: QualityFinding[];
}

interface BookVersionRow {
  id: string;
  version_number: number;
  predecessor_id: string | null;
  created_at: string;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchVersionPages(versionId: string): Promise<VersionPage[]> {
  const { data } = await supabaseAdmin
    .from("book_version_pages")
    .select("page_number, text_content, illustration_url, audio_url, is_preview")
    .eq("version_id", versionId)
    .order("page_number");
  if (!data) return [];
  return data.map((row) => ({
    page_number: row.page_number as number,
    text_content: row.text_content as string | null,
    illustration_url: row.illustration_url as string | null,
    audio_url: (row as Record<string, unknown>).audio_url as string | null ?? null,
    is_preview: row.is_preview as boolean,
    quality_findings: [],
  }));
}

/**
 * Fetch per-version findings from book_quality_findings if the table exists.
 * These are version-level (not page-level) findings with explanation/source.
 */
async function fetchVersionFindings(versionId: string): Promise<QualityFinding[]> {
  try {
    const { data } = await supabaseAdmin
      .from("book_quality_findings")
      .select("page_number, explanation, severity, source, code")
      .eq("version_id", versionId);
    if (!data) return [];
    return data as QualityFinding[];
  } catch {
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Human-readable label for lifecycle_stage or legacy status. */
function stageLabel(stage: string | null, status: string): string {
  if (stage) return stage;
  const map: Record<string, string> = {
    pending_review: "Under Review",
    approved: "Approved",
    delivered: "Delivered",
    needs_regeneration: "Revision pending",
    complete: "Generated",
    draft: "Draft",
    failed: "Failed",
  };
  return map[status] ?? status;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FindingBadge({ finding }: { finding: QualityFinding }) {
  const label = finding.explanation || finding.detail || "";
  const code = finding.code || "";
  const source = finding.source ? ` [${finding.source}]` : "";
  const severity = finding.severity ?? "info";
  const colour =
    severity === "blocker" || severity === "error"
      ? "bg-red-100 text-red-800 border-red-200"
      : severity === "major" || severity === "warning"
        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
        : "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <div className={"mt-1 rounded border px-2 py-1 text-xs " + colour}>
      {code ? <span className="font-mono font-semibold">{code}</span> : null}
      {code && label ? " — " : null}
      {label}
      {source ? <span className="ml-1 text-gray-400">{source}</span> : null}
    </div>
  );
}

function PageCard({
  page,
  imageUrl,
  prevPage,
  prevImageUrl,
  isSuccessor,
}: {
  page: VersionPage;
  imageUrl: string | null;
  prevPage?: VersionPage | null;
  prevImageUrl?: string | null;
  isSuccessor: boolean;
}) {
  const textChanged =
    isSuccessor && prevPage && prevPage.text_content !== page.text_content;
  const imgChanged =
    isSuccessor &&
    prevPage !== undefined &&
    prevImageUrl !== null &&
    prevImageUrl !== imageUrl;

  return (
    <div className={CARD + " space-y-3"}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Page {page.page_number}
        {page.is_preview ? (
          <span className="ml-2 rounded bg-purple-100 px-1 text-purple-700">preview</span>
        ) : null}
      </p>

      {/* Text */}
      <div>
        <p className={LABEL}>Text</p>
        {textChanged && prevPage?.text_content ? (
          <div className="mt-1 space-y-1">
            <div className="rounded bg-red-50 px-2 py-1 text-sm text-red-800 line-through">
              {prevPage.text_content}
            </div>
            <div className="rounded bg-green-50 px-2 py-1 text-sm text-green-800">
              {page.text_content || "(no text)"}
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm leading-relaxed text-gray-800">
            {page.text_content || "(no text)"}
          </p>
        )}
      </div>

      {/* Illustration */}
      {imageUrl || prevImageUrl ? (
        <div>
          <p className={LABEL}>Illustration</p>
          <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {imgChanged && prevImageUrl ? (
              <>
                <div>
                  <p className="mb-1 text-xs text-gray-400">Before</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prevImageUrl}
                    alt={"Previous page " + page.page_number}
                    className="w-full rounded-lg opacity-70 ring-2 ring-red-200"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-400">After</p>
                  {imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imageUrl}
                      alt={"Page " + page.page_number}
                      className="w-full rounded-lg ring-2 ring-green-300"
                    />
                  ) : null}
                </div>
              </>
            ) : imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt={"Page " + page.page_number}
                className="w-full rounded-lg sm:col-span-2"
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Per-page quality findings */}
      {page.quality_findings.length > 0 ? (
        <div>
          <p className={LABEL}>Quality findings</p>
          {page.quality_findings.map((f, i) => (
            <FindingBadge key={i} finding={f} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PageCheckboxes({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <fieldset>
      <legend className={LABEL + " mb-1"}>Affected pages (select all that apply)</legend>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
          <label key={n} className="flex items-center gap-1 text-sm text-gray-700">
            <input type="checkbox" name="affected_pages" value={String(n)} className="accent-[#7C3AED]" />
            {n}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ScopeSelect() {
  return (
    <label className="block">
      <span className={LABEL}>Issue affects</span>
      <select
        name="scope"
        required
        defaultValue=""
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="" disabled>Choose...</option>
        <option value="text">Text only</option>
        <option value="illustration">Illustration only</option>
        <option value="both">Text and illustration</option>
      </select>
    </label>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { token } = await params;
  const { m } = await searchParams;

  const resolved = await resolveReviewToken(token);

  if (
    !hasCanonicalReviewIdentity({
      tokenState: resolved.state,
      bookId: resolved.bookId,
      tokenVersionId: resolved.versionId,
    })
  ) {
    return <ReviewUnavailable />;
  }

  // Fetch the book with both lifecycle_stage and legacy status.
  const { data: book } = await supabaseAdmin
    .from("books")
    .select(
      "id, status, lifecycle_stage, public_ref, purchaser_email, recipient_name, child_name, theme_title, selected_animal, generation_attempts, created_at, review_version_id",
    )
    .eq("id", resolved.bookId)
    .maybeSingle();

  if (!book) return <ReviewUnavailable />;

  const lifecycleStage = (book as Record<string, unknown>).lifecycle_stage as string | null ?? null;
  const reviewVersionId =
    ((book as Record<string, unknown>).review_version_id as string | null) ??
    null;
  const versionId = resolved.versionId as string;

  let version: BookVersionRow | null = null;
  let pages: VersionPage[] = [];
  let pageImageUrls: (string | null)[] = [];
  let versionFindings: QualityFinding[] = [];
  let predecessorPages: VersionPage[] = [];
  let predImageUrls: (string | null)[] = [];
  let isSuccessor = false;

  const { data: vRow } = await supabaseAdmin
    .from("book_versions")
    .select("id, version_number, predecessor_id, created_at")
    .eq("id", versionId)
    .eq("book_id", book.id)
    .maybeSingle();
  version = vRow ? (vRow as unknown as BookVersionRow) : null;

  pages = await fetchVersionPages(versionId);
  if (
    !canRenderCanonicalReview({
      tokenState: resolved.state,
      bookId: resolved.bookId,
      tokenVersionId: resolved.versionId,
      lifecycleStage,
      reviewVersionId,
      versionExists: Boolean(version),
      pageCount: pages.length,
    })
  ) {
    return <ReviewUnavailable />;
  }

  pageImageUrls = await toViewableUrls(pages.map((p) => p.illustration_url));
  versionFindings = await fetchVersionFindings(versionId);
  for (const finding of versionFindings) {
    if (finding.page_number === null || finding.page_number === undefined) continue;
    const page = pages.find((item) => item.page_number === finding.page_number);
    if (page) page.quality_findings.push(finding);
  }

  // Predecessor for before/after diff.
  const predId = version?.predecessor_id ?? null;
  if (predId) {
    isSuccessor = true;
    predecessorPages = await fetchVersionPages(predId);
    predImageUrls = await toViewableUrls(predecessorPages.map((p) => p.illustration_url));
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Shell>
      {m ? (
        <div className="rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/5 p-3 text-sm text-[#5B21B6]">
          {m}
        </div>
      ) : null}

      {/* Book metadata */}
      <div className={CARD}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={LABEL}>Order</p>
            <p className={VALUE}>{(book.public_ref || book.id).slice(0, 12)}</p>
          </div>
          <div>
            <p className={LABEL}>Stage</p>
            <p className={VALUE}>{stageLabel(lifecycleStage, book.status)}</p>
          </div>
          <div>
            <p className={LABEL}>For</p>
            <p className={VALUE}>{book.recipient_name || book.child_name || "-"}</p>
          </div>
          <div>
            <p className={LABEL}>Purchaser</p>
            <p className={VALUE}>{book.purchaser_email || "-"}</p>
          </div>
          <div>
            <p className={LABEL}>Theme</p>
            <p className={VALUE}>{book.theme_title || "-"}</p>
          </div>
          <div>
            <p className={LABEL}>Animal</p>
            <p className={VALUE}>{book.selected_animal || "-"}</p>
          </div>
          <div>
            <p className={LABEL}>Attempt</p>
            <p className={VALUE}>{book.generation_attempts ?? 0}</p>
          </div>
          <div>
            <p className={LABEL}>Created</p>
            <p className={VALUE}>{new Date(book.created_at).toLocaleString()}</p>
          </div>
          {version ? (
            <div className="col-span-2">
              <p className={LABEL}>Version</p>
              <p className={VALUE}>
                {"v" + version.version_number}
                {isSuccessor ? " — successor (diff shown per page)" : " — initial"}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Automated checks */}
      <div className={CARD}>
        <p className={LABEL}>Automated checks</p>
        {versionFindings.length > 0 ? (
          <div className="mt-1 space-y-1">
            {versionFindings.map((f, i) => (
              <FindingBadge key={i} finding={f} />
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-gray-500">
            No findings recorded for this version.
          </p>
        )}
        <p className="mt-3 text-xs text-gray-500">
          Automated checks never release anything. Your approval is what sends it to the customer.
        </p>
      </div>

      {/* Per-page content */}
      {pages.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {"Story pages (" + pages.length + ")"}
          </p>
          {pages.map((page, i) => {
            const predIdx = predecessorPages.findIndex(
              (p) => p.page_number === page.page_number,
            );
            const prevPage = isSuccessor && predIdx !== -1 ? predecessorPages[predIdx] : null;
            const prevImg = isSuccessor && predIdx !== -1 ? (predImageUrls[predIdx] ?? null) : null;

            return (
              <PageCard
                key={page.page_number}
                page={page}
                imageUrl={pageImageUrls[i] ?? null}
                prevPage={prevPage}
                prevImageUrl={prevImg}
                isSuccessor={isSuccessor}
              />
            );
          })}
        </div>
      ) : null}

      {/* Canonical decision forms. Invalid/stale links returned before content. */}
      <>
          {/* Approve */}
          <form method="POST" action="/api/review/action" className={CARD + " space-y-3"}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="action" value="approve" />
            <p className="text-sm font-semibold text-gray-800">Approve this version</p>
            <p className="text-xs text-gray-500">
              Approving sends the exact version you reviewed to the customer. This cannot be undone.
            </p>
            <label className="block">
              <span className={LABEL}>Your name</span>
              <input
                name="reviewer"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                placeholder="Who is reviewing this?"
              />
            </label>
            <label className="block">
              <span className={LABEL}>Notes (optional)</span>
              <textarea
                name="feedback"
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                placeholder="Anything worth recording"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#7C3AED] px-4 py-3 text-base font-semibold text-white"
            >
              Approve and send to customer
            </button>
          </form>

          {/* Request changes */}
          <form method="POST" action="/api/review/action" className={CARD + " space-y-3"}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="action" value="request_changes" />
            <p className="text-sm font-semibold text-gray-800">Request changes</p>
            <p className="text-xs text-gray-500">
              Flag specific pages for revision. The story will be revised and return for review.
            </p>
            <label className="block">
              <span className={LABEL}>Your name</span>
              <input
                name="reviewer"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                placeholder="Who is reviewing this?"
              />
            </label>
            <label className="block">
              <span className={LABEL}>Feedback (required)</span>
              <textarea
                name="feedback"
                rows={3}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                placeholder="Describe what needs to change"
              />
            </label>
            <PageCheckboxes count={pages.length} />
            <ScopeSelect />
            <button
              type="submit"
              className="w-full rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-base font-semibold text-amber-800"
            >
              Request changes
            </button>
          </form>

          {/* Hard reject */}
          <form method="POST" action="/api/review/action" className={CARD + " space-y-3"}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="action" value="reject" />
            <p className="text-sm font-semibold text-gray-800">Reject and regenerate</p>
            <p className="text-xs text-gray-500">
              Hard rejection — the story will be regenerated from scratch using your feedback.
              Use this when the version has fundamental problems.
            </p>
            <label className="block">
              <span className={LABEL}>Your name</span>
              <input
                name="reviewer"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                placeholder="Who is reviewing this?"
              />
            </label>
            <label className="block">
              <span className={LABEL}>Reason (required)</span>
              <textarea
                name="feedback"
                rows={3}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                placeholder="What is fundamentally wrong? The next generation will use this feedback."
              />
            </label>
            <PageCheckboxes count={pages.length} />
            <ScopeSelect />
            <button
              type="submit"
              className="w-full rounded-lg border border-red-300 bg-white px-4 py-3 text-base font-semibold text-red-700"
            >
              Reject and regenerate from scratch
            </button>
          </form>
      </>
    </Shell>
  );
}
