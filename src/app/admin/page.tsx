import { createAdminClient } from "@/lib/supabase/admin";
import { Users, BookOpen, DollarSign, AlertTriangle } from "lucide-react";

async function getStats() {
  const supabase = createAdminClient();

  const [usersRes, booksRes, ordersRes, failedRes, recentBooksRes] =
    await Promise.all([
      supabase.from("child_profiles").select("id", { count: "exact", head: true }),
      supabase.from("books").select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("amount_cents")
        .eq("status", "paid"),
      supabase
        .from("books")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed"),
      supabase
        .from("books")
        .select("id, child_name, theme_title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const totalRevenueCents = (ordersRes.data ?? []).reduce(
    (sum, o) => sum + (o.amount_cents ?? 0),
    0
  );

  return {
    childProfiles: usersRes.count ?? 0,
    totalBooks: booksRes.count ?? 0,
    totalRevenue: totalRevenueCents,
    failedJobs: failedRes.count ?? 0,
    paidOrders: ordersRes.data?.length ?? 0,
    recentBooks: recentBooksRes.data ?? [],
  };
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const statusColor: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  preview_generating: "bg-blue-100 text-blue-700",
  preview_ready: "bg-violet-100 text-violet-700",
  generating: "bg-amber-100 text-amber-700",
  complete: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default async function AdminOverviewPage() {
  const stats = await getStats();

  const cards = [
    {
      label: "Child Profiles",
      value: stats.childProfiles,
      icon: Users,
      color: "text-violet-600 bg-violet-100",
    },
    {
      label: "Total Books",
      value: stats.totalBooks,
      icon: BookOpen,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Revenue",
      value: formatCents(stats.totalRevenue),
      icon: DollarSign,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "Failed Jobs",
      value: stats.failedJobs,
      icon: AlertTriangle,
      color: "text-red-600 bg-red-100",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
              >
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent books */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Recent Books</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.recentBooks.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              No books yet.
            </p>
          ) : (
            stats.recentBooks.map((book: Record<string, string>) => (
              <div
                key={book.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {book.child_name || "Unnamed"} — {book.theme_title || book.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(book.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[book.status] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {book.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
