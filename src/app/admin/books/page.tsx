export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { storySkeletons } from "@/data/story-skeletons";
import {
  evaluateLegacyRecoveryEligibility,
  legacyRecoveryConfirmation,
} from "@/lib/legacy-recovery";

const statusColor: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  preview_generating: "bg-blue-100 text-blue-700",
  preview_ready: "bg-violet-100 text-violet-700",
  generating: "bg-amber-100 text-amber-700",
  complete: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

// Exact canonical lifecycle stages.
const stageColor: Record<string, string> = {
  Generated: "bg-gray-100 text-gray-700",
  "Under Review": "bg-amber-100 text-amber-700",
  "Changes Requested": "bg-orange-100 text-orange-700",
  Revised: "bg-blue-100 text-blue-700",
  Approved: "bg-emerald-100 text-emerald-700",
  "Ready for Purchase": "bg-violet-100 text-violet-700",
  Purchased: "bg-indigo-100 text-indigo-700",
  Delivered: "bg-green-100 text-green-700",
};

async function getBooks() {
  const supabase = createAdminClient();

  const { data: books } = await supabase
    .from("books")
    .select(
      "id, user_id, child_name, theme_id, theme_title, status, lifecycle_stage, is_purchased, page_count, pdf_url, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  // Get status distribution
  const { data: allBooks } = await supabase
    .from("books")
    .select("status")
    .limit(1000);

  const statusCounts: Record<string, number> = {};
  for (const b of allBooks ?? []) {
    statusCounts[b.status] = (statusCounts[b.status] ?? 0) + 1;
  }

  // Lifecycle-null legacy books are deliberately loaded without the general
  // 100-row table limit so incomplete records cannot disappear from recovery.
  const { data: legacyBooks } = await supabase
    .from("books")
    .select(
      "id, child_name, theme_id, theme_title, status, lifecycle_stage, is_purchased, page_count, operational_state, operational_error, generation_attempts, created_at",
    )
    .is("lifecycle_stage", null)
    .order("created_at", { ascending: true });

  const legacyIds = (legacyBooks ?? []).map((book) => book.id);
  let versions: Array<{
    book_id: string;
    is_complete: boolean;
    page_count: number;
  }> = [];
  let paidOrders: Array<{ book_id: string }> = [];
  if (legacyIds.length > 0) {
    const [versionsResult, paidOrdersResult] = await Promise.all([
      supabase
        .from("book_versions")
        .select("book_id, is_complete, page_count")
        .in("book_id", legacyIds),
      supabase
        .from("orders")
        .select("book_id")
        .in("book_id", legacyIds)
        .in("status", ["paid", "fulfilled"]),
    ]);
    versions = versionsResult.data ?? [];
    paidOrders = paidOrdersResult.data ?? [];
  }

  const recoveryRows = (legacyBooks ?? []).map((book) => {
    const bookVersions = versions.filter(
      (version) => version.book_id === book.id,
    );
    const paidOrderCount = paidOrders.filter(
      (order) => order.book_id === book.id,
    ).length;
    const eligibility = evaluateLegacyRecoveryEligibility({
      lifecycleStage: book.lifecycle_stage,
      legacyStatus: book.status,
      isPurchased: Boolean(book.is_purchased),
      paidOrderCount,
      completeVersionCount: bookVersions.filter(
        (version) => version.is_complete,
      ).length,
      operationalState: book.operational_state,
      skeletonPageNumbers: (storySkeletons[book.theme_id] ?? []).map(
        (page) => page.pageNumber,
      ),
    });
    return {
      ...book,
      versionCount: bookVersions.length,
      completeVersionCount: bookVersions.filter(
        (version) => version.is_complete,
      ).length,
      paidOrderCount,
      eligibility,
      confirmation: legacyRecoveryConfirmation(book.id),
    };
  });

  return { books: books ?? [], statusCounts, recoveryRows };
}

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams?: { notice?: string; error?: string };
}) {
  const { books, statusCounts, recoveryRows } = await getBooks();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Books</h1>

      {searchParams?.notice ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {searchParams.notice}
        </p>
      ) : null}
      {searchParams?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {searchParams.error}
        </p>
      ) : null}

      <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-amber-950">
              Controlled legacy recovery ({recoveryRows.length})
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-amber-900">
              These books have no canonical lifecycle stage. They remain
              unpurchasable and undeliverable until a complete immutable
              version is explicitly recovered. Nothing in this list regenerates
              or promotes a book automatically.
            </p>
          </div>
          <Link
            href="/admin/review"
            className="text-sm font-medium text-amber-900 underline"
          >
            Canonical review queue
          </Link>
        </div>

        {recoveryRows.length === 0 ? (
          <p className="mt-4 text-sm text-amber-800">
            No lifecycle-null books need controlled recovery.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {recoveryRows.map((book) => (
              <article
                key={book.id}
                className="rounded-lg border border-amber-200 bg-white p-4"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {book.child_name || "Unnamed book"} ·{" "}
                      {book.theme_title || book.theme_id}
                    </p>
                    <p className="mt-1 font-mono text-xs text-gray-500">
                      {book.id}
                    </p>
                    <p className="mt-2 text-xs text-gray-700">
                      Legacy status: <strong>{book.status}</strong> · legacy
                      pages: {book.page_count ?? 0} · immutable versions:{" "}
                      {book.versionCount} ({book.completeVersionCount} complete)
                      {" · "}paid orders: {book.paidOrderCount}
                      {book.generation_attempts
                        ? ` · recorded attempts: ${book.generation_attempts}`
                        : ""}
                    </p>
                    <p
                      className={`mt-2 text-sm font-medium ${
                        book.eligibility.allowed
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      {book.eligibility.reason}
                    </p>
                    {book.operational_error ? (
                      <p className="mt-1 text-xs text-red-700">
                        Last operational error: {book.operational_error}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href={`/preview/${book.id}`}
                    className="text-xs text-violet-700 underline"
                  >
                    Inspect legacy preview
                  </Link>
                </div>

                {book.eligibility.allowed ? (
                  <form
                    action="/api/admin/regenerate-legacy-book"
                    method="post"
                    className="mt-4 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <input type="hidden" name="bookId" value={book.id} />
                    <p className="text-xs text-gray-700">
                      This starts one paid AI story generation plus exactly 12
                      illustrations. Automatic regeneration is disabled. Type{" "}
                      <code className="font-semibold">{book.confirmation}</code>{" "}
                      to confirm.
                    </p>
                    <input
                      name="confirmation"
                      required
                      autoComplete="off"
                      placeholder={book.confirmation}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs"
                    />
                    <label className="flex items-start gap-2 text-xs text-gray-800">
                      <input
                        type="checkbox"
                        name="acknowledgeCost"
                        value="yes"
                        required
                        className="mt-0.5"
                      />
                      I authorise one controlled 12-page generation attempt and
                      understand that it incurs AI generation cost.
                    </label>
                    <button
                      type="submit"
                      className="w-fit rounded-md bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800"
                    >
                      Regenerate canonical 12-page version
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Status distribution */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div
            key={status}
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[status] ?? "bg-gray-100 text-gray-600"}`}
          >
            {status}: {count}
          </div>
        ))}
      </div>

      {/* Books table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Child
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Theme
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Stage
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Purchased
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  PDF
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Created
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {books.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No books yet.
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {book.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {book.child_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {book.theme_title || book.theme_id}
                    </td>
                    <td className="px-4 py-3">
                      {book.lifecycle_stage ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${stageColor[book.lifecycle_stage] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {book.lifecycle_stage}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[book.status] ?? "bg-gray-100"}`}
                      >
                        {book.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {book.is_purchased ? "✓" : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {book.pdf_url ? (
                        <a
                          href={book.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-600 hover:underline"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(book.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Link
                          href={`/preview/${book.id}`}
                          className="text-xs text-violet-600 hover:underline"
                        >
                          View
                        </Link>
                        {book.lifecycle_stage === "Approved" ? (
                          <form
                            action="/api/admin/retry-approval-invitation"
                            method="post"
                          >
                            <input type="hidden" name="bookId" value={book.id} />
                            <button
                              type="submit"
                              className="text-left text-xs font-medium text-amber-700 hover:underline"
                            >
                              Retry invitation
                            </button>
                          </form>
                        ) : null}
                        {book.lifecycle_stage === "Purchased" ||
                        book.lifecycle_stage === "Delivered" ? (
                          <form
                            action="/api/admin/retry-purchase-confirmation"
                            method="post"
                          >
                            <input type="hidden" name="bookId" value={book.id} />
                            <button
                              type="submit"
                              className="text-left text-xs font-medium text-indigo-700 hover:underline"
                            >
                              Retry purchase email
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
