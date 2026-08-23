import crypto from "crypto";
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
import {
  isOpenAIConfigured,
  isRetryableProviderError,
} from "@/lib/openai";
import {
  sendDeliveryEmail,
} from "@/lib/email-notifications";
import { getAppUrl } from "@/lib/utils";
import { runValidationGate } from "@/services/review-gate";
import {
  createBookVersion,
  fetchVersionPages,
  setCurrentVersionId,
} from "@/lib/book-versions";
import {
  transitionStage,
  setOperationalState,
  recordOperationalError,
} from "@/lib/lifecycle-service";
import type { LifecycleStage } from "@/types/book";
import { applyRevision } from "@/services/revision-engine";
import {
  buildCorrectivePrompt,
  isBlockingFailure,
  targetedIllustrationPages,
  validateBook,
  validateIllustration,
  type ValidationFailure,
  type ValidationResult,
} from "@/lib/content-validation";
import { resolveCreatureFromAnswers } from "@/data/animals";
import {
  createFinalBookSignedUrl,
  FINAL_BOOK_BUCKET,
} from "@/lib/storage-urls";
import {
  isUsableLinkedDeliveryGrant,
  type LinkedDeliveryGrantEvidence,
} from "@/lib/delivery-recovery";
import { canInvokeCanonicalFullBook } from "@/lib/legacy-recovery";
import {
  computeGenerationRetryDelayMs,
  MAX_GENERATION_RECOVERY_ATTEMPTS,
} from "@/lib/generation-recovery";

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
      console.warn(
        `Failed to fetch second child profile for book ${bookId}: ${scError?.message}`
      );
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
 * Updates a book's operational status in the database (legacy status column).
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
    console.error(
      `Failed to update book ${bookId} status to ${status}:`,
      error
    );
  }
}

const GENERATION_HEARTBEAT_INTERVAL_MS = 60_000;

async function heartbeatGeneration(
  bookId: string,
  state: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await setOperationalState(bookId, state, {
    generation_heartbeat_at: new Date().toISOString(),
    ...extra,
  });
}

async function withGenerationHeartbeat<T>(
  bookId: string,
  state: string,
  operation: () => Promise<T>,
): Promise<T> {
  await heartbeatGeneration(bookId, state);
  const timer = setInterval(() => {
    void heartbeatGeneration(bookId, state);
  }, GENERATION_HEARTBEAT_INTERVAL_MS);
  timer.unref?.();
  try {
    return await operation();
  } finally {
    clearInterval(timer);
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
 * persisting its URL inside the child's appearance_profile.
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
 * Generates a preview for the book (now: ALL story pages + ALL illustrations).
 *
 * Lifecycle:
 *   null -> Generated -> Under Review
 *
 * The complete pre-review generation:
 *   1. Resolves each child's Character Profile and Reference Sheet
 *   2. Generates the FULL story text (all pages)
 *   3. Generates ALL illustrations (all pages)
 *   4. Creates an immutable snapshot (book_versions row + book_version_pages)
 *   5. Records operational attempts/errors
 *   6. Persists page-level findings
 *   7. Transitions null -> Generated -> Under Review only when complete
 *   8. Does NOT send any customer preview email before approval
 *
 * Idempotent/resumable: safe to call again if a previous run failed.
 * No customer preview email is sent before approval.
 */
export interface PreviewGenerationControls {
  expectedPageCount?: number;
  allowAutomaticRegeneration?: boolean;
  actor?: string;
  controlledLegacyRecovery?: boolean;
  /**
   * The public route atomically moved this exact owner's new draft to
   * preview_generating before dispatch. No other caller should set this.
   */
  claimedPublicGeneration?: boolean;
  /**
   * The protected subscription route created an owned book from an active
   * subscription directly in the durable queued state.
   */
  claimedSubscriptionGeneration?: boolean;
  /**
   * The CRON recovery sweep atomically reclaimed a stale/interrupted
   * pre-lifecycle draft (no current_version_id, lifecycle_stage IS NULL)
   * and moved it to preview_generating with an incremented recovery counter
   * before dispatch. No other caller should set this.
   */
  claimedRecoveryGeneration?: boolean;
}

export async function generatePreview(
  bookId: string,
  skipGate = false,
  controls: PreviewGenerationControls = {},
): Promise<void> {
  let generationStarted = false;
  let generationRecoveryAttempts = 0;
  try {
    const { book, child, secondChild } = await fetchBookWithChildren(bookId);
    generationRecoveryAttempts = Number(
      book.generation_recovery_attempts ?? 0,
    );
    const lifecycleStage = (book.lifecycle_stage ?? null) as LifecycleStage | null;
    const isControlledLegacyRecovery =
      controls.controlledLegacyRecovery === true;
    const isClaimedPublicGeneration =
      controls.claimedPublicGeneration === true;
    const isClaimedSubscriptionGeneration =
      controls.claimedSubscriptionGeneration === true;
    const isClaimedRecoveryGeneration =
      controls.claimedRecoveryGeneration === true;
    if (isClaimedPublicGeneration) {
      if (
        lifecycleStage !== null ||
        skipGate ||
        book.status !== "preview_generating" ||
        isControlledLegacyRecovery ||
        isClaimedRecoveryGeneration ||
        isClaimedSubscriptionGeneration
      ) {
        throw new Error(
          "Invalid claimed public generation invocation; exact lifecycle and operational state are required",
        );
      }
      // The route has already made the durable generation claim. Any failure
      // after this boundary must move the book to failed rather than strand it.
      generationStarted = true;
    } else if (isClaimedSubscriptionGeneration) {
      if (
        lifecycleStage !== null ||
        skipGate ||
        book.status !== "preview_generating" ||
        !book.subscription_id ||
        isControlledLegacyRecovery ||
        isClaimedRecoveryGeneration
      ) {
        throw new Error(
          "Invalid claimed subscription generation invocation; an active-route durable subscription claim is required",
        );
      }
      generationStarted = true;
    } else if (isClaimedRecoveryGeneration) {
      // The CRON sweep atomically reclaimed this stale/interrupted book and
      // moved it to preview_generating with an incremented recovery counter.
      // Validate the expected boundary state before proceeding.
      if (
        lifecycleStage !== null ||
        skipGate ||
        book.status !== "preview_generating" ||
        book.current_version_id !== null ||
        book.operational_state !== "generation_recovery_claimed" ||
        isControlledLegacyRecovery
      ) {
        throw new Error(
          "Invalid claimed recovery generation invocation; book must have no lifecycle stage and be in preview_generating status",
        );
      }
      // The sweep has already made the durable reclaim. Any failure after this
      // boundary must move the book to failed rather than strand it again.
      generationStarted = true;
    } else if (isControlledLegacyRecovery) {
      if (
        lifecycleStage !== null ||
        skipGate ||
        controls.expectedPageCount !== 12 ||
        controls.allowAutomaticRegeneration !== false ||
        !controls.actor?.startsWith("admin:")
      ) {
        throw new Error(
          "Invalid controlled legacy recovery invocation; exact admin, lifecycle, page-count, and retry controls are required",
        );
      }
    } else if (skipGate) {
      if (lifecycleStage !== "Generated") {
        throw new Error(
          "Automatic preview regeneration is allowed only from the canonical Generated stage",
        );
      }
    } else if (lifecycleStage !== null || book.status !== "draft") {
      throw new Error(
        "Preview generation is allowed only for a new draft or an explicitly controlled legacy recovery",
      );
    }

    // Record the attempt only after the invocation boundary has been proven.
    const attemptStartedAt = new Date().toISOString();
    await heartbeatGeneration(bookId, "generating_story", {
      generation_attempt_started_at: attemptStartedAt,
      generation_retry_at: null,
      operational_error: null,
    });
    await updateBookStatus(bookId, "preview_generating");
    generationStarted = true;

    const skeleton = storySkeletons[book.theme_id];
    if (controls.expectedPageCount !== undefined) {
      const skeletonIsExact =
        skeleton?.length === controls.expectedPageCount &&
        skeleton.every((page, index) => page.pageNumber === index + 1);
      if (!skeletonIsExact) {
        throw new Error(
          `Controlled recovery requires a contiguous ${controls.expectedPageCount}-page story skeleton`,
        );
      }
    }

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
        appearanceProfile: resolveCharacterProfile(
          secondChild,
          descriptions.second
        ),
      };
    }

    // Story generation and character preparation (reference sheets) run in parallel.
    const [storyPages, illustrationChildren] =
      await withGenerationHeartbeat(
        bookId,
        "generating_story",
        () =>
          Promise.all([
            generateStory({
              regenerationNote: book.rejection_reason ?? null,
              childName: child.name,
              childAge: child.age,
              childGender: child.gender,
              appearanceProfile: resolveCharacterProfile(
                child,
                descriptions.first,
              ),
              themeId: book.theme_id,
              contextualAnswers: storyContextualAnswers,
              language: book.language || "en",
              secondChild: secondChildData,
            }),
            prepareIllustrationChildren(child, secondChild, descriptions),
          ]),
      );

    if (controls.expectedPageCount !== undefined) {
      const generatedPagesAreExact =
        storyPages.length === controls.expectedPageCount &&
        storyPages.every((page, index) => page.pageNumber === index + 1);
      if (!generatedPagesAreExact) {
        throw new Error(
          `Controlled recovery generated ${storyPages.length} pages instead of the required contiguous ${controls.expectedPageCount}`,
        );
      }
    }

    const hasTwoChildren = !!secondChild;
    const sceneDescriptions = skeleton
      ? skeleton.map((s) => getSceneDescription(s, hasTwoChildren))
      : [];

    // ── Generate ALL illustrations (not just a preview subset) ────────────────
    console.log(
      `[pipeline] Generating all ${storyPages.length} illustrations for book ${bookId}`
    );
    const allIllustrationUrls = await withGenerationHeartbeat(
      bookId,
      "generating_illustrations",
      () =>
        generateIllustrations({
          bookId,
          storyPages,
          themeId: book.theme_id,
          sceneDescriptions,
          // No pageNumbers filter → generate every page
          children: illustrationChildren,
          contextualAnswers: book.contextual_answers as Record<
            string,
            unknown
          > | null,
        }),
    );

    const finalIllustrationUrls = [...allIllustrationUrls];

    // Persist completed work before validation so an interrupted attempt is
    // observable. A recovery still rebuilds from the durable atomic claim.
    await upsertBookPages(bookId, storyPages, finalIllustrationUrls);

    // ── Verify EVERY page has text + illustration before snapshotting ──────────
    // The snapshot is the immutable source of truth for review and delivery, so
    // it must never be created from incomplete content.
    const incompletePages: number[] = [];
    storyPages.forEach((page, idx) => {
      const hasText = typeof page.text === "string" && page.text.trim().length > 0;
      const hasIllustration = Boolean(finalIllustrationUrls[idx]);
      if (!hasText || !hasIllustration) {
        incompletePages.push(page.pageNumber);
      }
    });

    if (incompletePages.length > 0) {
      throw new Error(
        `Cannot snapshot book ${bookId}: pages ${incompletePages.join(", ")} are missing text or illustration`
      );
    }

    // Validate before immutable snapshotting so a content-only image failure can
    // be corrected without creating or replacing a whole-book version.
    const creature = resolveCreatureFromAnswers(
      book.contextual_answers as Record<string, unknown> | null,
    );
    let validationResult: ValidationResult =
      await withGenerationHeartbeat(bookId, "validating_preview", () =>
        validateBook({
          storyText: storyPages.map((page) => page.text).join("\n\n"),
          imageUrls: finalIllustrationUrls,
          creature,
          recipientName: child.name,
          attempt: 1,
          themeTitle: book.theme_title ?? null,
          themeId: book.theme_id,
          sceneDescriptions,
        }),
      );

    const correctionPages =
      controls.allowAutomaticRegeneration === false
        ? []
        : targetedIllustrationPages(validationResult.failures);

    if (correctionPages.length > 0) {
      const correctionsByPage: Record<number, string> = {};
      for (const pageNumber of correctionPages) {
        const pageFailures = validationResult.failures.filter(
          (failure) =>
            failure.source === "image" &&
            failure.pageNumber === pageNumber &&
            isBlockingFailure(failure),
        );
        correctionsByPage[pageNumber] = buildCorrectivePrompt(
          pageFailures,
          creature,
        );
      }

      const correctedUrls = await withGenerationHeartbeat(
        bookId,
        "correcting_illustrations",
        () =>
          generateIllustrations({
            bookId: `${bookId}/quality-correction-${Number(
              book.generation_recovery_attempts ?? 0,
            )}`,
            storyPages,
            themeId: book.theme_id,
            sceneDescriptions,
            pageNumbers: correctionPages,
            children: illustrationChildren,
            contextualAnswers:
              book.contextual_answers as Record<string, unknown> | null,
            correctionsByPage,
          }),
      );

      correctionPages.forEach((pageNumber, correctedIndex) => {
        const storyIndex = storyPages.findIndex(
          (page) => page.pageNumber === pageNumber,
        );
        if (storyIndex < 0 || !correctedUrls[correctedIndex]) {
          throw new Error(
            `Targeted illustration correction did not return page ${pageNumber}`,
          );
        }
        finalIllustrationUrls[storyIndex] = correctedUrls[correctedIndex];
      });
      await upsertBookPages(
        bookId,
        storyPages,
        finalIllustrationUrls,
        correctionPages,
      );

      const correctedFindings = await withGenerationHeartbeat(
        bookId,
        "validating_corrections",
        () =>
          Promise.all(
            correctionPages.map(async (pageNumber) => {
              const storyIndex = storyPages.findIndex(
                (page) => page.pageNumber === pageNumber,
              );
              const failures = await validateIllustration({
                imageUrl: finalIllustrationUrls[storyIndex],
                creature,
                themeTitle: book.theme_title ?? null,
                themeId: book.theme_id,
                sceneDescription: sceneDescriptions[storyIndex] ?? null,
              });
              return failures.map(
                (failure): ValidationFailure => ({
                  ...failure,
                  pageNumber,
                  severity:
                    failure.severity ??
                    (failure.code === "vision_unavailable"
                      ? "minor"
                      : "blocker"),
                  source: "image",
                }),
              );
            }),
          ),
      );
      const targetSet = new Set(correctionPages);
      const retainedFailures = validationResult.failures.filter(
        (failure) =>
          failure.source !== "image" ||
          !failure.pageNumber ||
          !targetSet.has(failure.pageNumber),
      );
      const failures = retainedFailures.concat(correctedFindings.flat());
      validationResult = {
        ok: failures.every((failure) => !isBlockingFailure(failure)),
        failures,
        attempt: 2,
        checkedAt: new Date().toISOString(),
      };
    }

    // ── Create immutable snapshot (MUST succeed before any transition) ──────────
    await heartbeatGeneration(bookId, "snapshotting_preview");
    const versionResult = await createBookVersion({
      bookId,
      storyPages,
      illustrationUrls: finalIllustrationUrls,
      metadata: {
        generatedAt: new Date().toISOString(),
        pageCount: storyPages.length,
        controlledLegacyRecovery:
          controls.controlledLegacyRecovery === true,
        validationAttempt: validationResult.attempt,
      },
    });

    if (!versionResult.ok || !versionResult.versionId) {
      // Snapshot creation is a hard requirement — abort without transitioning.
      throw new Error(
        `Failed to create immutable book version for ${bookId}: ${versionResult.error}`
      );
    }

    await setCurrentVersionId(bookId, versionResult.versionId);
    console.log(
      `[pipeline] Created version ${versionResult.versionNumber} (${versionResult.versionId}) for book ${bookId}`
    );

    // ── Update legacy status fields ────────────────────────────────────────────
    await updateBookStatus(bookId, "preview_ready", {
      story_text: storyPages,
      illustration_urls: finalIllustrationUrls,
      preview_pages: storyPages.slice(0, 2),
      page_count: storyPages.length,
    });

    // ── Transition: null -> Generated ─────────────────────────────────────────
    const genTransition = await transitionStage(
      bookId,
      "Generated",
      controls.actor ?? "system",
      controls.controlledLegacyRecovery
        ? "Explicitly confirmed controlled legacy recovery generated a complete canonical version"
        : "All pages and illustrations generated successfully",
    );

    if (!genTransition.ok) {
      if (genTransition.fromStage !== "Generated") {
        throw new Error(
          `Failed to transition complete generation to Generated: ${genTransition.error}`,
        );
      }
    }

    // ── Validation gate -> Under Review ───────────────────────────────────────
    // Nothing is released to the customer here. Validate, then hand to review queue.
    if (!skipGate) {
      const gate = await runValidationGate(bookId, { validationResult });
      console.log("[gate] book " + bookId + ": " + gate.message);
    }

    await setOperationalState(bookId, "idle", {
      generation_attempt_started_at: null,
      generation_heartbeat_at: null,
      generation_retry_at: null,
    });

    // ── No customer preview email is sent here. ───────────────────────────────
    // Customers receive an invitation ONLY after a human approves (review-workflow.ts).
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown generation failure";
    if (generationStarted) {
      await recordOperationalError(bookId, "generatePreview", error);
      if (isRetryableProviderError(error)) {
        if (
          generationRecoveryAttempts >= MAX_GENERATION_RECOVERY_ATTEMPTS
        ) {
          console.warn(
            `[pipeline] Provider recovery budget exhausted for ${bookId}: ${message}`,
          );
          await setOperationalState(bookId, "generation_recovery_exhausted", {
            status: "failed",
            generation_heartbeat_at: null,
            generation_retry_at: null,
          });
        } else {
          const delayMs = computeGenerationRetryDelayMs({
            retryAfter: error.diagnostics.retryAfter,
            recoveryAttempts: generationRecoveryAttempts,
          });
          const retryAt = new Date(Date.now() + delayMs).toISOString();
          console.warn(
            `[pipeline] Temporary OpenAI failure for ${bookId}; durable retry scheduled at ${retryAt}`,
            error.diagnostics,
          );
          await setOperationalState(bookId, "generation_retry_pending", {
            status: "preview_generating",
            generation_heartbeat_at: null,
            generation_retry_at: retryAt,
          });
        }
      } else {
        console.error(
          `Preview generation failed for book ${bookId}: ${message}`,
        );
        await setOperationalState(bookId, "failed", {
          status: "failed",
          generation_heartbeat_at: null,
          generation_retry_at: null,
        });
      }
    }
    throw error;
  }
}

/**
 * Executes the open, structured revision request against the exact immutable
 * predecessor. Full story generation is used as creative context, but only the
 * requested page fields are copied into the successor; unaffected fields keep
 * their predecessor values in applyRevision.
 *
 * Illustration output uses a request-specific storage prefix so a revision can
 * never overwrite an image URL referenced by an older immutable version.
 */
export async function runRequestedRevision(
  bookId: string,
  revisionRequestId: string,
): Promise<{
  ok: boolean;
  newVersionId: string | null;
  error?: string;
}> {
  const { data: request, error: requestError } = await supabaseAdmin
    .from("revision_requests")
    .select("id, feedback, status")
    .eq("id", revisionRequestId)
    .eq("book_id", bookId)
    .maybeSingle();
  if (requestError || !request || request.status !== "open") {
    return {
      ok: false,
      newVersionId: null,
      error:
        requestError?.message ??
        "The revision request is missing or is no longer open.",
    };
  }

  const { data: requestItems, error: itemsError } = await supabaseAdmin
    .from("revision_request_items")
    .select("page_number, scope")
    .eq("revision_request_id", revisionRequestId)
    .order("page_number", { ascending: true });
  if (itemsError || !requestItems || requestItems.length === 0) {
    return {
      ok: false,
      newVersionId: null,
      error: itemsError?.message ?? "The revision request has no page items.",
    };
  }

  const pageNumbers = Array.from(
    new Set(
      requestItems
        .map((item) => Number(item.page_number))
        .filter((pageNumber) => Number.isInteger(pageNumber) && pageNumber > 0),
    ),
  ).sort((a, b) => a - b);
  const scopeByPage: Record<
    number,
    "text" | "illustration" | "both"
  > = {};
  for (const item of requestItems) {
    const pageNumber = Number(item.page_number);
    if (
      Number.isInteger(pageNumber) &&
      pageNumber > 0 &&
      (item.scope === "text" ||
        item.scope === "illustration" ||
        item.scope === "both")
    ) {
      scopeByPage[pageNumber] = item.scope;
    }
  }

  const { book, child, secondChild } = await fetchBookWithChildren(bookId);
  const contextualAnswers: Record<string, string> =
    book.contextual_answers || {};
  const descriptions = extractAppearanceDescriptions(contextualAnswers);
  const storyContextualAnswers = Object.fromEntries(
    Object.entries(contextualAnswers).filter(
      ([key]) =>
        key !== "__appearance_desc" && key !== "__appearance_desc2",
    ),
  );
  const secondChildData = secondChild
    ? {
        name: secondChild.name,
        age: secondChild.age,
        gender: secondChild.gender,
        appearanceProfile: resolveCharacterProfile(
          secondChild,
          descriptions.second,
        ),
      }
    : undefined;

  const illustrationChildrenPromise = prepareIllustrationChildren(
    child,
    secondChild,
    descriptions,
  );
  let regeneratedFullStoryPromise: Promise<BookPage[]> | null = null;

  const result = await applyRevision(
    bookId,
    {
      pageNumbers,
      reason: String(request.feedback),
      scopeByPage,
      defaultScope: "both",
    },
    {
      regenerateStoryPages: async (_id, targets, reason) => {
        regeneratedFullStoryPromise ??= generateStory({
          childName: child.name,
          childAge: child.age,
          childGender: child.gender,
          appearanceProfile: resolveCharacterProfile(
            child,
            descriptions.first,
          ),
          themeId: book.theme_id,
          contextualAnswers: storyContextualAnswers,
          language: book.language || "en",
          secondChild: secondChildData,
          regenerationNote: reason,
        });
        const fullStory = await regeneratedFullStoryPromise;
        return targets.map((target) => {
          const page = fullStory.find(
            (candidate) => candidate.pageNumber === target,
          );
          if (!page) {
            throw new Error(
              `Regenerated story did not contain requested page ${target}`,
            );
          }
          return page;
        });
      },
      regenerateIllustrations: async (_id, storyPages) => {
        const skeleton = storySkeletons[book.theme_id];
        const sceneDescriptions = skeleton
          ? skeleton.map((scene) =>
              getSceneDescription(scene, Boolean(secondChild)),
            )
          : [];
        return generateIllustrations({
          bookId: `${bookId}/revisions/${revisionRequestId}`,
          storyPages,
          themeId: book.theme_id,
          sceneDescriptions,
          children: await illustrationChildrenPromise,
          contextualAnswers:
            book.contextual_answers as Record<string, unknown> | null,
        });
      },
      revalidate: async (_id, storyPages, illustrationUrls) => {
        const result = await validateBook({
          storyText: storyPages.map((page) => page.text).join("\n\n"),
          imageUrls: illustrationUrls.map((url) => String(url)),
          creature: resolveCreatureFromAnswers(
            book.contextual_answers as Record<string, unknown> | null,
          ),
          recipientName: child.name,
          attempt: 1,
          themeTitle: book.theme_title ?? null,
        });
        return result.failures.map((failure) => ({
          pageNumber: failure.pageNumber ?? null,
          code: failure.code,
          detail: failure.detail,
          severity: failure.severity ?? "blocker",
          source: failure.source ?? "both",
        }));
      },
    },
    revisionRequestId,
  );

  return {
    ok: result.ok,
    newVersionId: result.newVersionId,
    error: result.error,
  };
}

// ─── Fulfilment helpers (canonical tables) ─────────────────────────────────────

/** SHA-256 hash of an access token — matches the checkout/preview route logic. */
function hashAccessToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Records a retryable operational failure against the canonical
 * `operational_failures` table. Never throws — used on failure paths.
 */
async function recordOperationalFailure(params: {
  bookId: string;
  orderId?: string | null;
  stage: string | null;
  errorCode: string;
  errorDetail: string;
  context?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await supabaseAdmin.from("operational_failures").insert({
      book_id: params.bookId,
      order_id: params.orderId ?? null,
      stage: params.stage,
      error_code: params.errorCode,
      error_detail: params.errorDetail.slice(0, 2000),
      context: {
        retryable: true,
        ...(params.context ?? {}),
      },
    });
  } catch (err) {
    console.error(
      `[pipeline] Failed to record operational_failure for book ${params.bookId}:`,
      err
    );
  }
}

/**
 * Deterministically verifies that the customer route/authorization for a book
 * will succeed against the just-created access grant. Mirrors the token
 * resolution performed by the /preview/[bookId] route and checkout route:
 *   - a grant row exists for (token_hash, book_id)
 *   - it is not revoked and not expired
 *   - it points to exactly `expectedVersionId`
 * Returns true only when the grant would authorise the customer.
 */
async function verifyCustomerAccess(params: {
  bookId: string;
  tokenHash: string;
  expectedVersionId: string;
}): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("access_grants")
    .select("version_id, access_kind, expires_at, revoked_at")
    .eq("token_hash", params.tokenHash)
    .eq("book_id", params.bookId)
    .maybeSingle();

  if (error || !data) return false;
  if (data.revoked_at) return false;
  if (data.expires_at && new Date(data.expires_at as string).getTime() < Date.now()) {
    return false;
  }
  if (data.version_id !== params.expectedVersionId) return false;
  return true;
}

/** Verifies an actual HTTP response rather than trusting that a URL exists. */
async function verifyReachableUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { Range: "bytes=0-0" },
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch (error) {
    console.error("[pipeline] Bounded URL verification failed:", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Finalises a purchased book:
 *   1. Verifies the book is in exactly the "Purchased" lifecycle stage
 *   2. Fetches the approved version content
 *   3. Builds durable PDF artefacts
 *   4. Grants full-book access
 *   5. Verifies complete pages/storage/access response
 *   6. Records delivery attempts separately from generation attempts
 *   7. Sends idempotent delivery notification (email failure is operational)
 *   8. Transitions Purchased -> Delivered only after verifying all of the above
 *   9. Never marks delivered on provider acceptance alone
 */
export async function finalisePurchasedBook(
  bookId: string,
  /** The exact version that was purchased (from the order). When provided,
   *  used to verify `approved_version_id` matches before generating. */
  purchasedVersionId?: string | null,
  /** The order that triggered this finalisation. Used for idempotency
   *  (skip if `fulfilled_at` is already set) and to write `fulfilled_at`
   *  on completion. */
  orderId?: string | null,
): Promise<void> {
  let claimedDeliveryAttempt: {
    id: string;
    attemptNumber: number;
  } | null = null;
  let providerCallStarted = false;

  // ── Idempotency: skip if order already fulfilled ───────────────────────────
  if (orderId) {
    const { data: ord } = await supabaseAdmin
      .from("orders")
      .select("fulfilled_at")
      .eq("id", orderId)
      .maybeSingle();
    if (ord && (ord as Record<string, unknown>).fulfilled_at) {
      console.log(`[pipeline] Order ${orderId} already fulfilled — skipping finalisePurchasedBook.`);
      return;
    }
  }

  await setOperationalState(bookId, "finalising");

  try {
    const { book, child } = await fetchBookWithChildren(bookId);

    // ── Verify stage: must be exactly "Purchased" ──────────────────────────
    const lifecycleStage = book.lifecycle_stage as LifecycleStage | null;
    if (lifecycleStage !== "Purchased") {
      throw new Error(
        `finalisePurchasedBook: book ${bookId} must be in 'Purchased' stage (currently '${lifecycleStage ?? book.status}')`
      );
    }

    // ── Require an approved version — NO current/legacy fallback ───────────
    const approvedVersionId = book.approved_version_id as string | null;
    if (!approvedVersionId) {
      throw new Error(
        `finalisePurchasedBook: book ${bookId} has no approved_version_id — cannot fulfil`
      );
    }

    // The purchased version (from the order) must be exactly the approved one.
    if (purchasedVersionId && purchasedVersionId !== approvedVersionId) {
      throw new Error(
        `finalisePurchasedBook: purchased version ${purchasedVersionId} does not match approved_version_id ${approvedVersionId} for book ${bookId}`
      );
    }

    const orderQuery = supabaseAdmin
      .from("orders")
      .select(
        "id, book_id, version_id, user_id, purchaser_email, status, fulfilled_at, stripe_payment_intent_id, payment_verified_at",
      )
      .eq("book_id", bookId)
      .eq("version_id", approvedVersionId)
      .in("status", ["paid", "fulfilled"])
      .not("stripe_payment_intent_id", "is", null)
      .not("payment_verified_at", "is", null);
    type FulfilmentOrder = {
      id: string;
      book_id: string;
      version_id: string;
      user_id: string | null;
      purchaser_email: string | null;
      status: string;
      fulfilled_at: string | null;
      stripe_payment_intent_id: string;
      payment_verified_at: string;
    };
    let fulfilmentOrder: FulfilmentOrder | null = null;
    let orderError: { message: string } | null = null;
    if (orderId) {
      const orderResult = await orderQuery.eq("id", orderId).maybeSingle();
      fulfilmentOrder = orderResult.data as FulfilmentOrder | null;
      orderError = orderResult.error;
    } else {
      const orderResult = await orderQuery.limit(2);
      orderError = orderResult.error;
      if ((orderResult.data?.length ?? 0) === 1) {
        fulfilmentOrder = orderResult.data![0] as FulfilmentOrder;
      } else if (!orderError) {
        orderError = {
          message:
            "expected exactly one verified paid order; explicit operator reconciliation is required",
        };
      }
    }
    if (orderError || !fulfilmentOrder) {
      throw new Error(
        `finalisePurchasedBook: no verified paid order for exact version ${approvedVersionId}: ${orderError?.message ?? "not found"}`,
      );
    }
    const orderIdForGrant = fulfilmentOrder.id as string;
    if (
      fulfilmentOrder.fulfilled_at &&
      (book.lifecycle_stage as LifecycleStage | null) === "Delivered"
    ) {
      return;
    }

    // ── Verify every page has BOTH text and an illustration ────────────────
    const versionPages = await fetchVersionPages(approvedVersionId);
    if (versionPages.length === 0) {
      throw new Error(`Approved version ${approvedVersionId} has no pages`);
    }

    const incomplete = versionPages.filter(
      (p) =>
        !(typeof p.textContent === "string" && p.textContent.trim().length > 0) ||
        !p.illustrationUrl
    );
    if (incomplete.length > 0) {
      throw new Error(
        `Approved version ${approvedVersionId} is incomplete: pages ${incomplete
          .map((p) => p.pageNumber)
          .join(", ")} are missing text or illustration`
      );
    }

    const storyPages: BookPage[] = versionPages.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.textContent ?? "",
    }));
    const allIllustrationUrls: (string | null)[] = versionPages.map(
      (p) => p.illustrationUrl ?? null
    );

    // ── Idempotency: reuse an existing verified PDF artefact if present ─────
    const { data: existingArtefact } = await supabaseAdmin
      .from("product_artefacts")
      .select(
        "id, storage_path, metadata, durable_verified_at, access_verified_at",
      )
      .eq("book_id", bookId)
      .eq("version_id", approvedVersionId)
      .eq("kind", "pdf_digital")
      .not("durable_verified_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let pdfUrl: string;
    let pdfPrintUrl: string | null = null;
    let digitalArtefactId: string | null = null;

    const existingMetadata =
      (existingArtefact?.metadata as Record<string, unknown> | null) ?? null;
    const existingSignedUrl =
      existingArtefact?.storage_path &&
      existingMetadata?.storage_bucket === FINAL_BOOK_BUCKET
        ? await createFinalBookSignedUrl(existingArtefact.storage_path as string)
        : null;
    const existingStorageReachable = Boolean(
      existingSignedUrl && (await verifyReachableUrl(existingSignedUrl)),
    );
    if (
      existingArtefact &&
      existingStorageReachable &&
      existingSignedUrl
    ) {
      digitalArtefactId = existingArtefact.id as string;
      pdfUrl = existingSignedUrl;
      const verifiedAt = new Date().toISOString();
      const { error: verifyArtefactError } = await supabaseAdmin
        .from("product_artefacts")
        .update({
          durable_verified_at: verifiedAt,
          access_url: null,
        })
        .eq("id", existingArtefact.id);
      if (verifyArtefactError) {
        throw new Error(
          `Failed to record artefact verification: ${verifyArtefactError.message}`,
        );
      }
      console.log(
        `[pipeline] Reusing verified PDF artefact ${existingArtefact.id} for book ${bookId}`
      );
    } else {
      // ── Populate legacy book_pages + audio so PDF assembly reads real content
      await upsertBookPages(bookId, storyPages, allIllustrationUrls);

      // Legacy narration stored public bearer URLs. Keep it disabled until
      // audio has the same private, exact-payment access path as final PDFs.
      const audioStatus = "skipped";

      // ── Assemble the durable PDF artefact ────────────────────────────────
      const assembled = await assemblePdf(bookId, {
        versionId: approvedVersionId,
      });
      if (!assembled.pdfUrl) {
        throw new Error(
          "PDF assembly failed — pdfUrl is empty. Cannot finalise."
        );
      }
      pdfUrl = assembled.pdfUrl;
      pdfPrintUrl = assembled.pdfPrintUrl ?? null;
      if (!(await verifyReachableUrl(pdfUrl))) {
        throw new Error(
          `Stored PDF for book ${bookId} did not return a successful access response`,
        );
      }

      // Record durable artefacts AFTER a real PDF URL exists. We do NOT mutate
      // the immutable book_versions row — artefacts live in product_artefacts.
      const nowIso = new Date().toISOString();
      const artefactRows: Array<Record<string, unknown>> = [
        {
          book_id: bookId,
          version_id: approvedVersionId,
          kind: "pdf_digital",
          storage_path: assembled.storagePath,
          url: `private://${FINAL_BOOK_BUCKET}/${assembled.storagePath}`,
          access_url: null,
          durable_verified_at: nowIso,
          access_verified_at: null,
          metadata: {
            assembledBy: "finalisePurchasedBook",
            storage_bucket: FINAL_BOOK_BUCKET,
            signed_url_ttl_seconds: 15 * 60,
          },
        },
      ];
      if (pdfPrintUrl) {
        artefactRows.push({
          book_id: bookId,
          version_id: approvedVersionId,
          kind: "pdf_print",
          storage_path: assembled.printStoragePath,
          url: `private://${FINAL_BOOK_BUCKET}/${assembled.printStoragePath}`,
          access_url: null,
          durable_verified_at: null,
          access_verified_at: null,
          metadata: {
            assembledBy: "finalisePurchasedBook",
            storage_bucket: FINAL_BOOK_BUCKET,
            signed_url_ttl_seconds: 15 * 60,
          },
        });
      }
      const { data: insertedArtefacts, error: artefactErr } = await supabaseAdmin
        .from("product_artefacts")
        .insert(artefactRows)
        .select("id, kind");
      if (artefactErr) {
        throw new Error(
          `Failed to record durable product_artefacts for book ${bookId}: ${artefactErr.message}`
        );
      }
      digitalArtefactId =
        (insertedArtefacts?.find((row) => row.kind === "pdf_digital")?.id as
          | string
          | undefined) ?? null;
      if (!digitalArtefactId) {
        throw new Error(
          `Failed to resolve the durable digital artefact for book ${bookId}`,
        );
      }

      // Legacy status columns (best-effort; not the source of truth).
      await updateBookStatus(bookId, "complete", {
        illustration_urls: allIllustrationUrls,
        audio_status: audioStatus,
      });
    }

    // ── Grant exact-version full-book access (idempotent) ───────────────────
    // If a successful notification already exists, do not send it again. The
    // canonical transition remains safe and idempotent.
    const { data: existingSentAttempts, error: sentAttemptsError } =
      await supabaseAdmin
      .from("delivery_attempts")
      .select("id, access_grant_id")
      .eq("order_id", orderIdForGrant)
      .eq("book_id", bookId)
      .eq("version_id", approvedVersionId)
      .eq("status", "sent")
      .not("notification_sent_at", "is", null)
      .not("access_verified_at", "is", null)
      .order("created_at", { ascending: false });
    if (sentAttemptsError) {
      throw new Error(
        `Could not read sent delivery attempts: ${sentAttemptsError.message}`,
      );
    }
    const linkedGrantIds = Array.from(
      new Set(
        (existingSentAttempts ?? [])
          .map((attempt) => attempt.access_grant_id as string | null)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    let linkedGrants: LinkedDeliveryGrantEvidence[] = [];
    if (linkedGrantIds.length > 0) {
      const { data: grantRows, error: linkedGrantsError } = await supabaseAdmin
        .from("access_grants")
        .select(
          "id, order_id, book_id, version_id, access_kind, token_hash, verified_at, revoked_at, expires_at",
        )
        .in("id", linkedGrantIds);
      if (linkedGrantsError) {
        throw new Error(
          `Could not verify sent delivery grants: ${linkedGrantsError.message}`,
        );
      }
      linkedGrants = (grantRows ?? []).map((grant) => ({
        id: grant.id as string,
        orderId: grant.order_id as string | null,
        bookId: grant.book_id as string,
        versionId: grant.version_id as string,
        accessKind: grant.access_kind as string,
        tokenHash: grant.token_hash as string | null,
        verifiedAt: grant.verified_at as string | null,
        revokedAt: grant.revoked_at as string | null,
        expiresAt: grant.expires_at as string | null,
      }));
    }
    const usableSentAttempt = (existingSentAttempts ?? []).find((attempt) => {
      const accessGrantId = attempt.access_grant_id as string | null;
      const grant =
        linkedGrants.find((candidate) => candidate.id === accessGrantId) ?? null;
      return isUsableLinkedDeliveryGrant({
        grant,
        accessGrantId,
        orderId: orderIdForGrant,
        bookId,
        versionId: approvedVersionId,
      });
    });
    if (usableSentAttempt) {
      const replayTransition = await transitionStage(
        bookId,
        "Delivered",
        "system",
        "Previously verified access and delivery notification",
      );
      if (!replayTransition.ok) {
        throw new Error(
          `Delivered replay transition rejected: ${replayTransition.error}`,
        );
      }
      await setOperationalState(bookId, "idle");
      return;
    }
    if ((existingSentAttempts?.length ?? 0) > 0) {
      await recordOperationalFailure({
        bookId,
        orderId: orderIdForGrant,
        stage: "Purchased",
        errorCode: "sent_delivery_grant_unusable",
        errorDetail:
          "A previously sent delivery attempt no longer has its exact verified usable access grant; a replacement delivery attempt is required.",
        context: {
          staleAttemptIds: existingSentAttempts!.map((attempt) => attempt.id),
        },
      });
    }

    const email =
      fulfilmentOrder.purchaser_email ??
      (await fetchBookEmail(bookId));
    if (!email) {
      await recordOperationalFailure({
        bookId,
        orderId: orderIdForGrant,
        stage: "Purchased",
        errorCode: "delivery_no_recipient",
        errorDetail: "No captured email address to deliver the book to.",
      });
      await recordDeliveryAttempt({
        orderId: orderIdForGrant,
        bookId,
        versionId: approvedVersionId,
        status: "failed",
        errorDetail: "No recipient email",
      });
      await setOperationalState(bookId, "awaiting_delivery");
      throw new Error(
        `finalisePurchasedBook: book ${bookId} has no recipient email — remaining Purchased`
      );
    }

    // Claim this exact order/version before revoking or minting any capability.
    // The migration's partial unique index ensures only one worker can hold a
    // pending delivery claim, even when its preliminary read raced.
    const { data: ambiguousAttempt, error: ambiguousAttemptError } =
      await supabaseAdmin
        .from("delivery_attempts")
        .select("id, attempt_number, created_at")
        .eq("order_id", orderIdForGrant)
        .eq("book_id", bookId)
        .eq("version_id", approvedVersionId)
        .eq("channel", "email")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    if (ambiguousAttemptError) {
      throw new Error(
        `Could not check pending delivery attempts: ${ambiguousAttemptError.message}`,
      );
    }
    if (ambiguousAttempt) {
      throw new Error(
        `Ambiguous pending delivery attempt ${ambiguousAttempt.id}; reconcile provider status before retrying`,
      );
    }
    claimedDeliveryAttempt = await beginDeliveryAttempt({
      orderId: orderIdForGrant,
      bookId,
      versionId: approvedVersionId,
    });

    // A hash-only grant cannot recover the raw URL token on retry. Revoke any
    // unsent prior grant and mint a fresh exact-version token for this attempt.
    const { error: revokeGrantError } = await supabaseAdmin
      .from("access_grants")
      .update({ revoked_at: new Date().toISOString() })
      .eq("book_id", bookId)
      .eq("version_id", approvedVersionId)
      .eq("access_kind", "full_book")
      .is("revoked_at", null);
    if (revokeGrantError) {
      throw new Error(`Failed to revoke stale access grant: ${revokeGrantError.message}`);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const grantTokenHash = hashAccessToken(rawToken);
    const { data: createdGrant, error: grantErr } = await supabaseAdmin
      .from("access_grants")
      .insert({
        book_id: bookId,
        order_id: orderIdForGrant,
        version_id: approvedVersionId,
        grantee_user_id: fulfilmentOrder.user_id ?? book.user_id ?? null,
        grantee_email:
          fulfilmentOrder.purchaser_email ??
          ((book as Record<string, unknown>).purchaser_email as string | null) ??
          null,
        token_hash: grantTokenHash,
        access_kind: "full_book",
        expires_at: null,
        verified_at: null,
        metadata: {
          grantedBy: "finalisePurchasedBook",
          grantedAt: new Date().toISOString(),
        },
      })
      .select("id")
      .single();
    if (grantErr || !createdGrant) {
      throw new Error(
        `Failed to create access_grant for book ${bookId}: ${grantErr?.message ?? "no row"}`,
      );
    }

    // ── Deterministically verify the customer route/authorization ──────────
    const bookAccessUrl = `${getAppUrl()}/preview/${bookId}?token=${encodeURIComponent(rawToken)}`;
    const grantOk = await verifyCustomerAccess({
      bookId,
      tokenHash: grantTokenHash,
      expectedVersionId: approvedVersionId,
    });
    const routeOk = grantOk && (await verifyReachableUrl(bookAccessUrl));
    if (!routeOk) {
      throw new Error(
        `Access verification failed for book ${bookId}: the exact-version customer route did not return success`,
      );
    }
    const accessVerifiedAt = new Date().toISOString();
    const { error: verifyGrantError } = await supabaseAdmin
      .from("access_grants")
      .update({ verified_at: accessVerifiedAt })
      .eq("id", createdGrant.id);
    if (verifyGrantError) {
      throw new Error(`Failed to record verified access grant: ${verifyGrantError.message}`);
    }
    const { error: linkGrantError, count: linkedGrantCount } =
      await supabaseAdmin
        .from("delivery_attempts")
        .update(
          {
            access_grant_id: createdGrant.id,
            access_verified_at: accessVerifiedAt,
          },
          { count: "exact" },
        )
        .eq("id", claimedDeliveryAttempt.id)
        .eq("order_id", orderIdForGrant)
        .eq("version_id", approvedVersionId)
        .eq("status", "pending")
        .is("access_grant_id", null);
    if (linkGrantError || (linkedGrantCount ?? 0) !== 1) {
      throw new Error(
        `Failed to bind delivery attempt to its verified access grant: ${
          linkGrantError?.message ?? "delivery claim was lost"
        }`,
      );
    }
    if (!digitalArtefactId) {
      throw new Error(
        `Cannot record customer access for book ${bookId}: digital artefact identity is missing`,
      );
    }
    const { error: verifyArtefactAccessError, count: verifiedArtefactCount } =
      await supabaseAdmin
        .from("product_artefacts")
        .update(
          {
            access_url: null,
            access_verified_at: accessVerifiedAt,
          },
          { count: "exact" },
        )
        .eq("id", digitalArtefactId)
        .eq("book_id", bookId)
        .eq("version_id", approvedVersionId)
        .eq("kind", "pdf_digital")
        .not("durable_verified_at", "is", null);
    if (
      verifyArtefactAccessError ||
      (verifiedArtefactCount ?? 0) !== 1
    ) {
      throw new Error(
        `Failed to record verified customer artefact access: ${
          verifyArtefactAccessError?.message ?? "artefact was not durable"
        }`,
      );
    }

    // ── Send the delivery email and CONFIRM it was actually sent ────────────
    providerCallStarted = true;
    const sendResult = await sendDeliveryEmail({
      email,
      recipientName:
        ((book as Record<string, unknown>).recipient_name as string | null) ??
        "there",
      childName: child.name,
      bookId,
      bookUrl: bookAccessUrl,
      pdfUrl,
    });

    if (!sendResult.sent) {
      // Provider did not confirm delivery — this is an operational failure.
      await recordOperationalFailure({
        bookId,
        orderId: orderIdForGrant,
        stage: "Purchased",
        errorCode: "delivery_email_failed",
        errorDetail: sendResult.reason ?? "Email provider did not confirm send",
      });
      await finishDeliveryAttempt({
        attemptId: claimedDeliveryAttempt.id,
        status: "failed",
        errorDetail: sendResult.reason ?? "not_sent",
      });
      claimedDeliveryAttempt = null;
      await setOperationalState(bookId, "awaiting_delivery");
      throw new Error(
        `finalisePurchasedBook: delivery email for book ${bookId} was not sent (${sendResult.reason ?? "unknown"}) — remaining Purchased`
      );
    }

    // Record the provider acknowledgement on the already-durable pending
    // attempt. If this write fails, the pending row deliberately blocks an
    // automatic resend until an operator reconciles provider status.
    const deliveryRecorded = await finishDeliveryAttempt({
      attemptId: claimedDeliveryAttempt.id,
      status: "sent",
      notificationSentAt: new Date().toISOString(),
      providerMessageId:
        sendResult.providerMessageId ?? sendResult.provider ?? null,
    });
    if (!deliveryRecorded) {
      throw new Error(
        `Delivery notification was accepted but its durable attempt record failed for order ${orderIdForGrant}`,
      );
    }
    claimedDeliveryAttempt = null;

    // ── Transition Purchased -> Delivered (only after all of the above) ─────
    const deliverTransition = await transitionStage(
      bookId,
      "Delivered",
      "system",
      "PDF artefact stored, access verified, delivery email confirmed sent",
    );

    if (!deliverTransition.ok) {
      throw new Error(
        `[pipeline] Delivered transition rejected for book ${bookId}: ${deliverTransition.error}`
      );
    }

    await setOperationalState(bookId, "idle");
    console.log(`[pipeline] Book ${bookId} finalised and delivered.`);
  } catch (error) {
    // Deterministic pre-provider failures are safe to release for retry.
    // Once a provider call starts, an unfinished pending row is intentionally
    // ambiguous and must be reconciled instead of automatically resent.
    if (claimedDeliveryAttempt && !providerCallStarted) {
      await finishDeliveryAttempt({
        attemptId: claimedDeliveryAttempt.id,
        status: "failed",
        errorDetail:
          error instanceof Error ? error.message : "pre-provider finalisation failed",
      });
      claimedDeliveryAttempt = null;
    }
    // Never fulfil on failure. Remain Purchased (do NOT set status=failed here,
    // which would obscure the lifecycle stage) and record a retryable failure.
    console.error(`Full book finalisation failed for book ${bookId}:`, error);
    await recordOperationalFailure({
      bookId,
      orderId: orderId ?? null,
      stage: "Purchased",
      errorCode: "finalise_purchased_book_failed",
      errorDetail: error instanceof Error ? error.message : String(error),
    });
    await recordOperationalError(bookId, "finalisePurchasedBook", error);
    await setOperationalState(bookId, "failed");
    throw error;
  }
}

async function beginDeliveryAttempt(params: {
  orderId: string;
  bookId: string;
  versionId: string;
}): Promise<{ id: string; attemptNumber: number }> {
  const { data: prior, error: priorError } = await supabaseAdmin
    .from("delivery_attempts")
    .select("attempt_number")
    .eq("order_id", params.orderId)
    .eq("book_id", params.bookId)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (priorError) {
    throw new Error(`Failed to read delivery attempt history: ${priorError.message}`);
  }
  const attemptNumber = ((prior?.attempt_number as number | null) ?? 0) + 1;
  const idempotencyKey = [
    "delivery",
    params.orderId,
    params.versionId,
    String(attemptNumber),
  ].join(":");
  const { data, error } = await supabaseAdmin
    .from("delivery_attempts")
    .insert({
      order_id: params.orderId,
      book_id: params.bookId,
      version_id: params.versionId,
      attempt_number: attemptNumber,
      channel: "email",
      status: "pending",
      idempotency_key: idempotencyKey,
      access_grant_id: null,
      access_verified_at: null,
      metadata: { retryable: true, awaiting_provider_result: true },
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to begin durable delivery attempt: ${error?.message ?? "no row"}`,
    );
  }
  return { id: data.id as string, attemptNumber };
}

async function finishDeliveryAttempt(params: {
  attemptId: string;
  status: "sent" | "failed";
  notificationSentAt?: string | null;
  providerMessageId?: string | null;
  errorDetail?: string | null;
}): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from("delivery_attempts")
    .update(
      {
        status: params.status,
        notification_sent_at: params.notificationSentAt ?? null,
        delivered_at:
          params.status === "sent"
            ? params.notificationSentAt ?? new Date().toISOString()
            : null,
        provider_message_id: params.providerMessageId ?? null,
        error_detail: params.errorDetail ?? null,
        metadata: {
          retryable: params.status === "failed",
          awaiting_provider_result: false,
        },
      },
      { count: "exact" },
    )
    .eq("id", params.attemptId)
    .eq("status", "pending");
  if (error || (count ?? 0) !== 1) {
    console.error(
      `[pipeline] Failed to complete delivery attempt ${params.attemptId}:`,
      error?.message ?? "attempt was no longer pending",
    );
    return false;
  }
  return true;
}

/**
 * Records a delivery attempt in the canonical `delivery_attempts` table.
 * Returns false when the durable attempt row cannot be written. Callers must
 * not transition to Delivered unless a successful attempt returns true.
 */
async function recordDeliveryAttempt(params: {
  orderId: string | null;
  bookId: string;
  versionId: string | null;
  status: "pending" | "sent" | "failed" | "bounced";
  notificationSentAt?: string | null;
  accessVerifiedAt?: string | null;
  provider?: string | null;
  errorDetail?: string | null;
}): Promise<boolean> {
  // delivery_attempts.order_id is NOT NULL — skip if we have no order to anchor.
  if (!params.orderId) {
    if (params.status !== "sent") return false;
    console.warn(
      `[pipeline] Cannot record delivery_attempt for book ${params.bookId}: missing order_id`
    );
    return false;
  }

  // Compute next attempt_number for this order/book.
  const { data: prior } = await supabaseAdmin
    .from("delivery_attempts")
    .select("attempt_number")
    .eq("order_id", params.orderId)
    .eq("book_id", params.bookId)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const attemptNumber = ((prior?.attempt_number as number) ?? 0) + 1;

  const { error } = await supabaseAdmin.from("delivery_attempts").insert({
    order_id: params.orderId,
    book_id: params.bookId,
    version_id: params.versionId,
    attempt_number: attemptNumber,
    channel: "email",
    status: params.status,
    error_detail: params.errorDetail ?? null,
    delivered_at: params.status === "sent" ? new Date().toISOString() : null,
    notification_sent_at: params.notificationSentAt ?? null,
    access_verified_at: params.accessVerifiedAt ?? null,
    provider_message_id: params.provider ?? null,
  });

  if (error) {
    console.error(
      `[pipeline] Failed to record delivery_attempt for book ${params.bookId}:`,
      error.message
    );
    return false;
  }
  return true;
}

/** Canonical compatibility alias. Legacy status-based generation is forbidden. */
export async function generateFullBook(bookId: string): Promise<void> {
  const { data: book, error } = await supabaseAdmin
    .from("books")
    .select("lifecycle_stage")
    .eq("id", bookId)
    .maybeSingle();

  const lifecycleStage = book?.lifecycle_stage as LifecycleStage | null | undefined;
  if (error || !book || !canInvokeCanonicalFullBook(lifecycleStage)) {
    throw new Error(
      `generateFullBook: book ${bookId} must be an existing canonical Purchased book; lifecycle-null legacy generation is disabled`,
    );
  }
  return finalisePurchasedBook(bookId);
}
