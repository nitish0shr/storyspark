import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusColor: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  preview_generating: "bg-blue-100 text-blue-700",
  preview_ready: "bg-violet-100 text-violet-700",
  generating: "bg-amber-100 text-amber-700",
  complete: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

async function getBooks() {
  if (!isAdminConfigured()) return null;
  const supabase = createAdminClient();

  const { data: books } = await supabase
    .from("books")
    .select(
      "id, user_id, child_name, theme_id, theme_title, status, is_purchased, page_count, pdf_url, created_at, updated_at"
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

  return { books: books ?? [], statusCounts };
}

export default async function AdminBooksPage() {
  const result = await getBooks();
  if (!result) {
    return <div className="p-8 text-center text-gray-500">Books page requires Supabase configuration.</div>;
  }
  const { books, statusCounts } = result;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Books</h1>

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
                    colSpan={8}
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
                      <Link
                        href={`/preview/${book.id}`}
                        className="text-xs text-violet-600 hover:underline"
                      >
                        View
                      </Link>
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
