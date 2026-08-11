/**
 * Secure, self-service password reset tokens.
 *
 * Same design as review-tokens:
 *   - 32 bytes of CSPRNG entropy per link (never derived from user data)
 *   - only a SHA-256 hash is stored, so a database leak yields no usable links
 *   - hard expiry (default 1 hour)
 *   - single use: consumed atomically the moment the password is changed
 */

import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

const TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 60);

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Issue a fresh reset token for a user. Returns the raw token (shown once). */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  // Invalidate any outstanding links first — only the latest link works.
  await supabaseAdmin
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("used_at", null);

  const { error } = await supabaseAdmin.from("password_reset_tokens").insert({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error("Could not create password reset token: " + error.message);

  return token;
}

export type ResetTokenState = "valid" | "expired" | "used" | "unknown";

export interface ResolvedResetToken {
  state: ResetTokenState;
  userId: string | null;
  tokenId: string | null;
}

/** Look up a raw token without consuming it. */
export async function resolvePasswordResetToken(
  token: string,
): Promise<ResolvedResetToken> {
  const miss: ResolvedResetToken = { state: "unknown", userId: null, tokenId: null };
  if (!token || typeof token !== "string" || token.length > 200) return miss;

  const { data, error } = await supabaseAdmin
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error || !data) return miss;

  if (data.used_at) return { state: "used", userId: data.user_id, tokenId: data.id };
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { state: "expired", userId: data.user_id, tokenId: data.id };
  }
  return { state: "valid", userId: data.user_id, tokenId: data.id };
}

/**
 * Consume a token. Conditional on used_at still being null, so two racing
 * requests with the same link cannot both succeed.
 */
export async function consumePasswordResetToken(tokenId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenId)
    .is("used_at", null)
    .select("id");
  if (error) return false;
  return Array.isArray(data) && data.length === 1;
}

/** Re-open a consumed token (only used when the password update itself failed). */
export async function reopenPasswordResetToken(tokenId: string): Promise<void> {
  await supabaseAdmin
    .from("password_reset_tokens")
    .update({ used_at: null })
    .eq("id", tokenId);
}
