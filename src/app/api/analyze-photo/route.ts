import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { getOpenAI, isOpenAIConfigured } from "@/lib/openai";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PHOTOS_BUCKET = "photos";

function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf[0] === 0x89 && buf[1] === 0x50 &&
    buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a &&
    buf[6] === 0x1a && buf[7] === 0x0a
  ) return "image/png";
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  return null;
}

const VISION_PROMPT =
  "Describe this child's physical appearance briefly for a children's book illustrator. Include ONLY: hair colour and style, skin tone, eye colour, approximate age appearance, and any notable features like glasses or freckles. Do NOT include the child's name or any identifying information. Keep it to 1–2 sentences. Example: \"A child with curly auburn hair, fair freckled skin, and bright green eyes, appearing about 5–6 years old.\"";

async function ensurePrivateBucket(): Promise<void> {
  const { error } = await supabaseAdmin.storage.getBucket(PHOTOS_BUCKET);
  if (error) {
    await supabaseAdmin.storage.createBucket(PHOTOS_BUCKET, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE,
    });
  } else {
    await supabaseAdmin.storage.updateBucket(PHOTOS_BUCKET, { public: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isOpenAIConfigured() || !isAdminConfigured()) {
      return NextResponse.json(
        { error: "Photo analysis is temporarily unavailable. You can skip this step." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const photo = formData.get("photo") as File | null;

    if (!photo) {
      return NextResponse.json({ error: "No photo attached." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(photo.type)) {
      return NextResponse.json(
        { error: "Please upload a JPG, PNG, or WEBP photo." },
        { status: 400 }
      );
    }

    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Photo is too large (${(photo.size / 1024 / 1024).toFixed(1)} MB). Please choose one under 10 MB.` },
        { status: 400 }
      );
    }

    if (photo.size === 0) {
      return NextResponse.json(
        { error: "That photo appears empty. Please try a different file." },
        { status: 400 }
      );
    }

    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const sniffed = sniffImageType(buffer);
    if (!sniffed || !ALLOWED_TYPES.has(sniffed)) {
      return NextResponse.json(
        { error: "That file doesn't look like a valid photo. Please use a JPG, PNG, or WEBP image." },
        { status: 400 }
      );
    }

    const ext = sniffed === "image/jpeg" ? "jpg" : sniffed === "image/png" ? "png" : "webp";
    const tempPath = `temp/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    await ensurePrivateBucket();

    const { error: uploadError } = await supabaseAdmin.storage
      .from(PHOTOS_BUCKET)
      .upload(tempPath, buffer, { contentType: sniffed, upsert: false });

    if (uploadError) {
      console.error("Temp photo upload failed:", uploadError);
      return NextResponse.json(
        { error: "Could not process your photo. Please try again." },
        { status: 500 }
      );
    }

    let description = "";
    try {
      const openai = getOpenAI();
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${sniffed};base64,${base64}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 150,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: VISION_PROMPT },
              { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
            ],
          },
        ],
      });

      description = response.choices[0]?.message?.content?.trim() ?? "";
    } catch (visionErr) {
      console.error("Vision analysis failed:", visionErr);
    } finally {
      await supabaseAdmin.storage.from(PHOTOS_BUCKET).remove([tempPath]);
    }

    if (!description) {
      return NextResponse.json(
        { error: "Could not read the photo. Please try again or skip this step." },
        { status: 500 }
      );
    }

    return NextResponse.json({ description }, { status: 200 });
  } catch (err) {
    console.error("Analyze photo error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or skip this step." },
      { status: 500 }
    );
  }
}
