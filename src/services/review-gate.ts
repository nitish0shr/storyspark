/**
 * The gate between "a story was generated" and "a human can see it".
 *
 * Runs the automated checks, records the result and the attempt count, and
 * routes the book. It NEVER releases anything to a customer - the best case
 * is that the book reaches the human review queue.
 *
 * Regeneration is bounded by MAX_GENERATION_ATTEMPTS so a bad prompt can
 * never loop forever.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveCreatureFromAnswers } from "@/data/animals";
import {
  validateBook,
  buildCorrectivePrompt,
  MAX_GENERATION_ATTEMPTS,
} from "@/lib/content-validation";
import { submitForReview, logReviewEvent } from "@/lib/review-workflow";

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
 * @param bookId     the book that has just finished generating
 * @param regenerate optional callback that re-runs generation for one more
 *                   attempt. Must NOT call this gate again (pass skipGate).
 */
export async function runValidationGate(
  bookId: string,
  regenerate?: (bookId: string, corrective: string) => Promise<void>,
): Promise<GateResult> {
  for (let i = 0; i < MAX_GENERATION_ATTEMPTS + 1; i++) {
    const { data: book } = await supabaseAdmin
      .from("books")
      .select(
        "id, story_text, illustration_urls, contextual_answers, recipient_name, child_name, generation_attempts",
      )
      .eq("id", bookId)
      .maybeSingle();

    if (!book) return { ok: false, attempt: 0, status: "failed", message: "Book not found." };

    const attempt = (book.generation_attempts ?? 0) + 1;
    const creature = resolveCreatureFromAnswers(
      book.contextual_answers as Record<string, unknown> | null,
    );
    const images = Array.isArray(book.illustration_urls)
      ? (book.illustration_urls as string[]).filter(Boolean)
      : [];

    const result = await validateBook({
      storyText: storyToText(book.story_text),
      imageUrls: images,
      creature,
      recipientName: book.recipient_name || book.child_name || "",
      attempt,
    });

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
        status: "pending_review",
        message: "Passed automated checks. " + sub.message,
      };
    }

    await logReviewEvent({
      bookId,
      action: "validation_failed",
      attempt,
      notes: result.failures.map((f) => f.code + ": " + f.detail).join(" | ").slice(0, 2000),
    });

    const canRetry = attempt < MAX_GENERATION_ATTEMPTS && typeof regenerate === "function";
    if (!canRetry) break;

    const corrective = buildCorrectivePrompt(result.failures, creature);
    await logReviewEvent({ bookId, action: "regenerated", attempt, notes: corrective.slice(0, 2000) });
    try {
      await regenerate!(bookId, corrective);
    } catch (err) {
      console.error("[gate] regeneration failed:", err);
      break;
    }
  }

  // Out of automatic attempts: a human decides what happens next.
  await supabaseAdmin
    .from("books")
    .update({ status: "needs_regeneration", updated_at: new Date().toISOString() })
    .eq("id", bookId);

  const sub = await submitForReview(bookId);
  return {
    ok: false,
    attempt: MAX_GENERATION_ATTEMPTS,
    status: sub.status || "needs_regeneration",
    message:
      "Automated checks still failing after " + MAX_GENERATION_ATTEMPTS +
      " attempts - routed to human review. " + sub.message,
  };
}
