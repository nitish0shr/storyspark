import { toFile } from "openai";
import {
  getOpenAI,
  isTransientOpenAIError,
  isRetryableProviderError,
  toRetryableProviderError,
} from "@/lib/openai";
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
import { objectPathFromStored } from "@/lib/storage-urls";

const STORAGE_BUCKET = "book-illustrations";
export const REFERENCE_STORAGE_BUCKET = "character-reference-sheets";
export const PRIVATE_REFERENCE_PREFIX = "private-reference://";

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
 * Ensures a storage bucket exists without changing an existing bucket's live
 * privacy setting.
 */
async function ensureBucket(
  bucket: string,
  isPublic: boolean,
): Promise<void> {
  const { error } = await supabaseAdmin.storage.getBucket(bucket);
  if (error) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(
      bucket,
      { public: isPublic, fileSizeLimit: 10 * 1024 * 1024 }
    );
    if (createError && !createError.message.includes("already exists")) {
      console.warn("Could not create storage bucket:", createError.message);
    }
  }
}

const readyBuckets = new Set<string>();

/**
 * Uploads an image buffer to Supabase Storage and returns the bare object
 * path (e.g. "<bookId>/page-1.png"). Bare paths are what we persist in the
 * database; callers that need a viewable URL sign the path on demand via
 * `toViewableUrl` from `@/lib/storage-urls`.
 */
async function uploadImageToStorage(
  buffer: Buffer,
  storagePath: string,
  contentType = "image/png",
  bucket = STORAGE_BUCKET,
  isPublic = true,
): Promise<string> {
  if (!readyBuckets.has(bucket)) {
    await ensureBucket(bucket, isPublic);
    readyBuckets.add(bucket);
  }

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Return the bare object path — NOT a public/signed URL.
  return storagePath;
}

export function privateReferenceLocator(storagePath: string): string {
  return `${PRIVATE_REFERENCE_PREFIX}${storagePath.replace(/^\/+/, "")}`;
}

export function parseReferenceLocator(storedValue: string): {
  bucket: string;
  objectPath: string;
} | null {
  if (storedValue.startsWith(PRIVATE_REFERENCE_PREFIX)) {
    const objectPath = storedValue.slice(PRIVATE_REFERENCE_PREFIX.length);
    return objectPath
      ? { bucket: REFERENCE_STORAGE_BUCKET, objectPath }
      : null;
  }
  const objectPath = objectPathFromStored(storedValue);
  return objectPath ? { bucket: STORAGE_BUCKET, objectPath } : null;
}

/** A reference image (Character Reference Sheet) attached to a generation call. */
interface ReferenceImage {
  /** Child's name, used to explain image order in the prompt. */
  name: string;
  buffer: Buffer;
}

/**
 * Downloads a reference sheet directly through the authenticated Supabase
 * Storage service role — no raw fetch or persisted bearer URLs.
 *
 * New values are opaque private-reference locators. Legacy bare paths, public
 * URLs, and signed URLs are read from the illustration bucket for migration
 * compatibility, but the URL itself is never fetched.
 */
async function downloadReferenceSheetAuthenticated(
  storedValue: string,
  label: string
): Promise<Buffer> {
  const location = parseReferenceLocator(storedValue);
  if (!location) {
    throw new Error(
      `Cannot resolve the private character reference for ${label}`,
    );
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(location.bucket)
      .download(location.objectPath);

    if (error || !data) {
      throw new Error(
        `Authenticated character reference download failed for ${label}: ${
          error?.message ?? "no data"
        }`,
      );
    }

    return Buffer.from(await data.arrayBuffer());
  } catch (err) {
    throw new Error(
      `Authenticated character reference download failed for ${label}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

/**
 * Generates a single illustration.
 *
 * Attempt order:
 *   1. gpt-image-1 via images.edit with the Character Reference Sheet(s) as
 *      input images and input_fidelity "high" (best identity preservation).
 *      Eligible transient errors are retried by the OpenAI SDK.
 *   2. gpt-image-1 via images.generate (text-only, full Character Profile in prompt).
 *
 * A final transient provider error is classified and re-thrown immediately. We
 * never multiply SDK retries or fall through to a placeholder after a 429.
 */
async function generateSingleIllustration(
  prompt: string,
  storagePath: string,
  referenceImages: ReferenceImage[] = []
): Promise<string> {
  const openai = getOpenAI();

  // Two outer attempts (one retry on non-transient / upload failures).
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      let b64: string | undefined;

      // Attempt 1: gpt-image-1 edit with reference sheet(s)
      if (referenceImages.length > 0) {
        try {
          // File streams are not reusable across calls — create fresh ones each time.
          // The SDK recreates the HTTP request for its own bounded retry policy.
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
          if (isTransientOpenAIError(editErr)) {
            throw toRetryableProviderError(editErr, "images.edit");
          }
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
        } catch (generateErr) {
          if (isTransientOpenAIError(generateErr)) {
            throw toRetryableProviderError(
              generateErr,
              "images.generate",
            );
          }
          throw generateErr;
        }
      }

      const buffer = Buffer.from(b64, "base64");
      // Returns the bare object path (private bucket; no public URL).
      await uploadImageToStorage(
        buffer,
        storagePath,
        "image/png",
        REFERENCE_STORAGE_BUCKET,
        false,
      );
      return privateReferenceLocator(storagePath);
    } catch (err) {
      // RetryableProviderError — provider is exhausted; do NOT silently fall
      // through to a placeholder. Re-throw so the caller can surface it.
      if (isRetryableProviderError(err)) {
        throw err;
      }

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

  // All non-transient attempts exhausted — surface the failure rather than
  // silently serving a placeholder.
  throw new Error(
    `All illustration attempts exhausted for ${storagePath}`
  );
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
 * uploads it to storage. Returns the bare object path, or null on failure
 * (the pipeline then continues with text-only identity preservation).
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
      let b64: string | undefined;
      try {
        const res = await openai.images.generate({
          model: "gpt-image-1",
          prompt: prompt.slice(0, 32000),
          n: 1,
          size: "1024x1024",
        });
        b64 = res.data?.[0]?.b64_json ?? undefined;
        if (!b64) throw new Error("No b64_json from gpt-image-1");
      } catch (providerError) {
        if (isTransientOpenAIError(providerError)) {
          throw toRetryableProviderError(
            providerError,
            "reference images.generate",
          );
        }
        throw providerError;
      }
      const buffer = Buffer.from(b64, "base64");
      // Returns the bare object path — callers sign on demand.
      return await uploadImageToStorage(buffer, storagePath);
    } catch (err) {
      // Transient provider exhaustion: surface immediately.
      if (isRetryableProviderError(err)) {
        throw err;
      }
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
 *
 * Always uses authenticated Supabase Storage download — never a raw public fetch.
 */
async function downloadReferenceSheets(
  children: IllustrationChild[]
): Promise<ReferenceImage[]> {
  const refs: ReferenceImage[] = [];
  for (const child of children) {
    const stored = child.profile.referenceSheetUrl;
    if (!stored) continue;
    const buffer = await downloadReferenceSheetAuthenticated(stored, child.name);
    refs.push({ name: child.name, buffer });
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
 * @returns Array of bare storage object paths in the same order as input pages/pageNumbers
 */
export async function generateIllustrations(params: {
  bookId: string;
  storyPages: BookPage[];
  themeId: string;
  sceneDescriptions: string[];
  pageNumbers?: number[];
  children: IllustrationChild[];
  contextualAnswers?: Record<string, unknown> | null;
  correctionsByPage?: Record<number, string>;
}): Promise<string[]> {
  const {
    bookId,
    storyPages,
    themeId,
    sceneDescriptions,
    pageNumbers,
    children,
    contextualAnswers,
    correctionsByPage,
  } =
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

  // Download each reference sheet once via authenticated storage; reuse the
  // buffers for every page.
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

      let prompt = buildIllustrationPrompt({
        sceneDescription: scene,
        characters,
        referenceNames,
        creature,
      });
      const correction = correctionsByPage?.[page.pageNumber]?.trim();
      if (correction) {
        prompt += `\n\n${correction}`;
      }

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
