import { supabaseAdmin } from "@/lib/supabase/admin";
import { analyzeFace } from "./face-analysis";
import { replicate } from "@/lib/replicate";
import { AppearanceProfile } from "@/types/child";
import { fillPromptTemplate, ILLUSTRATION_PROMPT_TEMPLATE } from "@/data/prompts";
import { getAppUrl } from "@/lib/utils";

const THEME_LABELS: Record<string, string> = {
  "royal-quest": "Royal Quest 👑",
  "dinosaur-discovery": "Dinosaur Discovery 🦕",
  "space-adventure": "Explore the Galaxy 🚀",
  "under-the-sea": "Under the Sea 🐠",
  "superhero-origin": "Superhero Origin ⚡",
  "kindness-courage": "Kindness & Courage 🌻",
};

async function sendPreviewEmail(params: {
  email: string;
  childName: string;
  previewRequestId: string;
  previewImageUrl: string;
  themeId: string;
}): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return;
  const appUrl = getAppUrl();
  await fetch(`${appUrl}/api/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      type: "preview_ready",
      data: {
        email: params.email,
        childName: params.childName,
        previewRequestId: params.previewRequestId,
        previewImageUrl: params.previewImageUrl,
        themeLabel: THEME_LABELS[params.themeId] || "Adventure",
      },
    }),
  });
}

// Cover scene per theme — single evocative image that works without a full story
const COVER_SCENES: Record<string, string> = {
  "royal-quest":
    "A young adventurer arrives at a glowing magical castle, greeted by friendly talking animals and sparkling lanterns lining the path",
  "dinosaur-discovery":
    "A young explorer in a lush prehistoric jungle discovers a giant friendly dinosaur peeking from behind giant ferns, eyes wide with wonder",
  "space-adventure":
    "A young astronaut floats in a colorful galaxy surrounded by friendly glowing planets, shooting stars, and a cozy rocket ship nearby",
  "under-the-sea":
    "A young child swims through a vibrant coral reef, surrounded by colorful fish, seahorses, and softly glowing sea lanterns",
  "superhero-origin":
    "A young superhero stands confidently on a rooftop at golden hour, cape billowing in the warm wind, city sparkling far below",
  "kindness-courage":
    "A young child stands in a magical meadow at sunrise, surrounded by friendly woodland creatures, butterflies, and golden wildflowers",
};

const THEME_OUTFITS: Record<string, string> = {
  "royal-quest": "a royal traveling cloak with gold trim and a small jeweled crown",
  "dinosaur-discovery": "a khaki explorer outfit with a wide safari hat and little binoculars",
  "space-adventure": "a cute silver space suit with a round glass helmet and star patches",
  "under-the-sea": "a shimmering swimsuit with a magical pearl necklace that glows softly",
  "superhero-origin": "a bright red homemade cape, fun goggles, and colorful boots",
  "kindness-courage": "a cozy soft sweater and comfortable pants with a flower in their hair",
};

const DEFAULT_APPEARANCE: AppearanceProfile = {
  skinTone: "warm medium",
  hairColor: "brown",
  hairStyle: "short straight",
  eyeColor: "brown",
};

export async function generatePreviewImage(previewRequestId: string): Promise<void> {
  try {
    await supabaseAdmin
      .from("preview_requests")
      .update({ status: "generating" })
      .eq("id", previewRequestId);

    const { data: req, error } = await supabaseAdmin
      .from("preview_requests")
      .select("*")
      .eq("id", previewRequestId)
      .single();

    if (error || !req) throw new Error("Preview request not found");

    const themeId: string = req.theme_id || "royal-quest";
    const childAge: number = req.child_age || 5;
    const preferences = (req.preferences as Record<string, string>) || {};
    const gender = preferences.gender || "child";

    // Step 1: Appearance profile — use face analysis if photo provided
    let appearance: AppearanceProfile = DEFAULT_APPEARANCE;
    if (req.photo_url) {
      try {
        const { data: signedData } = await supabaseAdmin.storage
          .from("child-photos")
          .createSignedUrl(req.photo_url, 15 * 60);
        if (signedData?.signedUrl) {
          appearance = await analyzeFace(signedData.signedUrl);
        }
      } catch {
        // Non-fatal: fall through to default appearance
      }
    }

    // Step 2: Build cover image prompt
    const scene = COVER_SCENES[themeId] || COVER_SCENES["royal-quest"];
    const outfit = THEME_OUTFITS[themeId] || "a colorful age-appropriate outfit";
    const genderLabel = gender === "neutral" ? "child" : gender;

    const prompt = fillPromptTemplate(ILLUSTRATION_PROMPT_TEMPLATE, {
      scene_description: scene,
      name: req.child_name || "the child",
      age: String(childAge),
      gender: genderLabel,
      skin_tone: appearance.skinTone,
      hair_color: appearance.hairColor,
      hair_style: appearance.hairStyle,
      eye_color: appearance.eyeColor,
      outfit_for_theme: outfit,
    });

    // Step 3: Generate single cover image via Replicate Flux Schnell
    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: "3:4",
        output_format: "webp",
        output_quality: 90,
      },
    });

    let imageUrl: string;
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = String(output[0]);
    } else {
      throw new Error("Unexpected output from image generation");
    }

    // Step 4: Save result
    await supabaseAdmin
      .from("preview_requests")
      .update({ status: "ready", preview_image_url: imageUrl })
      .eq("id", previewRequestId);

    // Step 5: Email parent — non-fatal if it fails
    if (req.email) {
      sendPreviewEmail({
        email: req.email,
        childName: req.child_name || "your child",
        previewRequestId,
        previewImageUrl: imageUrl,
        themeId,
      }).catch((err) => console.error("Preview email failed:", err));

      await supabaseAdmin
        .from("preview_requests")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", previewRequestId);
    }

  } catch (error) {
    await supabaseAdmin
      .from("preview_requests")
      .update({ status: "failed" })
      .eq("id", previewRequestId);
    throw error;
  }
}
