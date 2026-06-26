import { getOpenAI } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppearanceProfile } from "@/types/child";
import { BookPage } from "@/types/book";
import { ILLUSTRATION_PROMPT_TEMPLATE, fillPromptTemplate } from "@/data/prompts";

const STORAGE_BUCKET = "book-illustrations";

const PLACEHOLDER_URL =
  "https://placehold.co/1024x1024/FDF5E7/5E17EB?text=Illustration+Coming+Soon";

/** Outfit descriptions per theme for prompt consistency. */
const THEME_OUTFITS: Record<string, string> = {
  "space-adventure":
    "a cute silver space suit with a round glass helmet and star patches",
  "dinosaur-discovery":
    "a khaki explorer outfit with a safari hat and little binoculars",
  "under-the-sea":
    "a shimmering swimsuit with a magical pearl necklace that glows softly",
  "royal-quest":
    "a royal traveling cloak with gold trim and a small jeweled crown",
  "superhero-origin":
    "a bright red homemade cape, fun goggles, and colorful boots",
  "kindness-courage":
    "a cozy everyday outfit -- a soft sweater and comfortable pants",
  "pirate-treasure":
    "a fun pirate captain outfit with a tricorn hat, striped shirt, and a toy cutlass at the hip",
  "fairy-garden":
    "a delicate outfit made of flower petals and leaves with shimmering fairy wings on the back",
  "safari-adventure":
    "a khaki safari outfit with cargo shorts, a wide-brimmed hat, and a pair of tiny binoculars around the neck",
  "time-travel":
    "a cozy adventure outfit with a leather satchel, goggles pushed up on the forehead, and a golden pocket watch chain",
  "christmas-magic":
    "cozy red and green pajamas with candy cane stripes and a Santa hat slightly tilted to the side",
  "halloween-adventure":
    "a creative Halloween costume with fun accessories, slightly oversized and full of personality",
};

/** Simple semaphore for limiting concurrent async operations. */
class Semaphore {
  private queue: (() => void)[] = [];
  private current = 0;

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.current--;
    const next = this.queue.shift();
    if (next) {
      this.current++;
      next();
    }
  }
}

/**
 * Ensures the illustration storage bucket exists (creates it as public if missing).
 */
async function ensureBucket(): Promise<void> {
  const { error } = await supabaseAdmin.storage.getBucket(STORAGE_BUCKET);
  if (error) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(
      STORAGE_BUCKET,
      { public: true, fileSizeLimit: 10 * 1024 * 1024 }
    );
    if (createError && !createError.message.includes("already exists")) {
      console.warn("Could not create storage bucket:", createError.message);
    }
  }
}

let bucketReady = false;

/**
 * Uploads an image buffer to Supabase Storage and returns the public URL.
 */
async function uploadImageToStorage(
  buffer: Buffer,
  storagePath: string,
  contentType = "image/png"
): Promise<string> {
  if (!bucketReady) {
    await ensureBucket();
    bucketReady = true;
  }

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Generates a single illustration using OpenAI image generation.
 * Tries gpt-image-1 first; falls back to dall-e-3.
 * Returns a placeholder URL if both models fail after one retry.
 */
async function generateSingleIllustration(
  prompt: string,
  storagePath: string
): Promise<string> {
  const openai = getOpenAI();

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      let b64: string | undefined;

      // Attempt 1: gpt-image-1 (returns b64_json by default)
      try {
        const res = await openai.images.generate({
          model: "gpt-image-1",
          prompt: prompt.slice(0, 32000),
          n: 1,
          size: "1024x1024",
        });
        b64 = res.data[0]?.b64_json ?? undefined;
        if (!b64) throw new Error("No b64_json from gpt-image-1");
      } catch (e1) {
        console.warn(`gpt-image-1 failed (attempt ${attempt + 1}): ${e1 instanceof Error ? e1.message : e1}`);
        // Fall back to dall-e-3
        const res = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt.slice(0, 4000),
          n: 1,
          size: "1024x1024",
          response_format: "b64_json",
          quality: "standard",
        });
        b64 = res.data[0]?.b64_json ?? undefined;
        if (!b64) throw new Error("No b64_json from dall-e-3");
      }

      const buffer = Buffer.from(b64, "base64");
      return await uploadImageToStorage(buffer, storagePath);
    } catch (err) {
      console.warn(
        `Illustration attempt ${attempt + 1} failed for ${storagePath}: ${
          err instanceof Error ? err.message : err
        }`
      );
      if (attempt < 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  console.error(`All illustration attempts exhausted for ${storagePath}, using placeholder`);
  return PLACEHOLDER_URL;
}

export interface SecondChildAppearance {
  name: string;
  age: number;
  gender: string;
  appearanceProfile: AppearanceProfile;
}

/**
 * Generates illustrations for story pages in parallel (max 2 concurrent).
 *
 * @param params.bookId         - Used for constructing Supabase Storage paths
 * @param params.storyPages     - All story text pages
 * @param params.appearanceProfile - Child's physical appearance
 * @param params.themeId        - Theme identifier
 * @param params.childAge       - Child's age
 * @param params.childGender    - Child's gender
 * @param params.sceneDescriptions - Scene descriptions matching page order
 * @param params.pageNumbers    - If provided, only generate for these page numbers (1-indexed)
 * @param params.secondChild    - Optional second child appearance for dual-hero books
 * @returns Array of image URLs in the same order as input pages/pageNumbers
 */
export async function generateIllustrations(params: {
  bookId: string;
  storyPages: BookPage[];
  appearanceProfile: AppearanceProfile;
  themeId: string;
  childAge: number;
  childGender: string;
  sceneDescriptions: string[];
  pageNumbers?: number[];
  secondChild?: SecondChildAppearance;
}): Promise<string[]> {
  const {
    bookId,
    storyPages,
    appearanceProfile,
    themeId,
    childAge,
    childGender,
    sceneDescriptions,
    pageNumbers,
    secondChild,
  } = params;

  const outfit = THEME_OUTFITS[themeId] || "a colorful, age-appropriate outfit";
  const genderLabel = childGender === "neutral" ? "child" : childGender;
  const ageLabel = childAge < 0 ? "baby" : String(childAge);

  const targetPages = pageNumbers
    ? storyPages.filter((p) => pageNumbers.includes(p.pageNumber))
    : storyPages;

  const jobs: Array<{ prompt: string; storagePath: string }> = targetPages.map((page) => {
    const sceneIdx = page.pageNumber - 1;
    const scene =
      sceneDescriptions[sceneIdx] ||
      `A scene from the story: ${page.text.substring(0, 150)}`;

    let prompt = fillPromptTemplate(ILLUSTRATION_PROMPT_TEMPLATE, {
      scene_description: scene,
      name: secondChild ? "the first child" : "the child",
      age: ageLabel,
      gender: genderLabel,
      skin_tone: appearanceProfile.skinTone,
      hair_color: appearanceProfile.hairColor,
      hair_style: appearanceProfile.hairStyle,
      eye_color: appearanceProfile.eyeColor,
      outfit_for_theme: outfit,
    });

    if (secondChild) {
      const g2 = secondChild.gender === "neutral" ? "child" : secondChild.gender;
      const a2 = secondChild.age < 0 ? "baby" : String(secondChild.age);
      const ap = secondChild.appearanceProfile;
      prompt += `\n\nSecond main character: A ${a2}-year-old ${g2} with ${ap.skinTone} skin, ${ap.hairColor} ${ap.hairStyle} hair, and ${ap.eyeColor} eyes. Also wearing ${outfit}. Both children should appear together in every scene, interacting and adventuring side by side.`;
    }

    const storagePath = `${bookId}/page-${page.pageNumber}.png`;
    return { prompt, storagePath };
  });

  // Generate with concurrency limit of 2 (OpenAI rate-limit friendly)
  const semaphore = new Semaphore(2);
  const results = await Promise.all(
    jobs.map(async ({ prompt, storagePath }) => {
      await semaphore.acquire();
      try {
        return await generateSingleIllustration(prompt, storagePath);
      } finally {
        semaphore.release();
      }
    })
  );

  return results;
}
