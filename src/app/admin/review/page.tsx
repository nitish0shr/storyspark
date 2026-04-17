export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { ReviewActions } from "./ReviewActions";

async function getPendingBooks() {
  const supabase = createAdminClient();

  const { data: books } = await supabase
    .from("books")
    .select(
      "id, user_id, child_name, theme_id, theme_title, status, is_purchased, page_count, pdf_url, illustration_urls, created_at, updated_at"
    )
    .eq("status", "pending_review")
    .order("updated_at", { ascending: true });

  // Get count for the badge
  const { count } = await supabase
    .from("books")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_review");

  // Get order info for each book
  const bookIds = (books ?? []).map((b) => b.id);
  let orders: Record<string, { buyer_email: string; tier: string; amount_cents: number }> = {};

  if (bookIds.length > 0) {
    const { data: orderData } = await supabase
      .from("orders")
      .select("book_id, tier, amount_cents, stripe_checkout_session_id")
      .in("book_id", bookIds)
      .eq("status", "paid");

    for (const order of orderData ?? []) {
      orders[order.book_id] = {
        buyer_email: "",
        tier: order.tier || "base",
        amount_cents: order.amount_cents || 0,
      };
    }
  }

  return { books: books ?? [], pendingCount: count ?? 0, orders };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function AdminReviewPage() {
  const { books, pendingCount, orders } = await getPendingBooks();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
        {pendingCount > 0 && (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
            {pendingCount} pending
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Books waiting for your review before delivery to the customer. Check each
        book&apos;s illustrations and text, then approve or reject.
      </p>

      {books.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-lg font-medium text-gray-400">
            No books pending review
          </p>
          <p className="mt-1 text-sm text-gray-400">
            New orders will appear here after the book is generated.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {books.map((book) => {
            const illustrationUrls: (string | null)[] =
              book.illustration_urls ?? [];
            const thumbnails = illustrationUrls
              .filter((url): url is string => !!url)
              .slice(0, 5);
            const order = orders[book.id];

            return (
              <div
                key={book.id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {book.child_name || "Unnamed"} —{" "}
                      {book.theme_title || book.theme_id}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <span>ID: {book.id.slice(0, 8)}…</span>
                      <span>{book.page_count} pages</span>
                      {order && (
                        <span className="font-medium text-green-600">
                          ${(order.amount_cents / 100).toFixed(2)} ({order.tier})
                        </span>
                      )}
                      <span>Generated {timeAgo(book.updated_at)}</span>
                    </div>
                  </div>

                  <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                    pending review
                  </span>
                </div>

                {/* Illustration thumbnails */}
                {thumbnails.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto">
                    {thumbnails.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Page ${idx + 1}`}
                        className="h-28 w-auto rounded-lg border border-gray-200 object-cover"
                      />
                    ))}
                    {illustrationUrls.filter(Boolean).length > 5 && (
                      <div className="flex h-28 w-20 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400">
                        +{illustrationUrls.filter(Boolean).length - 5} more
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href={`/preview/${book.id}`}
                    target="_blank"
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View Full Book
                  </Link>
                  {book.pdf_url && (
                    <a
                      href={book.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50"
                    >
                      Download PDF
                    </a>
                  )}
                  <ReviewActions bookId={book.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
