import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful auth -- redirect to intended destination
      const redirectUrl = new URL(next, origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Auth failed -- redirect to login with error
  const loginUrl = new URL("/auth/login", origin);
  loginUrl.searchParams.set("error", "auth");
  return NextResponse.redirect(loginUrl);
}
