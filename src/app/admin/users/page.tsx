export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";

async function getUsers() {
  const supabase = createAdminClient();

  // Get child profiles grouped by user_id as a proxy for "users with activity"
  const { data: profiles } = await supabase
    .from("child_profiles")
    .select("id, user_id, name, age, gender, photo_url, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  // Get book counts per user
  const { data: books } = await supabase
    .from("books")
    .select("user_id, status")
    .limit(500);

  // Get order data per user
  const { data: orders } = await supabase
    .from("orders")
    .select("user_id, amount_cents, status")
    .eq("status", "paid")
    .limit(500);

  // Get email captures
  const { data: emails } = await supabase
    .from("email_captures")
    .select("email, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  // Aggregate by user
  const userMap = new Map<
    string,
    { profiles: typeof profiles; bookCount: number; revenue: number }
  >();

  for (const p of profiles ?? []) {
    if (!userMap.has(p.user_id)) {
      userMap.set(p.user_id, { profiles: [], bookCount: 0, revenue: 0 });
    }
    userMap.get(p.user_id)!.profiles!.push(p);
  }

  for (const b of books ?? []) {
    if (!userMap.has(b.user_id)) {
      userMap.set(b.user_id, { profiles: [], bookCount: 0, revenue: 0 });
    }
    userMap.get(b.user_id)!.bookCount++;
  }

  for (const o of orders ?? []) {
    if (userMap.has(o.user_id)) {
      userMap.get(o.user_id)!.revenue += o.amount_cents;
    }
  }

  const users = Array.from(userMap.entries()).map(([userId, data]) => ({
    userId,
    childCount: data.profiles?.length ?? 0,
    firstChildName: data.profiles?.[0]?.name ?? "—",
    bookCount: data.bookCount,
    revenue: data.revenue,
    joinedAt: data.profiles?.[0]?.created_at ?? "",
  }));

  return { users, emailCaptures: emails ?? [] };
}

function formatCents(cents: number) {
  return cents > 0 ? `$${(cents / 100).toFixed(2)}` : "—";
}

export default async function AdminUsersPage() {
  const { users, emailCaptures } = await getUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>

      {/* Users table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Active Users ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  User ID
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  First Child
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Children
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Books
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Revenue
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-gray-400"
                  >
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.userId} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">
                      {u.userId.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3 text-gray-800">
                      {u.firstChildName}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.childCount}</td>
                    <td className="px-5 py-3 text-gray-600">{u.bookCount}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {formatCents(u.revenue)}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {u.joinedAt
                        ? new Date(u.joinedAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email captures */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Email Captures ({emailCaptures.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {emailCaptures.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              No emails captured yet.
            </p>
          ) : (
            emailCaptures.map(
              (e: { email: string; created_at: string }, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-2.5"
                >
                  <span className="text-sm text-gray-700">{e.email}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(e.created_at).toLocaleDateString()}
                  </span>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
