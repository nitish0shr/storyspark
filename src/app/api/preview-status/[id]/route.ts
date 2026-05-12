import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("preview_requests")
    .select("id, status, preview_image_url, child_name, theme_id")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Preview not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    previewImageUrl: data.preview_image_url,
    childName: data.child_name,
    themeId: data.theme_id,
  });
}
