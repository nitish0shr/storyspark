export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { Inbox, MessageSquare, Sparkles, Mail } from "lucide-react";

type FormSubmission = {
  id: string;
  type: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  message: string | null;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  created_at: string;
};

async function getSubmissions() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("form_submissions")
    .select(
      "id, type, email, name, company, phone, message, source, utm_source, utm_medium, utm_campaign, utm_term, utm_content, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[admin/leads] supabase select failed", error);
    return [] as FormSubmission[];
  }

  return (data ?? []) as FormSubmission[];
}

const typeColor: Record<string, string> = {
  contact: "bg-blue-100 text-blue-700",
  "demo-request": "bg-violet-100 text-violet-700",
  waitlist: "bg-amber-100 text-amber-700",
  leads: "bg-green-100 text-green-700",
};

const typeIcon: Record<string, typeof Inbox> = {
  contact: MessageSquare,
  "demo-request": Sparkles,
  waitlist: Mail,
  leads: Inbox,
};

export default async function AdminFormSubmissionsPage() {
  const submissions = await getSubmissions();

  const counts = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1;
    return acc;
  }, {});

  const badgeTypes = ["contact", "demo-request", "waitlist", "leads"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Form Submissions</h1>
        <p className="text-xs text-gray-400">Latest 100 — newest first</p>
      </div>

      {/* Count badges per type */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {badgeTypes.map((type) => {
          const Icon = typeIcon[type] ?? Inbox;
          return (
            <div
              key={type}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${typeColor[type] ?? "bg-gray-100 text-gray-600"}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {counts[type] ?? 0}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {type.replace("-", " ")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submissions table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Recent Submissions ({submissions.length})
          </h2>
        </div>

        {submissions.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">
            No form submissions yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">UTM Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 whitespace-nowrap text-gray-500">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor[s.type] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {s.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-800">{s.name ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-800">{s.email}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {s.company ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{s.source}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {s.utm_source ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
