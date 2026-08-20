import type { TokenState } from "@/lib/review-tokens";

export interface CanonicalReviewAccessInput {
  tokenState: TokenState;
  bookId: string | null;
  tokenVersionId: string | null;
  lifecycleStage: string | null;
  reviewVersionId: string | null;
  versionExists: boolean;
  pageCount: number;
}

export function hasCanonicalReviewIdentity(
  input: Pick<
    CanonicalReviewAccessInput,
    "tokenState" | "bookId" | "tokenVersionId"
  >,
): boolean {
  return (
    input.tokenState === "valid" &&
    Boolean(input.bookId) &&
    Boolean(input.tokenVersionId)
  );
}

/**
 * Review content is sensitive and immutable-version-specific. Any uncertainty
 * is a reconciliation case, never permission to render mutable legacy fields.
 */
export function canRenderCanonicalReview(
  input: CanonicalReviewAccessInput,
): boolean {
  return (
    hasCanonicalReviewIdentity(input) &&
    (input.lifecycleStage === "Under Review" ||
      input.lifecycleStage === "Revised") &&
    input.reviewVersionId === input.tokenVersionId &&
    input.versionExists &&
    input.pageCount > 0
  );
}