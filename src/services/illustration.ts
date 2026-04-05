import { replicate } from "@/lib/replicate";
import { AppearanceProfile } from "@/types/child";
import { BookPage } from "@/types/book";
import { ILLUSTRATION_PROMPT_TEMPLATE, fillPromptTemplate } from "@/data/prompts";

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
};

/**
 * Simple semaphore for limiting concurrent async operations.
 */
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
 * Generates a single illustration using Replicate's Flux model.
 * Retries up to 2 times on failure.
 */
async function generateSingleIllustration(
  prompt: string,
  retries = 2
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: {
            prompt,
            num_outputs: 1,
            aspect_ratio: "3:4",
            output_format: "webp",
            output_quality: 90,
          },
        }
      );

      // Flux returns an array of FileOutput objects or URL strings
      if (Array.isArray(output) && output.length > 0) {
        const firstOutput = output[0];
        // FileOutput has a .url() method or can be cast to string
        const url = typeof firstOutput === "string"
          ? firstOutput
          : String(firstOutput);
        if (!url || url.length === 0) {
          throw new Error("Empty URL returned from image generation");
        }
        return url;
      }

      throw new Error("Unexpected output format from Replicate");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `Illustration attempt ${attempt + 1} failed: ${lastError.message}`
      );
      if (attempt < retries) {
        // Brief delay before retry
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw new Error(
    `Illustration generation failed after ${retries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Generates illustrations for story pages in parallel with a concurrency limit.
 *
 * @param params.storyPages - The story text pages
 * @param params.appearanceProfile - Child's physical appearance
 * @param params.themeId - Theme identifier
 * @param params.childAge - Child's age
 * @param params.childGender - Child's gender
 * @param params.sceneDescriptions - Scene descriptions matching page order
 * @param params.pageNumbers - If provided, only generate for these page numbers (1-indexed)
 * @returns Array of image URLs in the same order as input pages/pageNumbers
 */
export async function generateIllustrations(params: {
  storyPages: BookPage[];
  appearanceProfile: AppearanceProfile;
  themeId: string;
  childAge: number;
  childGender: string;
  sceneDescriptions: string[];
  pageNumbers?: number[];
}): Promise<string[]> {
  const {
    storyPages,
    appearanceProfile,
    themeId,
    childAge,
    childGender,
    sceneDescriptions,
    pageNumbers,
  } = params;

  const outfit =
    THEME_OUTFITS[themeId] || "a colorful, age-appropriate outfit";
  const genderLabel = childGender === "neutral" ? "child" : childGender;
  const ageLabel = childAge < 0 ? "baby" : String(childAge);

  // Determine which pages to generate illustrations for
  const targetPages = pageNumbers
    ? storyPages.filter((p) => pageNumbers.includes(p.pageNumber))
    : storyPages;

  // Build prompts for each target page
  const prompts: string[] = targetPages.map((page) => {
    // Use the scene description from skeleton, falling back to a generic one
    const sceneIdx = page.pageNumber - 1;
    const scene =
      sceneDescriptions[sceneIdx] ||
      `A scene from the story: ${page.text.substring(0, 100)}`;

    return fillPromptTemplate(ILLUSTRATION_PROMPT_TEMPLATE, {
      scene_description: scene,
      name: "the child", // Keep generic in image prompts for better generation
      age: ageLabel,
      gender: genderLabel,
      skin_tone: appearanceProfile.skinTone,
      hair_color: appearanceProfile.hairColor,
      hair_style: appearanceProfile.hairStyle,
      eye_color: appearanceProfile.eyeColor,
      outfit_for_theme: outfit,
    });
  });

  // Generate illustrations in parallel with concurrency limit of 3
  const semaphore = new Semaphore(3);
  const results = await Promise.all(
    prompts.map(async (prompt) => {
      await semaphore.acquire();
      try {
        return await generateSingleIllustration(prompt);
      } finally {
        semaphore.release();
      }
    })
  );

  return results;
}
