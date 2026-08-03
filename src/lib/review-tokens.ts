/**
 * Secure review links for the Starmee human-approval workflow.
 *
 * Replaces the previous scheme, which derived a token from an HMAC of the
 * book id with a hardcoded fallback secret. That token never expired, was the
 * same for approve and reject, and was forgeable by anyone who could read the
 * repository.
 *
 * This version:
 *   - 32 bytes of CSPRNG entropy per link (never derived from the book id)
 *   - only a SHA-256 hash is stored, so a database leak yields no usable links
 *   - hard expiry (default 7 days)
 *   - single use: consumed the moment a reviewer actually acts
 *   - carries no action, so opening the link can never approve anything
 */

import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

const TOKEN_TTL_DAYS = Number(process.env.REVIEW_TOKEN_TTL_DAYS || 7);

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Issue a fresh review link for a book. Returns the raw token (shown once). */
export async function createReviewToken(bookId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const { error } = await supabaseAdmin.from("book_review_tokens").insert({
    book_id: bookId,
    token_hash: hashToken(token),
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error("Could not create review token: " + error.message);

  return token;
}

export type TokenState = "valid" | "expired" | "used" | "unknown";

export interface ResolvedToken {
  state: TokenState;
  bookId: string | null;
  tokenId: string | null;
}

/**
 * Look up a raw token. Does NOT consume it - a reviewer must be able to open
 * the page, read the story, and only then decide.
 */
export async function resolveReviewToken(token: string): Promise<ResolvedToken> {
  const miss: ResolvedToken = { state: "unknown", bookId: null, tokenId: null };
  if (!token || typeof token !== "string") return miss;

  const { data, error } = await supabaseAdmin
    .from("book_review_tokens")
    .select("id, book_id, expires_at, used_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error || !data) return miss;

  if (data.used_at) {
    return { state: "used", bookId: data.book_id, tokenId: data.id };
  }
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { state: "expired", bookId: data.book_id, tokenId: data.id };
  }
  return { state: "valid", bookId: data.book_id, tokenId: data.id };
}

/**
 * Consume a token. Conditional on used_at still being null, so two reviewers
 * racing on the same link cannot both succeed.
 */
export async function consumeReviewToken(tokenId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("book_review_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenId)
    .is("used_at", null)
    .select("id");
  if (error) return false;
  return Array.isArray(data) && data.length === 1;
}

/** Invalidate every outstanding link for a book (used once it is processed). */
export async function revokeReviewTokens(bookId: string): Promise<void> {
  await supabaseAdmin
    .from("book_review_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("book_id", bookId)
    .is("used_at", null);
}
