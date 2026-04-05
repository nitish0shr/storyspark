import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function getFailedBooks() {
  if (!isAdminConfigured()) return [];
  const supabase = createAdminClient();

  const { data: books } = await supabase
    .from("books")
    .select(
      "id, user_id, child_name, theme_title, status, created_at, updated_at"
    )
    .eq("status", "failed")
    .order("updated_at", { ascending: false })
    .limit(100);

  return books ?? [];
}

export default async function AdminFailedPage() {
  const books = await getFailedBooks();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Failed Jobs</h1>
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
          {books.length} failed
        </span>
      </div>

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
                  Failed At
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Age
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
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No failed jobs — everything is running smoothly.
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
                      {book.theme_title || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(book.updated_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {timeAgo(book.updated_at)}
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
