import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { PHOTO_BUCKET } from "@/lib/storage";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file");
  const previewRequestId = formData.get("previewRequestId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }
  if (typeof previewRequestId !== "string" || !previewRequestId) {
    return NextResponse.json({ error: "previewRequestId is required." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are accepted." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Photo must be under 10 MB." }, { status: 400 });
  }

  // Verify the preview_request exists and is still pending/generating
  const { data: req, error: fetchErr } = await supabaseAdmin
    .from("preview_requests")
    .select("id, status")
    .eq("id", previewRequestId)
    .single();

  if (fetchErr || !req) {
    return NextResponse.json({ error: "Preview request not found." }, { status: 404 });
  }

  const ext = file.type === "image/png" ? "png" : "jpg";
  const storagePath = `preview/${previewRequestId}/original.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadErr } = await supabaseAdmin.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadErr) {
    console.error("Preview photo upload failed:", uploadErr);
    return NextResponse.json({ error: "Photo upload failed." }, { status: 500 });
  }

  // Store the path (not a public URL — signed URLs are created at generation time)
  const { error: updateErr } = await supabaseAdmin
    .from("preview_requests")
    .update({ photo_url: storagePath })
    .eq("id", previewRequestId);

  if (updateErr) {
    console.error("Failed to update preview_request with photo path:", updateErr);
    return NextResponse.json({ error: "Failed to save photo reference." }, { status: 500 });
  }

  return NextResponse.json({ path: storagePath });
}
