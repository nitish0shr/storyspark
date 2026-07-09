import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { getOpenAI, isOpenAIConfigured } from "@/lib/openai";
import { AppearanceProfile } from "@/types/child";

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

const VISION_PROMPT = `You are helping a children's book illustrator build a Character Profile so the illustrated child closely resembles this photo. Look carefully at the child and return ONLY a JSON object describing their physical appearance. Do NOT include the child's name or any identifying information.

The JSON object must have exactly these string keys (use "" when something is not visible or not applicable):
- "hairColor": e.g. "golden blonde", "dark brown"
- "hairStyle": how the hair is worn, e.g. "loose with a side fringe", "two braided pigtails"
- "hairLength": e.g. "short", "shoulder-length", "long"
- "hairTexture": e.g. "straight", "wavy", "curly", "coily"
- "skinTone": e.g. "fair with warm undertones", "medium olive", "deep brown"
- "faceShape": e.g. "round with soft cheeks", "oval"
- "facialFeatures": distinctive facial features, e.g. "button nose, dimpled smile, rosy cheeks"
- "eyeColor": e.g. "bright blue", "warm brown"
- "eyeShape": e.g. "large and round", "almond-shaped"
- "approximateAge": e.g. "about 5-6 years old"
- "freckles": e.g. "light freckles across the nose and cheeks", or "" if none
- "glasses": describe them if worn, e.g. "round red-framed glasses", or "" if none
- "distinctiveFeatures": any other visual characteristics that help recognise the child, e.g. "gap between front teeth", or ""
- "description": a 1-2 sentence prose summary of the child's overall appearance`;

/** Whitelisted Character Profile keys accepted from the vision model. */
const PROFILE_KEYS = [
  "hairColor",
  "hairStyle",
  "hairLength",
  "hairTexture",
  "skinTone",
  "faceShape",
  "facialFeatures",
  "eyeColor",
  "eyeShape",
  "approximateAge",
  "freckles",
  "glasses",
  "distinctiveFeatures",
  "description",
] as const;

/**
 * Parses and sanitises the vision model's JSON into an AppearanceProfile.
 * Returns null if nothing usable was extracted.
 */
function parseProfile(raw: string): AppearanceProfile | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const obj = parsed as Record<string, unknown>;
  const cleaned: Record<string, string> = {};
  for (const key of PROFILE_KEYS) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      cleaned[key] = value.trim().slice(0, 300);
    }
  }
  if (Object.keys(cleaned).length === 0) return null;

  return {
    skinTone: cleaned.skinTone || "warm medium",
    hairColor: cleaned.hairColor || "brown",
    hairStyle: cleaned.hairStyle || "short straight",
    eyeColor: cleaned.eyeColor || "brown",
    ...cleaned,
  } as AppearanceProfile;
}

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

    let profile: AppearanceProfile | null = null;
    let rawContent = "";
    try {
      const openai = getOpenAI();
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${sniffed};base64,${base64}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 600,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: VISION_PROMPT },
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
            ],
          },
        ],
      });

      rawContent = response.choices[0]?.message?.content?.trim() ?? "";
      profile = parseProfile(rawContent);
    } catch (visionErr) {
      console.error("Vision analysis failed:", visionErr);
    } finally {
      await supabaseAdmin.storage.from(PHOTOS_BUCKET).remove([tempPath]);
    }

    if (!profile) {
      console.error(
        "Photo analysis produced no usable Character Profile",
        rawContent ? `(raw: ${rawContent.slice(0, 200)})` : "(no content)"
      );
      return NextResponse.json(
        { error: "Could not read the photo. Please try again or skip this step." },
        { status: 500 }
      );
    }

    const description =
      profile.description ||
      [
        profile.hairColor && `${profile.hairColor} ${profile.hairTexture || ""} hair`.trim(),
        profile.skinTone && `${profile.skinTone} skin`,
        profile.eyeColor && `${profile.eyeColor} eyes`,
      ]
        .filter(Boolean)
        .join(", ");

    return NextResponse.json({ description, profile }, { status: 200 });
  } catch (err) {
    console.error("Analyze photo error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or skip this step." },
      { status: 500 }
    );
  }
}
