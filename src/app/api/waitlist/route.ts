import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function normalizeOrigin(value: string): string | null {
  try {
    const u = new URL(value);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

const ALLOWED_ORIGINS: string[] = [
  process.env.NEXT_PUBLIC_MARKETING_URL || "https://starmeestories.com",
  "https://www.starmeestories.com",
  process.env.NEXT_PUBLIC_APP_URL || "",
]
  .map((v) => (v ? normalizeOrigin(v) : null))
  .filter((v): v is string => !!v);

function corsHeaders(origin: string | null): Record<string, string> {
  const normalized = origin ? normalizeOrigin(origin) : null;
  const isAllowed = !!normalized && ALLOWED_ORIGINS.includes(normalized);
  const allow = isAllowed ? normalized! : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin"));
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").toString().trim().toLowerCase();
    const name = (body.name || "").toString().slice(0, 120) || null;
    const source = (body.source || "wordpress-marketing-site").toString().slice(0, 64);
    const utm_source = (body.utm_source || "").toString().slice(0, 120) || null;
    const utm_medium = (body.utm_medium || "").toString().slice(0, 120) || null;
    const utm_campaign = (body.utm_campaign || "").toString().slice(0, 120) || null;
    const utm_term = (body.utm_term || "").toString().slice(0, 120) || null;
    const utm_content = (body.utm_content || "").toString().slice(0, 120) || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Valid email required" },
        { status: 400, headers },
      );
    }

    if (!isAdminConfigured()) {
      return NextResponse.json(
        { ok: true, stored: false, note: "Supabase not configured; submission accepted but not persisted." },
        { status: 200, headers },
      );
    }

    const { error } = await supabaseAdmin.from("form_submissions").insert({
      type: "waitlist",
      email,
      name,
      source,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    });

    if (error) {
      console.error("[/api/waitlist] supabase insert failed", error);
      return NextResponse.json(
        { ok: true, stored: false, note: "Submission accepted but storage failed; check form_submissions table exists." },
        { status: 200, headers },
      );
    }

    return NextResponse.json({ ok: true, stored: true }, { status: 200, headers });
  } catch (err) {
    console.error("[/api/waitlist] error", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500, headers },
    );
  }
}
