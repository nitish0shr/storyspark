import { toFile } from "openai";
import { getOpenAI } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppearanceProfile } from "@/types/child";
import { BookPage } from "@/types/book";
import {
  buildIllustrationPrompt,
  buildReferenceSheetPrompt,
  buildPersonLabel,
  IllustrationCharacter,
} from "@/data/prompts";
import { resolveCreatureFromAnswers } from "@/data/animals";

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

/** A reference image (Character Reference Sheet) attached to a generation call. */
interface ReferenceImage {
  /** Child's name, used to explain image order in the prompt. */
  name: string;
  buffer: Buffer;
}

/**
 * Generates a single illustration.
 *
 * Attempt order per retry:
 *   1. gpt-image-1 via images.edit with the Character Reference Sheet(s) as
 *      input images and input_fidelity "high" (best identity preservation)
 *   2. gpt-image-1 via images.generate (text-only, full Character Profile in prompt)
 *   3. dall-e-3 via images.generate (text-only fallback)
 *
 * Returns a placeholder URL if everything fails after one retry.
 */
async function generateSingleIllustration(
  prompt: string,
  storagePath: string,
  referenceImages: ReferenceImage[] = []
): Promise<string> {
  const openai = getOpenAI();

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      let b64: string | undefined;

      // Attempt 1: gpt-image-1 edit with reference sheet(s)
      if (referenceImages.length > 0) {
        try {
          // File streams are not reusable across calls — create fresh ones each time
          const imageFiles = await Promise.all(
            referenceImages.map((ref, i) =>
              toFile(ref.buffer, `reference-${i + 1}.png`, {
                type: "image/png",
              })
            )
          );
          const res = await openai.images.edit({
            model: "gpt-image-1",
            image: imageFiles,
            prompt: prompt.slice(0, 32000),
            n: 1,
            size: "1024x1024",
            input_fidelity: "high",
          });
          b64 = res.data?.[0]?.b64_json ?? undefined;
          if (!b64) throw new Error("No b64_json from gpt-image-1 edit");
        } catch (editErr) {
          console.error(
            `IDENTITY WARNING: gpt-image-1 edit with reference sheet failed for ${storagePath} — falling back to text-only generation (character likeness may drift): ${
              editErr instanceof Error ? editErr.message : editErr
            }`
          );
        }
      }

      // Attempt 2: gpt-image-1 text-only
      if (!b64) {
        try {
          const res = await openai.images.generate({
            model: "gpt-image-1",
            prompt: prompt.slice(0, 32000),
            n: 1,
            size: "1024x1024",
          });
          b64 = res.data?.[0]?.b64_json ?? undefined;
          if (!b64) throw new Error("No b64_json from gpt-image-1");
        } catch (e1) {
          console.warn(
            `gpt-image-1 failed (attempt ${attempt + 1}): ${
              e1 instanceof Error ? e1.message : e1
            }`
          );
          // Attempt 3: dall-e-3 (no image reference support — prompt still
          // carries the full Character Profile so identity text survives)
          const res = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt.slice(0, 4000),
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
            quality: "standard",
          });
          b64 = res.data?.[0]?.b64_json ?? undefined;
          if (!b64) throw new Error("No b64_json from dall-e-3");
        }
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

  console.error(
    `All illustration attempts exhausted for ${storagePath}, using placeholder`
  );
  return PLACEHOLDER_URL;
}

/** A child to depict in the book's illustrations. */
export interface IllustrationChild {
  name: string;
  age: number;
  gender: string;
  profile: AppearanceProfile;
}

/**
 * Generates a child's canonical Character Reference Sheet image once and
 * uploads it to storage. Returns the public URL, or null on failure (the
 * pipeline then continues with text-only identity preservation).
 */
export async function generateCharacterReferenceSheet(params: {
  child: IllustrationChild;
  storagePath: string;
}): Promise<string | null> {
  const { child, storagePath } = params;
  const openai = getOpenAI();

  const prompt = buildReferenceSheetPrompt({
    name: child.name,
    personLabel: buildPersonLabel(child.age, child.gender),
    profile: child.profile,
  });

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const res = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt.slice(0, 32000),
        n: 1,
        size: "1024x1024",
      });
      const b64 = res.data?.[0]?.b64_json ?? undefined;
      if (!b64) throw new Error("No b64_json from gpt-image-1");
      const buffer = Buffer.from(b64, "base64");
      return await uploadImageToStorage(buffer, storagePath);
    } catch (err) {
      console.warn(
        `Reference sheet attempt ${attempt + 1} failed for ${storagePath}: ${
          err instanceof Error ? err.message : err
        }`
      );
      if (attempt < 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  console.error(
    `IDENTITY WARNING: could not generate Character Reference Sheet at ${storagePath}; illustrations will rely on the text Character Profile only`
  );
  return null;
}

/**
 * Downloads each child's Character Reference Sheet once so the buffers can be
 * reused across every page generation call.
 */
async function downloadReferenceSheets(
  children: IllustrationChild[]
): Promise<ReferenceImage[]> {
  const refs: ReferenceImage[] = [];
  for (const child of children) {
    const url = child.profile.referenceSheetUrl;
    if (!url) continue;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      refs.push({ name: child.name, buffer });
    } catch (err) {
      console.error(
        `IDENTITY WARNING: failed to download reference sheet for ${child.name} (${url}): ${
          err instanceof Error ? err.message : err
        }`
      );
    }
  }
  return refs;
}

/**
 * Generates illustrations for story pages in parallel (max 2 concurrent).
 *
 * Every page prompt is built centrally from each child's Character Profile,
 * and each child's Character Reference Sheet (when available) is attached as
 * a reference image so appearance stays consistent across all pages.
 *
 * @param params.bookId            - Used for constructing Supabase Storage paths
 * @param params.storyPages        - All story text pages
 * @param params.themeId           - Theme identifier
 * @param params.sceneDescriptions - Scene descriptions matching page order
 * @param params.pageNumbers       - If provided, only generate for these page numbers (1-indexed)
 * @param params.children          - One or two children with their Character Profiles
 * @returns Array of image URLs in the same order as input pages/pageNumbers
 */
export async function generateIllustrations(params: {
  bookId: string;
  storyPages: BookPage[];
  themeId: string;
  sceneDescriptions: string[];
  pageNumbers?: number[];
  children: IllustrationChild[];
  contextualAnswers?: Record<string, unknown> | null;
}): Promise<string[]> {
  const { bookId, storyPages, themeId, sceneDescriptions, pageNumbers, children, contextualAnswers } =
    params;

  // The customer-selected animal is a hard requirement, not a suggestion.
  const creature = resolveCreatureFromAnswers(contextualAnswers);

  const outfit = THEME_OUTFITS[themeId] || "a colorful, age-appropriate outfit";

  const characters: IllustrationCharacter[] = children.map((child) => ({
    name: child.name,
    personLabel: buildPersonLabel(child.age, child.gender),
    outfit,
    profile: child.profile,
  }));

  // Download each reference sheet once; reuse the buffers for every page.
  const referenceImages = await downloadReferenceSheets(children);
  const referenceNames = referenceImages.map((r) => r.name);

  const targetPages = pageNumbers
    ? storyPages.filter((p) => pageNumbers.includes(p.pageNumber))
    : storyPages;

  const jobs: Array<{ prompt: string; storagePath: string }> = targetPages.map(
    (page) => {
      const sceneIdx = page.pageNumber - 1;
      const scene =
        sceneDescriptions[sceneIdx] ||
        `A scene from the story: ${page.text.substring(0, 150)}`;

      const prompt = buildIllustrationPrompt({
        sceneDescription: scene,
        characters,
        referenceNames,
        creature,
      });

      const storagePath = `${bookId}/page-${page.pageNumber}.png`;
      return { prompt, storagePath };
    }
  );

  // Generate with concurrency limit of 2 (OpenAI rate-limit friendly)
  const semaphore = new Semaphore(2);
  const results = await Promise.all(
    jobs.map(async ({ prompt, storagePath }) => {
      await semaphore.acquire();
      try {
        return await generateSingleIllustration(
          prompt,
          storagePath,
          referenceImages
        );
      } finally {
        semaphore.release();
      }
    })
  );

  return results;
}
