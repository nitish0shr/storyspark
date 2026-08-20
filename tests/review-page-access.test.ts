import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  canRenderCanonicalReview,
  type CanonicalReviewAccessInput,
} from "@/lib/review-page-access";

const valid: CanonicalReviewAccessInput = {
  tokenState: "valid",
  bookId: "book-1",
  tokenVersionId: "version-1",
  lifecycleStage: "Under Review",
  reviewVersionId: "version-1",
  versionExists: true,
  pageCount: 12,
};

describe("canonical review page access", () => {
  test("allows only a complete exact immutable review version", () => {
    assert.equal(canRenderCanonicalReview(valid), true);
  });

  for (const tokenState of ["used", "expired", "unknown"] as const) {
    test(`${tokenState} tokens disclose no review content`, () => {
      assert.equal(
        canRenderCanonicalReview({ ...valid, tokenState }),
        false,
      );
    });
  }

  test("unbound tokens disclose no review content", () => {
    assert.equal(
      canRenderCanonicalReview({ ...valid, tokenVersionId: null }),
      false,
    );
  });

  test("review-version mismatches disclose no review content", () => {
    assert.equal(
      canRenderCanonicalReview({
        ...valid,
        reviewVersionId: "version-newer",
      }),
      false,
    );
  });

  test("missing immutable version pages disclose no review content", () => {
    assert.equal(canRenderCanonicalReview({ ...valid, pageCount: 0 }), false);
  });

  test("the route has no mutable legacy-content fallback", () => {
    const source = readFileSync("src/app/review/[token]/page.tsx", "utf8");
    const routeBody = source.slice(source.indexOf("export default async function ReviewPage"));
    assert.doesNotMatch(source, /book\.story_text|book\.illustration_urls/);
    assert.doesNotMatch(source, /Legacy fallback/);
    assert.match(source, /return <ReviewUnavailable \/>/);
    assert.match(source, /canRenderCanonicalReview\(/);
    assert.ok(
      routeBody.indexOf("!hasCanonicalReviewIdentity") <
        routeBody.indexOf('.from("books")'),
      "invalid token states must return before the book is fetched",
    );
    assert.ok(
      routeBody.indexOf("!canRenderCanonicalReview") <
        routeBody.indexOf("{/* Book metadata */}"),
      "invalid bindings or missing pages must return before content rendering",
    );
  });
});