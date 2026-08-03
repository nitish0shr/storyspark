import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppearanceProfile } from "@/types/child";
import { BookPage } from "@/types/book";
import { storySkeletons, getSceneDescription } from "@/data/story-skeletons";
import { generateStory } from "@/services/story-generation";
import {
  generateIllustrations,
  generateCharacterReferenceSheet,
  IllustrationChild,
} from "@/services/illustration";
import { assemblePdf } from "@/services/pdf-assembly";
import { generateNarration } from "@/services/tts-narration";
import { isOpenAIConfigured } from "@/lib/openai";
import { sendPreviewReadyEmail, sendBookReadyEmail } from "@/lib/email-notifications";

const DEFAULT_APPEARANCE: AppearanceProfile = {
  skinTone: "warm medium",
  hairColor: "brown",
  hairStyle: "short straight",
  eyeColor: "brown",
};

async function fetchBookWithChildren(bookId: string) {
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

  let secondChild = null;
  if (book.second_child_profile_id) {
    const { data: sc, error: scError } = await supabaseAdmin
      .from("child_profiles")
      .select("*")
      .eq("id", book.second_child_profile_id)
      .single();

    if (scError || !sc) {
      console.warn(`Failed to fetch second child profile for book ${bookId}: ${scError?.message}`);
    } else {
      secondChild = sc;
    }
  }

  return { book, child, secondChild };
}

/**
 * Fetches the email address captured for a book (from email_captures table).
 * Returns null if no email was captured.
 */
async function fetchBookEmail(bookId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("email_captures")
    .select("email")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.email ?? null;
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
 * Upserts pages into the book_pages table so the preview page can display them.
 * Uses the unique constraint on (book_id, page_number) to update existing rows.
 */
async function upsertBookPages(
  bookId: string,
  storyPages: BookPage[],
  illustrationUrls: (string | null)[],
  pageNumbers?: number[]
): Promise<void> {
  const pagesToUpsert = storyPages
    .filter((page) =>
      pageNumbers ? pageNumbers.includes(page.pageNumber) : true
    )
    .map((page) => {
      const pageIdx = storyPages.indexOf(page);
      return {
        book_id: bookId,
        page_number: page.pageNumber,
        text: page.text,
        illustration_url: illustrationUrls[pageIdx] ?? null,
      };
    });

  if (pagesToUpsert.length === 0) return;

  const { error } = await supabaseAdmin
    .from("book_pages")
    .upsert(pagesToUpsert, {
      onConflict: "book_id,page_number",
      ignoreDuplicates: false,
    });

  if (error) {
    console.error(`Failed to upsert book_pages for book ${bookId}:`, error);
    throw error;
  }

  console.log(`Upserted ${pagesToUpsert.length} pages for book ${bookId}`);
}

/**
 * Resolves a child's authoritative Character Profile:
 * the structured profile stored on the child row, falling back to defaults.
 * A legacy free-text appearance description (from older books) is merged in
 * as the prose description when the profile has none.
 */
function resolveCharacterProfile(
  childRow: { appearance_profile?: AppearanceProfile | null },
  fallbackDescription?: string
): AppearanceProfile {
  const stored = childRow.appearance_profile;
  const profile: AppearanceProfile = stored
    ? { ...DEFAULT_APPEARANCE, ...stored }
    : { ...DEFAULT_APPEARANCE };

  if (fallbackDescription && !profile.description) {
    profile.description = fallbackDescription;
  }

  return profile;
}

/**
 * Ensures a child has a Character Reference Sheet, generating it once and
 * persisting its URL inside the child's appearance_profile so every
 * subsequent illustration (and future book) reuses the same canonical image.
 * Returns the profile (with referenceSheetUrl when available).
 */
async function ensureReferenceSheet(
  childId: string,
  child: IllustrationChild
): Promise<AppearanceProfile> {
  if (child.profile.referenceSheetUrl) {
    return child.profile;
  }
  if (!isOpenAIConfigured()) {
    return child.profile;
  }

  const url = await generateCharacterReferenceSheet({
    child,
    storagePath: `references/${childId}.png`,
  });

  if (!url) {
    return child.profile;
  }

  const updatedProfile: AppearanceProfile = {
    ...child.profile,
    referenceSheetUrl: url,
  };

  const { error } = await supabaseAdmin
    .from("child_profiles")
    .update({
      appearance_profile: updatedProfile,
      updated_at: new Date().toISOString(),
    })
    .eq("id", childId);

  if (error) {
    console.warn(
      `Failed to persist reference sheet URL for child ${childId}: ${error.message}`
    );
  }

  return updatedProfile;
}

/** Extracts the legacy appearance descriptions stored on the book row. */
function extractAppearanceDescriptions(
  contextualAnswers: Record<string, unknown> | null | undefined
): { first?: string; second?: string } {
  const answers = contextualAnswers || {};
  const first =
    typeof answers.__appearance_desc === "string" && answers.__appearance_desc
      ? answers.__appearance_desc
      : undefined;
  const second =
    typeof answers.__appearance_desc2 === "string" && answers.__appearance_desc2
      ? answers.__appearance_desc2
      : undefined;
  return { first, second };
}

/**
 * Builds the IllustrationChild list for a book (one or two children), with
 * resolved Character Profiles and freshly-ensured Character Reference Sheets.
 */
async function prepareIllustrationChildren(
  child: Record<string, unknown> & { id: string },
  secondChild: (Record<string, unknown> & { id: string }) | null,
  descriptions: { first?: string; second?: string }
): Promise<IllustrationChild[]> {
  const firstChild: IllustrationChild = {
    name: (child.name as string) || "the child",
    age: (child.age as number) ?? 5,
    gender: (child.gender as string) || "neutral",
    profile: resolveCharacterProfile(
      child as { appearance_profile?: AppearanceProfile | null },
      descriptions.first
    ),
  };

  const children: IllustrationChild[] = [firstChild];

  if (secondChild) {
    children.push({
      name: (secondChild.name as string) || "the second child",
      age: (secondChild.age as number) ?? 5,
      gender: (secondChild.gender as string) || "neutral",
      profile: resolveCharacterProfile(
        secondChild as { appearance_profile?: AppearanceProfile | null },
        descriptions.second
      ),
    });
  }

  // Generate any missing reference sheets in parallel (one per child, once ever)
  const childIds = [child.id, ...(secondChild ? [secondChild.id] : [])];
  const ensured = await Promise.all(
    children.map((c, i) => ensureReferenceSheet(childIds[i], c))
  );
  ensured.forEach((profile, i) => {
    children[i].profile = profile;
  });

  return children;
}

/**
 * Generates a preview for the book:
 * 1. Resolves each child's Character Profile and Reference Sheet
 * 2. Generates the full story text
 * 3. Generates 3 preview illustrations (cover + first 2 pages)
 * 4. Saves everything and marks status as preview_ready
 * 5. Inserts preview pages into book_pages table
 * 6. Sends preview-ready email to parent
 */
export async function generatePreview(bookId: string): Promise<void> {
  try {
    await updateBookStatus(bookId, "preview_generating");

    const { book, child, secondChild } = await fetchBookWithChildren(bookId);

    const contextualAnswers: Record<string, string> =
      book.contextual_answers || {};

    const descriptions = extractAppearanceDescriptions(contextualAnswers);

    // Strip internal appearance keys so they don't appear in the story prompt Q&A
    const storyContextualAnswers = Object.fromEntries(
      Object.entries(contextualAnswers).filter(
        ([k]) => k !== "__appearance_desc" && k !== "__appearance_desc2"
      )
    );

    let secondChildData = undefined;
    if (secondChild) {
      secondChildData = {
        name: secondChild.name,
        age: secondChild.age,
        gender: secondChild.gender,
        appearanceProfile: resolveCharacterProfile(secondChild, descriptions.second),
      };
    }

    // Story generation and character preparation (reference sheets) are
    // independent — run them in parallel. Both are needed before illustrating.
    const [storyPages, illustrationChildren] = await Promise.all([
      generateStory({
        childName: child.name,
        childAge: child.age,
        childGender: child.gender,
        appearanceProfile: resolveCharacterProfile(child, descriptions.first),
        themeId: book.theme_id,
        contextualAnswers: storyContextualAnswers,
        language: book.language || "en",
        secondChild: secondChildData,
      }),
      prepareIllustrationChildren(child, secondChild, descriptions),
    ]);

    const skeleton = storySkeletons[book.theme_id];
    const hasTwoChildren = !!secondChild;
    const sceneDescriptions = skeleton
      ? skeleton.map((s) => getSceneDescription(s, hasTwoChildren))
      : [];

    const previewPageNumbers = [1, 2, 3];

    const previewIllustrationUrls = await generateIllustrations({
      bookId,
      storyPages,
      themeId: book.theme_id,
      sceneDescriptions,
      pageNumbers: previewPageNumbers,
      children: illustrationChildren,
      contextualAnswers: book.contextual_answers as Record<string, unknown> | null,
    });

    // Build the full illustration_urls array with nulls for non-preview pages
    const allIllustrationUrls: (string | null)[] = storyPages.map((page) => {
      const previewIdx = previewPageNumbers.indexOf(page.pageNumber);
      return previewIdx >= 0 ? previewIllustrationUrls[previewIdx] : null;
    });

    const previewPages = storyPages.filter((p) =>
      previewPageNumbers.includes(p.pageNumber)
    );

    // Save story + illustration data to the books table
    await updateBookStatus(bookId, "preview_ready", {
      story_text: storyPages,
      illustration_urls: allIllustrationUrls,
      preview_pages: previewPages,
      page_count: storyPages.length,
    });

    // Populate book_pages table (required by the preview page UI)
    await upsertBookPages(bookId, storyPages, allIllustrationUrls, previewPageNumbers);

    // Send preview-ready email to parent (fire-and-forget — don't fail the pipeline)
    fetchBookEmail(bookId)
      .then((email) => {
        if (email) {
          return sendPreviewReadyEmail({
            email,
            childName: child.name,
            bookId,
          });
        }
      })
      .catch((err) => {
        console.error(`Failed to send preview email for book ${bookId}:`, err);
      });

  } catch (error) {
    console.error(`Preview generation failed for book ${bookId}:`, error);
    await updateBookStatus(bookId, "failed");
    throw error;
  }
}

/**
 * Generates the full book after preview approval:
 * 1. Generates remaining illustrations (pages 4+) reusing each child's
 *    Character Profile and Reference Sheet from the preview stage
 * 2. Generates TTS audio narration (optional)
 * 3. Assembles PDF
 * 4. Populates all book_pages rows
 * 5. Marks status as complete
 * 6. Sends book-ready email to parent
 */
export async function generateFullBook(bookId: string): Promise<void> {
  try {
    await updateBookStatus(bookId, "generating");

    const { book, child, secondChild } = await fetchBookWithChildren(bookId);

    if (!book.story_text || !Array.isArray(book.story_text)) {
      throw new Error(
        "Book has no story text. Generate a preview first."
      );
    }

    const storyPages: BookPage[] = book.story_text;
    const existingUrls: (string | null)[] = book.illustration_urls || [];

    const remainingPageNumbers: number[] = [];
    storyPages.forEach((page, idx) => {
      if (!existingUrls[idx]) {
        remainingPageNumbers.push(page.pageNumber);
      }
    });

    let allIllustrationUrls = [...existingUrls];

    if (remainingPageNumbers.length > 0) {
      const skeleton = storySkeletons[book.theme_id];
      const hasTwoChildren = !!secondChild;
      const sceneDescriptions = skeleton
        ? skeleton.map((s) => getSceneDescription(s, hasTwoChildren))
        : [];

      const descriptions = extractAppearanceDescriptions(book.contextual_answers);

      // Reuses the reference sheets generated at preview time (generates them
      // only if missing, e.g. for legacy books)
      const illustrationChildren = await prepareIllustrationChildren(
        child,
        secondChild,
        descriptions
      );

      const newUrls = await generateIllustrations({
        bookId,
        storyPages,
        themeId: book.theme_id,
        sceneDescriptions,
        pageNumbers: remainingPageNumbers,
        children: illustrationChildren,
        contextualAnswers: book.contextual_answers as Record<string, unknown> | null,
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

    // Upsert all remaining pages into book_pages now that we have all illustrations
    await upsertBookPages(bookId, storyPages, allIllustrationUrls);

    // Generate audio narration (if OpenAI is configured)
    let audioStatus: "complete" | "failed" | "skipped" = "skipped";
    if (isOpenAIConfigured()) {
      try {
        console.log(`Generating audio narration for book ${bookId}...`);
        const pagesForAudio = storyPages.map((page) => ({
          pageNumber: page.pageNumber,
          text: page.text,
        }));
        await generateNarration(bookId, pagesForAudio);
        audioStatus = "complete";
        console.log(`Audio narration complete for book ${bookId}`);
      } catch (audioError) {
        audioStatus = "failed";
        console.error(
          `Audio narration failed for book ${bookId} (continuing to PDF):`,
          audioError
        );
      }
    }

    // Trigger PDF assembly
    const { pdfUrl, pdfPrintUrl } = await assemblePdf(bookId);

    // Mark complete
    await updateBookStatus(bookId, "complete", {
      pdf_url: pdfUrl,
      pdf_print_url: pdfPrintUrl,
      audio_status: audioStatus,
    });

    // Send book-ready email to parent (fire-and-forget)
    fetchBookEmail(bookId)
      .then((email) => {
        if (email) {
          return sendBookReadyEmail({
            email,
            childName: child.name,
            bookId,
            pdfUrl,
          });
        }
      })
      .catch((err) => {
        console.error(`Failed to send book-ready email for book ${bookId}:`, err);
      });

  } catch (error) {
    console.error(`Full book generation failed for book ${bookId}:`, error);
    await updateBookStatus(bookId, "failed");
    throw error;
  }
}
