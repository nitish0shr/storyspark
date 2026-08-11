/**
 * Reset-password endpoint.
 *
 * Validates the single-use token server-side, updates the password through
 * Supabase Auth's own hashing (admin updateUserById), consumes the token
 * atomically, and best-effort revokes existing sessions. Never logs or
 * returns passwords or token values.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import {
  resolvePasswordResetToken,
  consumePasswordResetToken,
  reopenPasswordResetToken,
} from "@/lib/password-reset-tokens";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";

const INVALID = {
  error:
    "This password reset link is invalid or has expired. Please request a new password reset link.",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";

    // Rate limit attempts per IP: 10/hour.
    const ipCheck = checkRateLimit(
      "pwreset-confirm:ip:" + clientKeyFromHeaders(request.headers),
      10,
      60 * 60 * 1000,
    );
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipCheck.retryAfterSeconds) } },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }
    if (password.length > 128) {
      return NextResponse.json(
        { error: "Password is too long." },
        { status: 400 },
      );
    }

    if (!isAdminConfigured()) {
      console.error("[pwreset] Supabase admin not configured");
      return NextResponse.json(INVALID, { status: 400 });
    }

    const resolved = await resolvePasswordResetToken(token);
    if (resolved.state !== "valid" || !resolved.userId || !resolved.tokenId) {
      return NextResponse.json(INVALID, { status: 400 });
    }

    // Consume first so a racing duplicate request cannot also succeed.
    const consumed = await consumePasswordResetToken(resolved.tokenId);
    if (!consumed) {
      return NextResponse.json(INVALID, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      resolved.userId,
      { password },
    );

    if (updateError) {
      // The password was NOT changed — re-open the token so the user can retry
      // with the same link instead of being locked out.
      await reopenPasswordResetToken(resolved.tokenId);
      console.error("[pwreset] password update failed:", updateError.message);
      const msg = /password/i.test(updateError.message)
        ? "That password doesn't meet the requirements. Please choose a different one."
        : "We couldn't reset your password. Please try again.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Best effort: revoke existing sessions so a compromised account cannot
    // stay signed in elsewhere. Failure here must not fail the reset.
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (url && key) {
        await fetch(`${url}/auth/v1/admin/users/${resolved.userId}/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, apikey: key },
        });
      }
    } catch {
      // ignore — session revocation is best-effort
    }

    return NextResponse.json({
      message:
        "Your password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("[pwreset] unexpected error:", error);
    return NextResponse.json(
      { error: "We couldn't reset your password. Please try again." },
      { status: 500 },
    );
  }
}
