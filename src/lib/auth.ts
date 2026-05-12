import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AuthContext = {
  supabase: SupabaseClient;
  user: User;
};

export function getAdminEmails(): string[] {
  return (
    process.env.ADMIN_EMAILS?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) return false;
  return adminEmails.includes(email.toLowerCase());
}

export function isAdminConfigured(): boolean {
  return getAdminEmails().length > 0;
}

export async function getOptionalUser(): Promise<AuthContext | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = (await createClient()) as SupabaseClient;
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { supabase, user };
}

export async function requireUser(): Promise<AuthContext> {
  const context = await getOptionalUser();
  if (!context) {
    throw new Error("Unauthorized");
  }
  return context;
}

export async function requireAdmin(): Promise<AuthContext> {
  if (!isAdminConfigured()) {
    throw new Error("Admin access is not configured");
  }

  const context = await requireUser();
  if (!isAdminEmail(context.user.email)) {
    throw new Error("Forbidden");
  }

  return context;
}

export function statusForAuthError(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "Unauthorized") return 401;
  if (message === "Forbidden") return 403;
  if (message === "Admin access is not configured") return 503;
  return 500;
}
