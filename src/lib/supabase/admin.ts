import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using the service role key.
 * Bypasses Row Level Security -- use only in trusted server-side code
 * (API routes, background jobs, webhooks).
 *
 * Lazy-initialized to avoid errors during build when env vars are not set.
 */
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    _supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _supabaseAdmin;
}

// Convenience alias used by admin pages
export const createAdminClient = getSupabaseAdmin;

// Convenience alias for backward compatibility
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
