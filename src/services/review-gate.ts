/**
 * The gate between "a story was generated" and "a human can see it".
 *
 * Runs the automated checks, records the result and the attempt count, and
 * routes the book. It NEVER releases anything to a customer - the best case
 * is that the book reaches the human review queue.
 *
 * Regeneration is bounded by MAX_GENERATION_ATTEMPTS so a bad prompt can
 * never loop forever.
 *
 * On success: transitions Generated -> Under Review.
 * On failure: routes to human review regardless (needs_regeneration legacy).
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveCreatureFromAnswers } from "@/data/animals";
import {
  validateBook,
  type ValidationResult,
} from "@/lib/content-validation";
import { submitForReview, logReviewEvent } from "@/lib/review-workflow";
import { replaceVersionFindings } from "@/lib/book-versions";
import { storySkeletons, getSceneDescription } from "@/data/story-skeletons";

export interface GateResult {
  ok: boolean;
  attempt: number;
  status: string;
  message: string;
}

function storyToText(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (!raw) return "";
  try {
    return JSON.stringify(raw);
  } catch {
    return "";
  }
}

/**
 * A prevalidated result lets generation perform page-scoped correction before
 * immutable snapshotting, then bind those exact findings to that snapshot.
 */
export async function runValidationGate(
  bookId: string,
  options: { validationResult?: ValidationResult } = {},
): Promise<GateResult> {
  const { data: book } = await supabaseAdmin
    .from("books")
    .select(
      "id, story_text, illustration_urls, contextual_answers, recipient_name, child_name, generation_attempts, theme_id, theme_title, second_child_profile_id, lifecycle_stage, current_version_id",
    )
    .eq("id", bookId)
    .maybeSingle();

  if (!book) {
    return { ok: false, attempt: 0, status: "failed", message: "Book not found." };
  }
  if (!book.current_version_id) {
    return {
      ok: false,
      attempt: 0,
      status: "failed",
      message: "Validation cannot be bound to an immutable book version.",
    };
  }

  const creature = resolveCreatureFromAnswers(
    book.contextual_answers as Record<string, unknown> | null,
  );
  const images = Array.isArray(book.illustration_urls)
    ? (book.illustration_urls as string[])
    : [];
  const skeleton = storySkeletons[book.theme_id];
  const sceneDescriptions = skeleton
    ? skeleton.map((scene) =>
        getSceneDescription(scene, Boolean(book.second_child_profile_id)),
      )
    : [];
  const attempt =
    options.validationResult?.attempt ?? (book.generation_attempts ?? 0) + 1;
  const result =
    options.validationResult ??
    (await validateBook({
      storyText: storyToText(book.story_text),
      imageUrls: images,
      creature,
      recipientName: book.recipient_name || book.child_name || "",
      attempt,
      themeTitle: book.theme_title ?? null,
      themeId: book.theme_id,
      sceneDescriptions,
    }));

  await replaceVersionFindings(
    book.current_version_id as string,
    result.failures,
  );
  await supabaseAdmin
    .from("books")
    .update({
      validation_result: result as unknown as Record<string, unknown>,
      generation_attempts: attempt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookId);

  if (result.ok) {
    const sub = await submitForReview(bookId);
    return {
      ok: true,
      attempt,
      status: "Under Review",
      message: "Passed automated checks. " + sub.message,
    };
  }

  await logReviewEvent({
    bookId,
    action: "validation_failed",
    attempt,
    notes: result.failures
      .map((failure) => `${failure.code}: ${failure.detail}`)
      .join(" | ")
      .slice(0, 2000),
  });
  await supabaseAdmin
    .from("books")
    .update({
      status: "needs_regeneration",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookId);

  const sub = await submitForReview(bookId);
  return {
    ok: false,
    attempt,
    status: sub.status || "needs_regeneration",
    message:
      "Automated checks found issues after the bounded page correction - routed to human review. " +
      sub.message,
  };
}
