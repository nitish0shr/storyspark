import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FRIENDLY_TYPE_ERROR =
  "We can't open that file. Please upload a JPG, PNG, WEBP, or HEIC photo from your phone or computer.";

const FRIENDLY_SIZE_ERROR = (mb: string) =>
  `That photo is a bit large (${mb}MB). Please choose one under 10MB — most phone photos are well under this.`;

/**
 * Sniff the first bytes of the file to confirm the declared MIME type
 * matches the actual file contents. This stops someone from renaming a
 * .exe to .jpg and uploading it to our storage bucket.
 *
 * Returns the detected type, or null if we can't recognise the bytes.
 */
function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  // WEBP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  // HEIC / HEIF: bytes 4-11 contain "ftypheic", "ftypheix", "ftypmif1", "ftypmsf1", "ftyphevc"
  if (
    buf[4] === 0x66 &&
    buf[5] === 0x74 &&
    buf[6] === 0x79 &&
    buf[7] === 0x70
  ) {
    const brand = buf.slice(8, 12).toString("ascii");
    if (["heic", "heix", "heim", "heis", "hevc", "mif1", "msf1"].includes(brand)) {
      return "image/heic";
    }
  }

  return null;
}

function safeExtension(filename: string | undefined, declaredType: string): string {
  const fromName = filename?.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  if (ALLOWED_EXTENSIONS.has(fromName)) return fromName;
  // Fall back to extension derived from the MIME type
  if (declaredType === "image/jpeg") return "jpg";
  if (declaredType === "image/png") return "png";
  if (declaredType === "image/webp") return "webp";
  if (declaredType === "image/heic" || declaredType === "image/heif") return "heic";
  return "jpg";
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured() || !isAdminConfigured()) {
      return NextResponse.json(
        { error: "Photo uploads are temporarily unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in before uploading a photo." },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const photo = formData.get("photo") as File | null;
    const childProfileId = formData.get("childProfileId") as string | null;

    if (!photo) {
      return NextResponse.json(
        { error: "No photo was attached. Please choose a photo and try again." },
        { status: 400 }
      );
    }

    // Validate declared MIME type
    if (!ALLOWED_TYPES.has(photo.type)) {
      return NextResponse.json({ error: FRIENDLY_TYPE_ERROR }, { status: 400 });
    }

    // Validate file size
    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: FRIENDLY_SIZE_ERROR((photo.size / 1024 / 1024).toFixed(1)) },
        { status: 400 }
      );
    }

    if (photo.size === 0) {
      return NextResponse.json(
        { error: "That photo looks empty. Please try a different file." },
        { status: 400 }
      );
    }

    // Read file into buffer
    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Confirm the actual bytes match the declared type (magic-byte sniff).
    // This blocks renamed executables, scripts, PDFs, etc.
    const sniffed = sniffImageType(buffer);
    if (!sniffed) {
      return NextResponse.json(
        {
          error:
            "That file doesn't look like a photo we can read. Please try a JPG or PNG taken with a phone or camera.",
        },
        { status: 400 }
      );
    }

    // Enforce that the bytes actually match the declared MIME type.
    // HEIC and HEIF share the same container — we treat them as interchangeable.
    const declared = photo.type;
    const heicFamily = new Set(["image/heic", "image/heif"]);
    const matches =
      declared === sniffed ||
      (heicFamily.has(declared) && heicFamily.has(sniffed));
    if (!matches) {
      return NextResponse.json(
        {
          error:
            "That file's contents don't match its type. Please re-export the photo as a standard JPG or PNG and try again.",
        },
        { status: 400 }
      );
    }

    // Generate a unique filename (never trust the user-supplied name for the storage path)
    const ext = safeExtension(photo.name, sniffed);
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const filename = `${timestamp}-${random}.${ext}`;
    const storagePath = `photos/${user.id}/${filename}`;

    // Use the sniffed type as the stored Content-Type so we don't echo whatever
    // the client claimed.
    const safeContentType = sniffed === "image/heic" && photo.type === "image/heif"
      ? "image/heif"
      : sniffed;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("photos")
      .upload(storagePath, buffer, {
        contentType: safeContentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Photo upload failed:", uploadError);
      return NextResponse.json(
        {
          error:
            "We couldn't save your photo just now. Please try again in a moment.",
        },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("photos")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // If a child profile ID was provided, update the child profile (ownership-checked)
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
      {
        error:
          "Something went wrong while uploading. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
