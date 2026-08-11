/**
 * Forgot-password endpoint.
 *
 * Security properties:
 *  - Response is identical whether or not the email exists (no enumeration).
 *  - Rate limited per IP and per email address.
 *  - The raw token is only ever placed in the outbound email, never logged
 *    and never returned in the response.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { createPasswordResetToken } from "@/lib/password-reset-tokens";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";

const GENERIC = {
  message:
    "If an account exists for that email address, we've sent you a password reset link. Please check your inbox.",
};

const TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 60);
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    // Rate limit: 5 requests/hour per IP and 3/hour per email address.
    const ipKey = "pwreset:ip:" + clientKeyFromHeaders(request.headers);
    const emailKey = "pwreset:email:" + email;
    const ipCheck = checkRateLimit(ipKey, 5, WINDOW_MS);
    const emailCheck = checkRateLimit(emailKey, 3, WINDOW_MS);
    if (!ipCheck.allowed || !emailCheck.allowed) {
      const retry = Math.max(ipCheck.retryAfterSeconds, emailCheck.retryAfterSeconds);
      return NextResponse.json(
        { error: "Too many reset requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retry) } },
      );
    }

    if (!isAdminConfigured()) {
      // Do not reveal configuration state; log for operators only.
      console.error("[pwreset] Supabase admin not configured");
      return NextResponse.json(GENERIC);
    }

    // Look up the user server-side (service role only). Any failure from here
    // on still returns the generic message so responses are indistinguishable.
    const { data: userId, error: lookupError } = await supabaseAdmin.rpc(
      "get_user_id_by_email",
      { p_email: email },
    );

    if (lookupError) {
      console.error("[pwreset] user lookup failed:", lookupError.message);
      return NextResponse.json(GENERIC);
    }

    if (userId) {
      try {
        const token = await createPasswordResetToken(userId as string);
        const result = await sendPasswordResetEmail(email, token, TTL_MINUTES);
        if (!result.sent) {
          console.error("[pwreset] email not sent:", result.reason);
        }
      } catch (err) {
        console.error(
          "[pwreset] token/email step failed:",
          err instanceof Error ? err.message : String(err),
        );
      }
    }

    return NextResponse.json(GENERIC);
  } catch (error) {
    console.error("[pwreset] unexpected error:", error);
    return NextResponse.json(GENERIC);
  }
}
