export const dynamic = "force-dynamic";

import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

type MarginRow = {
  day: string;
  tier: string;
  paid_orders: number;
  revenue_cents: number;
  cost_cents: number;
  gross_margin_cents: number;
  gross_margin_pct: number;
};

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function healthy(pct: number): boolean {
  return pct >= 60;
}

async function getMarginData(): Promise<MarginRow[]> {
  if (!isAdminConfigured()) return [];
  const { data, error } = await supabaseAdmin
    .from("v_daily_margin")
    .select("*")
    .limit(30);

  if (error) {
    console.error("Failed to read v_daily_margin:", error);
    return [];
  }
  return (data ?? []) as MarginRow[];
}

async function getTotals() {
  if (!isAdminConfigured()) {
    return { revenue: 0, cost: 0, orders: 0, unhealthyRows: 0 };
  }
  const { data } = await supabaseAdmin
    .from("orders")
    .select("amount_cents, cost_cents, status")
    .in("status", ["paid", "fulfilled"]);

  const rows = data ?? [];
  const revenue = rows.reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
  const cost = rows.reduce((sum, r) => sum + (r.cost_cents ?? 0), 0);
  return {
    revenue,
    cost,
    orders: rows.length,
    grossMarginPct: revenue === 0 ? 0 : Math.round((100 * (revenue - cost)) / revenue),
  };
}

export default async function AdminCostsPage() {
  const [rows, totals] = await Promise.all([getMarginData(), getTotals()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Costs & Gross Margin</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tracks revenue vs. AI generation cost per order. Alert if any tier dips below
          60% gross margin — investigate before running ads.
        </p>
      </div>

      {/* Top-line totals */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Lifetime Revenue" value={dollars(totals.revenue)} />
        <StatCard label="Lifetime AI Cost" value={dollars(totals.cost)} />
        <StatCard
          label="Gross Margin"
          value={`${totals.grossMarginPct ?? 0}%`}
          accent={healthy(totals.grossMarginPct ?? 0) ? "good" : "bad"}
        />
        <StatCard label="Paid Orders" value={String(totals.orders)} />
      </div>

      {/* Daily breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-700">
          Last 30 days by tier
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            No paid orders yet — data will appear after first purchase.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Day</th>
                  <th className="px-5 py-2 font-medium">Tier</th>
                  <th className="px-5 py-2 font-medium">Orders</th>
                  <th className="px-5 py-2 font-medium">Revenue</th>
                  <th className="px-5 py-2 font-medium">Cost</th>
                  <th className="px-5 py-2 font-medium">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, i) => (
                  <tr key={`${row.day}-${row.tier}-${i}`}>
                    <td className="px-5 py-2 text-gray-700">{row.day}</td>
                    <td className="px-5 py-2 text-gray-700 capitalize">{row.tier}</td>
                    <td className="px-5 py-2 text-gray-700">{row.paid_orders}</td>
                    <td className="px-5 py-2 text-gray-700">
                      {dollars(row.revenue_cents)}
                    </td>
                    <td className="px-5 py-2 text-gray-700">
                      {dollars(row.cost_cents)}
                    </td>
                    <td
                      className={`px-5 py-2 font-medium ${
                        healthy(row.gross_margin_pct)
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {healthy(row.gross_margin_pct) ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {row.gross_margin_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Costs are estimates, not invoice-exact.</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Tune the per-call values in{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5">
              src/lib/cost-estimator.ts
            </code>{" "}
            once you&apos;ve reconciled 30 days of OpenAI + Replicate invoices.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "good" | "bad";
}) {
  const accentColor =
    accent === "good"
      ? "text-emerald-700"
      : accent === "bad"
        ? "text-red-700"
        : "text-gray-900";
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accentColor}`}>{value}</div>
    </div>
  );
}
