import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { isReplicateConfigured } from "@/lib/replicate";
import { generatePreviewImage } from "@/services/preview-pipeline";

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }
  if (!isReplicateConfigured()) {
    return NextResponse.json({ error: "Image generation not configured." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const previewRequestId = typeof body.previewRequestId === "string" ? body.previewRequestId : null;
  if (!previewRequestId) {
    return NextResponse.json({ error: "previewRequestId is required." }, { status: 400 });
  }

  // Fetch request — verify it exists and hasn't already been processed
  const { data: req, error } = await supabaseAdmin
    .from("preview_requests")
    .select("id, status")
    .eq("id", previewRequestId)
    .single();

  if (error || !req) {
    return NextResponse.json({ error: "Preview request not found." }, { status: 404 });
  }

  if (req.status === "generating" || req.status === "ready") {
    // Already running or done — just return current state
    return NextResponse.json({ status: req.status, previewRequestId });
  }

  if (req.status === "failed") {
    // Allow retry by resetting to pending first (the pipeline will flip to generating)
    await supabaseAdmin
      .from("preview_requests")
      .update({ status: "pending" })
      .eq("id", previewRequestId);
  }

  // Fire-and-forget — the client polls /api/preview-status/[id] for the result
  generatePreviewImage(previewRequestId).catch((err) => {
    console.error(`Preview image generation failed for ${previewRequestId}:`, err);
  });

  return NextResponse.json({ status: "generating", previewRequestId }, { status: 202 });
}
