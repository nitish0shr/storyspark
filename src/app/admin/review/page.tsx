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

const ACTIONABLE = ["pending_review", "needs_regeneration"];

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

export default async function ReviewQueuePage() {
  const { data } = await supabaseAdmin
    .from("books")
    .select(
      "id, public_ref, status, recipient_name, child_name, theme_title, selected_animal, generation_attempts, validation_result, created_at, rejection_reason",
    )
    .in("status", ACTIONABLE)
    .order("created_at", { ascending: true });

  const rows = data ?? [];
  const links = await Promise.all(rows.map((r) => createReviewToken(r.id)));

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
            const needsRegen = r.status === "needs_regeneration";
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
                      {needsRegen ? "Needs regeneration" : "Pending review"}
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
