import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ profiles: [] });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profiles } = await supabase
      .from("child_profiles")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ profiles: profiles || [] });
  } catch (error) {
    console.error("Fetch child profiles error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
