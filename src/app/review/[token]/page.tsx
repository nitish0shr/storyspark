/**
 * Reviewer screen. Reached from a signed, expiring, single-use link.
 *
 * Opening this page is READ ONLY - it never changes an order. Approving or
 * rejecting requires submitting one of the forms below, which POSTs to
 * /api/review/action.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveReviewToken } from "@/lib/review-tokens";

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

  if (!resolved.bookId) {
    return (
      <Shell>
        <div className={CARD}>
          <p className="text-gray-700">
            This review link is not valid. It may have been mistyped, or it may belong
            to an order that has since been removed.
          </p>
        </div>
      </Shell>
    );
  }

  const { data: book } = await supabaseAdmin
    .from("books")
    .select(
      "id, status, public_ref, purchaser_email, recipient_name, child_name, theme_title, selected_animal, story_text, illustration_urls, cover_illustration_url, validation_result, generation_attempts, reviewed_by, reviewed_at, review_notes, rejection_reason, created_at",
    )
    .eq("id", resolved.bookId)
    .maybeSingle();

  if (!book) {
    return (
      <Shell>
        <div className={CARD}>
          <p className="text-gray-700">That order no longer exists.</p>
        </div>
      </Shell>
    );
  }

  const processed = book.status !== "pending_review";
  const images: string[] = Array.isArray(book.illustration_urls)
    ? (book.illustration_urls as string[]).filter(Boolean)
    : [];
  const validation = book.validation_result as
    | { ok?: boolean; failures?: Array<{ code: string; detail: string }> }
    | null;
  const story =
    typeof book.story_text === "string"
      ? book.story_text
      : book.story_text
        ? JSON.stringify(book.story_text, null, 2)
        : "";

  return (
    <Shell>
      {m ? (
        <div className="rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/5 p-3 text-sm text-[#5B21B6]">
          {m}
        </div>
      ) : null}

      <div className={CARD}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={LABEL}>Order</p>
            <p className={VALUE}>{(book.public_ref || book.id).slice(0, 12)}</p>
          </div>
          <div>
            <p className={LABEL}>Status</p>
            <p className={VALUE}>{book.status}</p>
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
        </div>
      </div>

      <div className={CARD}>
        <p className={LABEL}>Automated checks</p>
        {validation ? (
          validation.ok ? (
            <p className="mt-1 text-sm text-green-700">Passed all automated checks.</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
              {(validation.failures || []).map((f, i) => (
                <li key={i}>
                  <span className="font-mono text-xs">{f.code}</span> - {f.detail}
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="mt-1 text-sm text-gray-500">Not run for this version.</p>
        )}
        <p className="mt-3 text-xs text-gray-500">
          Automated checks never release anything. Your approval is what sends it.
        </p>
      </div>

      {images.length > 0 ? (
        <div className={CARD}>
          <p className={LABEL}>Illustrations</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {images.map((src, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={i} src={src} alt={"Page " + (i + 1)} className="w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : null}

      <div className={CARD}>
        <p className={LABEL}>Story</p>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
          {story || "(no story text)"}
        </pre>
      </div>

      {processed ? (
        <div className={CARD}>
          <p className="text-sm font-medium text-gray-900">Already processed</p>
          <p className="mt-1 text-sm text-gray-600">
            This order is currently <strong>{book.status}</strong>
            {book.reviewed_by ? <>, handled by {book.reviewed_by}</> : null}
            {book.reviewed_at ? <> on {new Date(book.reviewed_at).toLocaleString()}</> : null}.
          </p>
          {book.rejection_reason ? (
            <p className="mt-2 text-sm text-gray-600">Reason: {book.rejection_reason}</p>
          ) : null}
        </div>
      ) : resolved.state !== "valid" ? (
        <div className={CARD}>
          <p className="text-sm text-gray-700">
            This link is {resolved.state}. Ask for a fresh review link.
          </p>
        </div>
      ) : (
        <form method="POST" action="/api/review/action" className={CARD + " space-y-3"}>
          <input type="hidden" name="token" value={token} />
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
            <span className={LABEL}>Notes (required to reject)</span>
            <textarea
              name="notes"
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
              placeholder="What is wrong, or anything worth recording"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              name="action"
              value="approve"
              className="w-full rounded-lg bg-[#7C3AED] px-4 py-3 text-base font-semibold text-white"
            >
              Approve and send
            </button>
            <button
              type="submit"
              name="action"
              value="reject"
              className="w-full rounded-lg border border-red-300 bg-white px-4 py-3 text-base font-semibold text-red-700"
            >
              Reject and regenerate
            </button>
          </div>
        </form>
      )}
    </Shell>
  );
}
