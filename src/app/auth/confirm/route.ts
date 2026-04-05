import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/dashboard";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      // OTP verified -- redirect to intended destination
      const redirectUrl = new URL(next, origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Verification failed -- redirect to login with error
  const loginUrl = new URL("/auth/login", origin);
  loginUrl.searchParams.set("error", "confirm");
  return NextResponse.redirect(loginUrl);
}
