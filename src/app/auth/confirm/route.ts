import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://app.starmeestories.com";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/dashboard";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";

  // Build the redirect base from a stable site URL. Only trust the forwarded
  // host header if it is a real public host (never 0.0.0.0 or localhost).
  let base = SITE;
  if (
    forwardedHost &&
    !forwardedHost.includes("0.0.0.0") &&
    !forwardedHost.includes("localhost")
  ) {
    base = `${proto}://${forwardedHost}`;
  }

  // Final safety net: never redirect to a host containing 0.0.0.0.
  if (base.includes("0.0.0.0")) {
    base = SITE;
  }

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  return NextResponse.redirect(`${base}/auth/login?error=confirm`);
}
