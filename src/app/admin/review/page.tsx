/**
 * Admin review queue.
 *
 * Shows ONLY the stories that need a person to act: pending_review and
 * needs_regeneration. Everything else is deliberately excluded so the queue
 * stays a to-do list rather than a browsable archive.
 *
 * Access is already gated by src/app/admin/layout.tsx (Supabase session +
 * ADMIN_EMAILS allow-list). Each row mints a fresh single-use review link.
 */

import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createReviewToken } from "@/lib/review-tokens";

export const dynamic = "force-dynamic";

export const metadata = { title: "Review queue - Starmee" };

/**
 * Canonical lifecycle stages that require a reviewer to act. "Under Review" and
 * "Revised" are both actionable. "Changes Requested" is awaiting an automated
 * revision, not a person, so it is excluded.
 */
const ACTIONABLE_STAGES = ["Under Review", "Revised"];

/** Legacy status values that map to an actionable review state. Used ONLY as a
 *  fallback for rows without a canonical lifecycle_stage. */
const ACTIONABLE_LEGACY = ["pending_review", "needs_regeneration"];

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

/** Human label for the canonical stage, falling back to legacy status. */
function stageLabel(
  stage: string | null,
  status: string,
): { label: string; needsRegen: boolean } {
  if (stage === "Revised") return { label: "Revised — re-review", needsRegen: false };
  if (stage === "Under Review") return { label: "Under review", needsRegen: false };
  // Legacy fallback (only reached when lifecycle_stage is null).
  if (status === "needs_regeneration")
    return { label: "Needs regeneration", needsRegen: true };
  return { label: "Pending review", needsRegen: false };
}

export default async function ReviewQueuePage() {
  const select =
    "id, public_ref, status, lifecycle_stage, review_version_id, current_version_id, recipient_name, child_name, theme_title, selected_animal, generation_attempts, validation_result, created_at, rejection_reason";

  // Canonical-actionable rows (exact lifecycle stages).
  const { data: canonicalRows } = await supabaseAdmin
    .from("books")
    .select(select)
    .in("lifecycle_stage", ACTIONABLE_STAGES)
    .order("created_at", { ascending: true });

  // Legacy-actionable rows: only those without a canonical stage set.
  const { data: legacyRows } = await supabaseAdmin
    .from("books")
    .select(select)
    .is("lifecycle_stage", null)
    .in("status", ACTIONABLE_LEGACY)
    .order("created_at", { ascending: true });

  const rows = [...(canonicalRows ?? []), ...(legacyRows ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  // Mint each link bound to the EXACT review version (preferring
  // review_version_id, then current_version_id) so the reviewer sees the
  // precise version awaiting approval.
  const links = await Promise.all(
    rows.map((r) => {
      const rec = r as Record<string, unknown>;
      const versionId =
        (rec.review_version_id as string | null) ??
        (rec.current_version_id as string | null) ??
        null;
      return createReviewToken(r.id, versionId);
    }),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-heading text-2xl font-bold text-gray-900">Review queue</h1>
      <p className="mt-1 text-sm text-gray-600">
        {rows.length === 0
          ? "Nothing is waiting for review right now."
          : rows.length + (rows.length === 1 ? " story needs" : " stories need") + " your attention."}
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">
            When a story finishes generating it will appear here for approval.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r, i) => {
            const failures =
              (r.validation_result as { failures?: unknown[] } | null)?.failures?.length ?? 0;
            const lifecycleStage =
              ((r as Record<string, unknown>).lifecycle_stage as string | null) ?? null;
            const { label: stageText, needsRegen } = stageLabel(
              lifecycleStage,
              r.status,
            );
            return (
              <li
                key={r.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {r.recipient_name || r.child_name || "Unnamed"}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {[r.theme_title, r.selected_animal].filter(Boolean).join(" - ") || "No theme recorded"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-gray-400">
                      {(r.public_ref || r.id).slice(0, 12)} - {timeAgo(r.created_at)}
                      {r.generation_attempts ? " - attempt " + r.generation_attempts : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={
                        "rounded-full px-2.5 py-1 text-xs font-medium " +
                        (needsRegen
                          ? "bg-amber-100 text-amber-800"
                          : "bg-violet-100 text-violet-800")
                      }
                    >
                      {stageText}
                    </span>
                    <Link
                      href={"/review/" + links[i]}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
                    >
                      Open review
                    </Link>
                  </div>
                </div>

                {failures > 0 && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    {failures} automated check{failures === 1 ? "" : "s"} failed - read the details on the review screen.
                  </p>
                )}
                {r.rejection_reason && (
                  <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                    Last rejection: {r.rejection_reason}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
