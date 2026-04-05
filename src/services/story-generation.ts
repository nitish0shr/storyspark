import { openai } from "@/lib/openai";
import { AppearanceProfile } from "@/types/child";
import { BookPage } from "@/types/book";
import { storySkeletons } from "@/data/story-skeletons";
import {
  STORY_GENERATION_SYSTEM_PROMPT,
  fillPromptTemplate,
} from "@/data/prompts";

/**
 * Derives pronouns from the child's gender.
 */
function getPronouns(gender: string): {
  pronoun: string;
  possessive: string;
  object: string;
} {
  switch (gender) {
    case "boy":
      return { pronoun: "he", possessive: "his", object: "him" };
    case "girl":
      return { pronoun: "she", possessive: "her", object: "her" };
    default:
      return { pronoun: "they", possessive: "their", object: "them" };
  }
}

/**
 * Formats contextual answers into a readable string for the prompt.
 */
function formatContextualAnswers(answers: Record<string, string>): string {
  if (!answers || Object.keys(answers).length === 0) {
    return "No additional personalization details provided.";
  }

  return Object.entries(answers)
    .map(([key, value]) => `- ${key.replace(/_/g, " ")}: ${value}`)
    .join("\n");
}

/**
 * Fills all placeholders in the story skeleton pages.
 */
function fillSkeletonPlaceholders(
  skeletonPages: { pageNumber: number; template: string; sceneDescription: string }[],
  childName: string,
  pronouns: { pronoun: string; possessive: string; object: string },
  contextualAnswers: Record<string, string>
): string {
  const filledPages = skeletonPages.map((page) => {
    let filled = page.template;

    // Replace standard placeholders
    filled = filled.replaceAll("{name}", childName);
    filled = filled.replaceAll("{pronoun}", pronouns.pronoun);
    filled = filled.replaceAll("{possessive}", pronouns.possessive);
    filled = filled.replaceAll("{object}", pronouns.object);

    // Replace contextual answer placeholders
    for (const [key, value] of Object.entries(contextualAnswers)) {
      filled = filled.replaceAll(`{${key}}`, value);
    }

    return `Page ${page.pageNumber}: ${filled}`;
  });

  return filledPages.join("\n\n");
}

/**
 * Parses the LLM response text into BookPage array.
 * Expected format: "Page N: <text>" on each line.
 */
function parseStoryResponse(
  responseText: string,
  expectedPageCount: number
): BookPage[] {
  const pages: BookPage[] = [];
  // Match "Page N:" patterns, allowing flexible whitespace
  const pagePattern = /Page\s+(\d+)\s*:\s*([\s\S]*?)(?=Page\s+\d+\s*:|$)/gi;
  let match;

  while ((match = pagePattern.exec(responseText)) !== null) {
    const pageNumber = parseInt(match[1], 10);
    const text = match[2].trim();

    if (text.length > 0) {
      pages.push({ pageNumber, text });
    }
  }

  // Sort by page number
  pages.sort((a, b) => a.pageNumber - b.pageNumber);

  if (pages.length !== expectedPageCount) {
    throw new Error(
      `Expected ${expectedPageCount} pages but got ${pages.length}`
    );
  }

  return pages;
}

/**
 * Validates the generated story pages.
 */
function validateStory(
  pages: BookPage[],
  childName: string,
  expectedCount: number
): void {
  if (pages.length !== expectedCount) {
    throw new Error(
      `Story has ${pages.length} pages, expected ${expectedCount}`
    );
  }

  // Check for empty pages
  const emptyPages = pages.filter((p) => p.text.trim().length === 0);
  if (emptyPages.length > 0) {
    throw new Error(
      `Story has empty pages: ${emptyPages.map((p) => p.pageNumber).join(", ")}`
    );
  }

  // Check that child's name appears at least once across the entire story
  const fullText = pages.map((p) => p.text).join(" ");
  if (!fullText.includes(childName)) {
    throw new Error("Child's name does not appear in the generated story");
  }
}

/**
 * Generates a complete story for a children's book using GPT-4o-mini.
 * Retries once on parse failure.
 */
export async function generateStory(params: {
  childName: string;
  childAge: number;
  childGender: string;
  appearanceProfile: AppearanceProfile;
  themeId: string;
  contextualAnswers: Record<string, string>;
}): Promise<BookPage[]> {
  const {
    childName,
    childAge,
    childGender,
    appearanceProfile,
    themeId,
    contextualAnswers,
  } = params;

  const skeleton = storySkeletons[themeId];
  if (!skeleton) {
    throw new Error(`No story skeleton found for theme: ${themeId}`);
  }

  const pronouns = getPronouns(childGender);
  const ageLabel = childAge < 0 ? "baby (pre-birth)" : String(childAge);
  const genderLabel =
    childGender === "neutral" ? "child" : childGender;

  // Fill the skeleton with placeholders replaced
  const filledSkeleton = fillSkeletonPlaceholders(
    skeleton,
    childName,
    pronouns,
    contextualAnswers
  );

  // Build the hair description
  const hairDescription = `${appearanceProfile.hairStyle} ${appearanceProfile.hairColor} hair`;
  const appearanceNotes = `${appearanceProfile.skinTone} skin tone, ${appearanceProfile.eyeColor} eyes`;

  // Build the system prompt
  const systemPrompt = fillPromptTemplate(STORY_GENERATION_SYSTEM_PROMPT, {
    name: childName,
    age: ageLabel,
    gender: genderLabel,
    pronoun: pronouns.pronoun,
    possessive: pronouns.possessive,
    object: pronouns.object,
    skeleton: filledSkeleton,
    hair_description: hairDescription,
    appearance_notes: appearanceNotes,
    contextual_answers: formatContextualAnswers(contextualAnswers),
  });

  const expectedPageCount = skeleton.length;
  let lastError: Error | null = null;

  // Try up to 2 times (initial + 1 retry)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Write the complete ${expectedPageCount}-page story now. Output ONLY the story pages in the format "Page N: <text>". No other commentary.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("Empty response from OpenAI");
      }

      const pages = parseStoryResponse(responseText, expectedPageCount);
      validateStory(pages, childName, expectedPageCount);

      return pages;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `Story generation attempt ${attempt + 1} failed: ${lastError.message}`
      );
    }
  }

  throw new Error(
    `Story generation failed after 2 attempts: ${lastError?.message}`
  );
}
