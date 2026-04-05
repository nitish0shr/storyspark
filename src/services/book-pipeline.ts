import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppearanceProfile } from "@/types/child";
import { BookPage } from "@/types/book";
import { storySkeletons } from "@/data/story-skeletons";
import { analyzeFace } from "@/services/face-analysis";
import { generateStory } from "@/services/story-generation";
import { generateIllustrations } from "@/services/illustration";
import { assemblePdf } from "@/services/pdf-assembly";

/**
 * Fetches a book record and its associated child profile from the database.
 */
async function fetchBookWithChild(bookId: string) {
  const { data: book, error: bookError } = await supabaseAdmin
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    throw new Error(`Failed to fetch book ${bookId}: ${bookError?.message}`);
  }

  const { data: child, error: childError } = await supabaseAdmin
    .from("child_profiles")
    .select("*")
    .eq("id", book.child_profile_id)
    .single();

  if (childError || !child) {
    throw new Error(
      `Failed to fetch child profile for book ${bookId}: ${childError?.message}`
    );
  }

  return { book, child };
}

/**
 * Updates a book's status in the database.
 */
async function updateBookStatus(
  bookId: string,
  status: string,
  extra: Record<string, unknown> = {}
) {
  const { error } = await supabaseAdmin
    .from("books")
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq("id", bookId);

  if (error) {
    console.error(`Failed to update book ${bookId} status to ${status}:`, error);
  }
}

/**
 * Generates a preview for the book:
 * 1. Runs face analysis if needed
 * 2. Generates the full story text
 * 3. Generates 3 preview illustrations (cover + first 2 pages)
 * 4. Saves everything and marks status as preview_ready
 */
export async function generatePreview(bookId: string): Promise<void> {
  try {
    await updateBookStatus(bookId, "preview_generating");

    const { book, child } = await fetchBookWithChild(bookId);

    // Step 1: Face analysis (if no appearance profile yet)
    let appearanceProfile: AppearanceProfile = child.appearance_profile;

    if (!appearanceProfile && child.photo_url) {
      appearanceProfile = await analyzeFace(child.photo_url);

      // Save the appearance profile back to the child record
      await supabaseAdmin
        .from("child_profiles")
        .update({
          appearance_profile: appearanceProfile,
          updated_at: new Date().toISOString(),
        })
        .eq("id", child.id);
    }

    // Fallback if still no profile
    if (!appearanceProfile) {
      appearanceProfile = {
        skinTone: "warm medium",
        hairColor: "brown",
        hairStyle: "short straight",
        eyeColor: "brown",
      };
    }

    // Step 2: Generate the full story text
    const contextualAnswers: Record<string, string> =
      book.contextual_answers || {};

    const storyPages: BookPage[] = await generateStory({
      childName: child.name,
      childAge: child.age,
      childGender: child.gender,
      appearanceProfile,
      themeId: book.theme_id,
      contextualAnswers,
    });

    // Step 3: Generate preview illustrations (first 3 pages)
    const skeleton = storySkeletons[book.theme_id];
    const sceneDescriptions = skeleton
      ? skeleton.map((s) => s.sceneDescription)
      : [];

    const previewPageNumbers = [1, 2, 3]; // cover + first 2 pages

    const previewIllustrationUrls = await generateIllustrations({
      storyPages,
      appearanceProfile,
      themeId: book.theme_id,
      childAge: child.age,
      childGender: child.gender,
      sceneDescriptions,
      pageNumbers: previewPageNumbers,
    });

    // Build the full illustration_urls array with nulls for non-preview pages
    const allIllustrationUrls: (string | null)[] = storyPages.map((page) => {
      const previewIdx = previewPageNumbers.indexOf(page.pageNumber);
      return previewIdx >= 0 ? previewIllustrationUrls[previewIdx] : null;
    });

    // Step 4: Save to DB
    const previewPages = storyPages.filter((p) =>
      previewPageNumbers.includes(p.pageNumber)
    );

    await updateBookStatus(bookId, "preview_ready", {
      story_text: storyPages,
      illustration_urls: allIllustrationUrls,
      preview_pages: previewPages,
      page_count: storyPages.length,
    });
  } catch (error) {
    console.error(`Preview generation failed for book ${bookId}:`, error);
    await updateBookStatus(bookId, "failed");
    throw error;
  }
}

/**
 * Generates the full book after preview approval:
 * 1. Generates remaining illustrations (pages 4+)
 * 2. Triggers PDF assembly
 * 3. Marks status as complete
 */
export async function generateFullBook(bookId: string): Promise<void> {
  try {
    await updateBookStatus(bookId, "generating");

    const { book, child } = await fetchBookWithChild(bookId);

    if (!book.story_text || !Array.isArray(book.story_text)) {
      throw new Error(
        "Book has no story text. Generate a preview first."
      );
    }

    const storyPages: BookPage[] = book.story_text;
    const existingUrls: (string | null)[] = book.illustration_urls || [];

    const appearanceProfile: AppearanceProfile = child.appearance_profile || {
      skinTone: "warm medium",
      hairColor: "brown",
      hairStyle: "short straight",
      eyeColor: "brown",
    };

    // Determine which pages still need illustrations
    const remainingPageNumbers: number[] = [];
    storyPages.forEach((page, idx) => {
      if (!existingUrls[idx]) {
        remainingPageNumbers.push(page.pageNumber);
      }
    });

    let allIllustrationUrls = [...existingUrls];

    if (remainingPageNumbers.length > 0) {
      const skeleton = storySkeletons[book.theme_id];
      const sceneDescriptions = skeleton
        ? skeleton.map((s) => s.sceneDescription)
        : [];

      const newUrls = await generateIllustrations({
        storyPages,
        appearanceProfile,
        themeId: book.theme_id,
        childAge: child.age,
        childGender: child.gender,
        sceneDescriptions,
        pageNumbers: remainingPageNumbers,
      });

      // Merge new URLs into the full array
      let newUrlIdx = 0;
      allIllustrationUrls = storyPages.map((page, idx) => {
        if (!existingUrls[idx] && newUrlIdx < newUrls.length) {
          return newUrls[newUrlIdx++];
        }
        return existingUrls[idx] || null;
      });
    }

    // Save illustration URLs before PDF assembly
    await updateBookStatus(bookId, "generating", {
      illustration_urls: allIllustrationUrls,
    });

    // Trigger PDF assembly
    const { pdfUrl, pdfPrintUrl } = await assemblePdf(bookId);

    // Mark complete
    await updateBookStatus(bookId, "complete", {
      pdf_url: pdfUrl,
      pdf_print_url: pdfPrintUrl,
    });
  } catch (error) {
    console.error(`Full book generation failed for book ${bookId}:`, error);
    await updateBookStatus(bookId, "failed");
    throw error;
  }
}
