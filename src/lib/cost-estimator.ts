/**
 * Cost estimation for AI book generation.
 *
 * We don't have per-call cost data from OpenAI/Replicate response headers,
 * so we use conservative fixed estimates per operation. Tune these against
 * real monthly invoices once we have 30+ days of volume.
 *
 * All values in cents (integer).
 */

// ---- OpenAI ----
// GPT-4o-mini story generation: ~2-3k input + ~2k output tokens per book.
// At $0.15/1M input + $0.60/1M output → ~$0.002, round up to 1 cent to be safe.
export const STORY_GENERATION_CENTS = 1;

// Face analysis (vision API): single image, ~500 output tokens.
// At $2.50/1M input (vision) + $10/1M output → ~$0.01, use 2 cents.
export const FACE_ANALYSIS_CENTS = 2;

// ---- Replicate ----
// FLUX.1 schnell at ~$0.003/image. Call it 1 cent per image to be safe
// (covers failed retries and model upgrades to dev/pro).
export const ILLUSTRATION_CENTS_PER_IMAGE = 3;

// Preview generates cover + 2 pages = 3 illustrations.
export const PREVIEW_IMAGE_COUNT = 3;

// Full book has 12 pages; preview already did 3, so ~9 more for completion.
export const FULL_BOOK_ADDITIONAL_IMAGE_COUNT = 9;

// ---- Composite estimates ----

/**
 * Cost to generate a preview (story + face analysis + 3 images).
 * ~5 cents total.
 */
export function estimatePreviewCost(): {
  openaiCents: number;
  replicateCents: number;
} {
  return {
    openaiCents: STORY_GENERATION_CENTS + FACE_ANALYSIS_CENTS,
    replicateCents: ILLUSTRATION_CENTS_PER_IMAGE * PREVIEW_IMAGE_COUNT,
  };
}

/**
 * Incremental cost for completing the book after preview (9 more images).
 * ~27 cents.
 */
export function estimateFullBookCompletionCost(): {
  openaiCents: number;
  replicateCents: number;
} {
  return {
    openaiCents: 0, // story already generated in preview
    replicateCents:
      ILLUSTRATION_CENTS_PER_IMAGE * FULL_BOOK_ADDITIONAL_IMAGE_COUNT,
  };
}

/**
 * Total estimated cost for a fully generated book (preview + full).
 * ~32 cents.
 */
export function estimateTotalBookCost(): number {
  const preview = estimatePreviewCost();
  const full = estimateFullBookCompletionCost();
  return (
    preview.openaiCents +
    preview.replicateCents +
    full.openaiCents +
    full.replicateCents
  );
}
