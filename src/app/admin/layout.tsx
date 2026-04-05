import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/books", label: "Books", icon: BookOpen },
  { href: "/admin/failed", label: "Failed Jobs", icon: AlertTriangle },
];

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? [];
  if (adminEmails.length === 0) {
    // If no ADMIN_EMAILS set, allow the first user (dev mode)
    return true;
  }
  return adminEmails.includes(email.toLowerCase());
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Site
            </Link>
            <span className="text-lg font-bold text-violet-700">
              StorySpark Admin
            </span>
          </div>
          <span className="text-xs text-gray-400">{user.email}</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Nav tabs */}
        <nav className="mb-6 flex gap-1 rounded-lg bg-white p-1 border border-gray-200 w-fit">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-violet-50 hover:text-violet-700"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
}
