import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import {
  CANONICAL_RECOVERY_PAGE_COUNT,
  evaluateLegacyRecoveryEligibility,
  legacyRecoveryConfirmation,
  type LegacyRecoveryEvidence,
} from "../src/lib/legacy-recovery";

const migration = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/010_canonical_book_fulfilment.sql",
  ),
  "utf8",
);
const recoveryRoute = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "src/app/api/admin/regenerate-legacy-book/route.ts",
  ),
  "utf8",
);
const adminBooks = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/admin/books/page.tsx"),
  "utf8",
);
const adminReview = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/admin/review/page.tsx"),
  "utf8",
);
const pipeline = fs.readFileSync(
  path.resolve(process.cwd(), "src/services/book-pipeline.ts"),
  "utf8",
);
const checkout = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/api/checkout/route.ts"),
  "utf8",
);
const publicPreviewRoute = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/api/generate-preview/route.ts"),
  "utf8",
);

function eligibleEvidence(
  overrides: Partial<LegacyRecoveryEvidence> = {},
): LegacyRecoveryEvidence {
  return {
    lifecycleStage: null,
    legacyStatus: "pending_review",
    isPurchased: false,
    paidOrderCount: 0,
    completeVersionCount: 0,
    operationalState: null,
    skeletonPageNumbers: Array.from(
      { length: CANONICAL_RECOVERY_PAGE_COUNT },
      (_, index) => index + 1,
    ),
    ...overrides,
  };
}

describe("controlled legacy recovery eligibility", () => {
  test("allows one explicitly eligible snapshot-ineligible legacy book", () => {
    assert.deepEqual(evaluateLegacyRecoveryEligibility(eligibleEvidence()), {
      allowed: true,
      reason:
        "Eligible for one explicitly confirmed 12-page recovery generation attempt.",
    });
  });

  test("never regenerates the false legacy Delivered record", () => {
    const result = evaluateLegacyRecoveryEligibility(
      eligibleEvidence({ legacyStatus: "delivered" }),
    );
    assert.equal(result.allowed, false);
    assert.match(result.reason, /Delivered claim.*reconciliation/i);
  });

  test("blocks paid, canonical, complete-version, concurrent, and non-12-page cases", () => {
    const blocked = [
      eligibleEvidence({ paidOrderCount: 1 }),
      eligibleEvidence({ isPurchased: true }),
      eligibleEvidence({ lifecycleStage: "Generated" }),
      eligibleEvidence({ completeVersionCount: 1 }),
      eligibleEvidence({ operationalState: "legacy_recovery_queued" }),
      eligibleEvidence({ skeletonPageNumbers: [1, 2, 3] }),
      eligibleEvidence({
        skeletonPageNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 11],
      }),
    ];
    for (const evidence of blocked) {
      assert.equal(
        evaluateLegacyRecoveryEligibility(evidence).allowed,
        false,
      );
    }
  });

  test("uses a book-specific typed confirmation phrase", () => {
    assert.equal(
      legacyRecoveryConfirmation("12345678-abcd-1234-abcd-1234567890ab"),
      "REGENERATE 12345678",
    );
  });
});

describe("legacy review-token sealing", () => {
  test("migration revokes every active token without exact complete review identity", () => {
    assert.match(migration, /legacy_review_token_sealed/i);
    assert.match(
      migration,
      /update public\.book_review_tokens token[\s\S]*used_at = coalesce/i,
    );
    assert.match(migration, /expires_at = least/i);
    assert.match(
      migration,
      /book\.lifecycle_stage in \('Under Review', 'Revised'\)/i,
    );
    assert.match(migration, /book\.review_version_id = version\.id/i);
    assert.match(migration, /version\.is_complete/i);
  });
});

describe("explicit recovery action", () => {
  test("requires admin auth, typed confirmation, cost acknowledgement, and an atomic claim", () => {
    assert.match(recoveryRoute, /isAdminEmail\(user\.email\)/);
    assert.match(
      recoveryRoute,
      /confirmation !== legacyRecoveryConfirmation\(bookId\)/,
    );
    assert.match(recoveryRoute, /form\.get\("acknowledgeCost"\) === "yes"/);
    assert.match(recoveryRoute, /\.eq\("updated_at", book\.updated_at\)/);
    assert.match(recoveryRoute, /\.is\("lifecycle_stage", null\)/);
    assert.match(recoveryRoute, /await revokeReviewTokens\(bookId\)/);
    assert.match(recoveryRoute, /await generatePreview\(bookId, false/);
    assert.doesNotMatch(
      recoveryRoute,
      /generatePreview\(bookId[\s\S]*\)\.catch\(/,
    );
  });

  test("enforces exactly 12 pages and disables automatic regeneration", () => {
    assert.match(
      recoveryRoute,
      /expectedPageCount: CANONICAL_RECOVERY_PAGE_COUNT/,
    );
    assert.match(recoveryRoute, /allowAutomaticRegeneration: false/);
    assert.match(pipeline, /skeleton\?\.length === controls\.expectedPageCount/);
    assert.match(pipeline, /storyPages\.length === controls\.expectedPageCount/);
    assert.match(
      pipeline,
      /controls\.allowAutomaticRegeneration === false[\s\S]*undefined/,
    );
  });

  test("cannot be bypassed through owner, anonymous, or other default generation calls", () => {
    assert.match(
      publicPreviewRoute,
      /\.select\("id, user_id, status, lifecycle_stage"\)/,
    );
    assert.match(
      publicPreviewRoute,
      /book\.lifecycle_stage !== null \|\| book\.status !== "draft"/,
    );
    assert.match(
      pipeline,
      /Preview generation is allowed only for a new draft or an explicitly controlled legacy recovery/,
    );
    assert.match(
      pipeline,
      /controls\.expectedPageCount !== 12[\s\S]*controls\.allowAutomaticRegeneration !== false[\s\S]*startsWith\("admin:"\)/,
    );
    const proof = pipeline.indexOf(
      "Record the attempt only after the invocation boundary has been proven",
    );
    const stateMutation = pipeline.indexOf(
      'await setOperationalState(bookId, "generating_preview"',
    );
    assert.ok(proof >= 0 && stateMutation > proof);
  });
});

describe("legacy records remain visible and fail closed", () => {
  test("admin Books lists all lifecycle-null records outside the 100-book limit", () => {
    assert.match(adminBooks, /Controlled legacy recovery/);
    assert.match(
      adminBooks,
      /\.from\("books"\)[\s\S]*\.is\("lifecycle_stage", null\)[\s\S]*\.order\("created_at"/,
    );
    assert.match(adminBooks, /Nothing in this list regenerates/);
    assert.match(adminBooks, /regenerate-legacy-book/);
  });

  test("review queue visibly points to the controlled recovery list", () => {
    assert.match(adminReview, /\.is\("lifecycle_stage", null\)/);
    assert.match(adminReview, /incomplete legacy/);
    assert.match(adminReview, /Open the recovery list/);
  });

  test("lifecycle-null books cannot reach checkout or delivery", () => {
    assert.match(
      checkout,
      /This legacy book must be reconciled to an approved version before purchase/,
    );
    assert.match(
      migration,
      /v_from_stage = 'Purchased'\s+and p_to_stage = 'Delivered'/i,
    );
    assert.doesNotMatch(
      migration,
      /set lifecycle_stage\s*=\s*'Delivered'[\s\S]*where b\.lifecycle_stage is null/i,
    );
  });
});