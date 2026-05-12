import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";

const MAX_PER_EMAIL_24H = 3;
const MAX_PER_IP_24H = 10;

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
  const childName = typeof body.childName === "string" ? body.childName.trim() : null;
  const childAge = typeof body.childAge === "number" ? body.childAge : null;
  const themeId = typeof body.themeId === "string" ? body.themeId : "royal-quest";
  const preferences = body.preferences && typeof body.preferences === "object" ? body.preferences : null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }
  if (!childName) {
    return NextResponse.json({ error: "Child name is required." }, { status: 400 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Rate limit: email
  const { count: emailCount } = await supabaseAdmin
    .from("preview_requests")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);

  if ((emailCount ?? 0) >= MAX_PER_EMAIL_24H) {
    return NextResponse.json(
      { error: "Too many preview requests from this email. Try again tomorrow." },
      { status: 429 }
    );
  }

  // Rate limit: IP
  if (ip !== "unknown") {
    const { count: ipCount } = await supabaseAdmin
      .from("preview_requests")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", since);

    if ((ipCount ?? 0) >= MAX_PER_IP_24H) {
      return NextResponse.json(
        { error: "Too many requests from your network. Try again tomorrow." },
        { status: 429 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("preview_requests")
    .insert({
      email,
      child_name: childName,
      child_age: childAge,
      theme_id: themeId,
      preferences,
      ip_address: ip,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create preview request:", error);
    return NextResponse.json({ error: "Failed to create preview request." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
