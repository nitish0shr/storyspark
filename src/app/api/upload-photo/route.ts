import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const photo = formData.get("photo") as File | null;
    const childProfileId = formData.get("childProfileId") as string | null;

    if (!photo) {
      return NextResponse.json(
        { error: "No photo file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(photo.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${photo.type}. Allowed: jpg, png, heic`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large: ${(photo.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB`,
        },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const filename = `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storagePath = `photos/${user.id}/${filename}`;

    // Read file into buffer
    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("photos")
      .upload(storagePath, buffer, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Photo upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload photo" },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("photos")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // If a child profile ID was provided, update the child profile
    if (childProfileId) {
      const { error: updateError } = await supabaseAdmin
        .from("child_profiles")
        .update({
          photo_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", childProfileId)
        .eq("user_id", user.id); // Ensure ownership

      if (updateError) {
        console.error("Failed to update child profile photo:", updateError);
        // Don't fail the request -- photo was uploaded successfully
      }
    }

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload photo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
