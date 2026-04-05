import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profileId } = await req.json();
  if (!profileId) {
    return NextResponse.json(
      { error: "Missing profileId" },
      { status: 400 }
    );
  }

  // Verify the profile belongs to this user
  const { data: profile } = await supabase
    .from("child_profiles")
    .select("id, user_id")
    .eq("id", profileId)
    .single();

  if (!profile || profile.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete the profile (books are kept for record-keeping)
  const { error } = await supabase
    .from("child_profiles")
    .delete()
    .eq("id", profileId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
