/**
 * Generation recovery foundation tests.
 *
 * Asserts:
 *   1. Pure predicate logic in generation-recovery.ts
 *   2. Authorization invariants (CRON_SECRET Bearer only)
 *   3. Atomic reclaim predicates in the sweep route
 *   4. Pipeline control validation boundary (claimedRecoveryGeneration)
 *   5. Subscription route uses durable queued state
 *   6. Public preview route preserves exact owner check
 *   7. Migration adds exactly the required columns and storage policy
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  STALE_GENERATION_THRESHOLD_MS,
  MAX_GENERATION_RECOVERY_ATTEMPTS,
  RECOVERABLE_GENERATION_STATUSES,
  assessStaleness,
  evaluateRecoveryEligibility,
  buildRecoveryClaimPredicates,
  type GenerationRecoveryCandidate,
} from "../src/lib/generation-recovery";

// ─── File fixtures ──────────────────────────────────────────────────────────

const recoverRoute = readFileSync(
  "src/app/api/cron/recover-stuck-generation/route.ts",
  "utf8"
);
const recoveryService = readFileSync(
  "src/services/generation-recovery.ts",
  "utf8",
);
const bookStatusRoute = readFileSync(
  "src/app/api/book-status/route.ts",
  "utf8",
);
const previewPoller = readFileSync(
  "src/components/create/StepPreview.tsx",
  "utf8",
);
const subscriptionRoute = readFileSync(
  "src/app/api/subscription/generate/route.ts",
  "utf8"
);
const publicPreviewRoute = readFileSync(
  "src/app/api/generate-preview/route.ts",
  "utf8"
);
const pipeline = readFileSync("src/services/book-pipeline.ts", "utf8");
const migration = readFileSync(
  "supabase/migrations/011_generation_recovery.sql",
  "utf8"
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function baseCandidate(
  overrides: Partial<GenerationRecoveryCandidate> = {}
): GenerationRecoveryCandidate {
  const thresholdAgo = new Date(
    Date.now() - STALE_GENERATION_THRESHOLD_MS - 60_000
  ).toISOString();
  return {
    bookId: "00000000-0000-0000-0000-000000000001",
    status: "preview_generating",
    generationAttemptStartedAt: thresholdAgo,
    generationHeartbeatAt: null,
    generationRetryAt: null,
    operationalState: "generating_illustrations",
    generationRecoveryAttempts: 0,
    lifecycleStage: null,
    currentVersionId: null,
    updatedAt: thresholdAgo,
    ...overrides,
  };
}

function freshCandidate(
  overrides: Partial<GenerationRecoveryCandidate> = {}
): GenerationRecoveryCandidate {
  return baseCandidate({
    generationAttemptStartedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

describe("generation-recovery constants", () => {
  test("STALE_GENERATION_THRESHOLD_MS is 20 minutes", () => {
    assert.equal(STALE_GENERATION_THRESHOLD_MS, 20 * 60 * 1000);
  });

  test("MAX_GENERATION_RECOVERY_ATTEMPTS is 3", () => {
    assert.equal(MAX_GENERATION_RECOVERY_ATTEMPTS, 3);
  });

  test("only an atomically claimed preview generation is recoverable", () => {
    assert.ok(!RECOVERABLE_GENERATION_STATUSES.has("draft"));
    assert.ok(RECOVERABLE_GENERATION_STATUSES.has("preview_generating"));
    // Must not include terminal statuses
    assert.ok(!RECOVERABLE_GENERATION_STATUSES.has("failed"));
    assert.ok(!RECOVERABLE_GENERATION_STATUSES.has("preview_ready"));
    assert.ok(!RECOVERABLE_GENERATION_STATUSES.has("complete"));
  });
});

// ─── Staleness assessment ────────────────────────────────────────────────────

describe("assessStaleness", () => {
  test("stale: generation_attempt_started_at past threshold", () => {
    const result = assessStaleness(baseCandidate());
    assert.equal(result.stale, true);
    assert.ok(result.ageMs >= STALE_GENERATION_THRESHOLD_MS);
  });

  test("not stale: generation_attempt_started_at within threshold", () => {
    const result = assessStaleness(freshCandidate());
    assert.equal(result.stale, false);
  });

  test("not stale: heartbeat within threshold even if attempt_started is old", () => {
    const candidate = baseCandidate({
      generationHeartbeatAt: new Date().toISOString(),
    });
    const result = assessStaleness(candidate);
    assert.equal(result.stale, false);
    // Heartbeat is the liveness proof when it is newer
    assert.ok(result.livenessProof !== null);
  });

  test("not stale: an unclaimed draft is never swept into billable work", () => {
    const old = new Date(
      Date.now() - STALE_GENERATION_THRESHOLD_MS - 5_000
    ).toISOString();
    const candidate = baseCandidate({
      status: "draft",
      generationAttemptStartedAt: null,
      generationHeartbeatAt: null,
      updatedAt: old,
    });
    const result = assessStaleness(candidate);
    assert.equal(result.stale, false);
  });

  test("retry-pending generation becomes recoverable when retry_at is due", () => {
    const result = assessStaleness(
      freshCandidate({
        generationRetryAt: new Date(Date.now() - 1_000).toISOString(),
        operationalState: "generation_retry_pending",
      }),
    );
    assert.equal(result.stale, true);
    assert.match(result.reason, /retry time is due/i);
  });

  test("retry-pending generation is not recovered before retry_at", () => {
    const result = assessStaleness(
      baseCandidate({
        generationRetryAt: new Date(Date.now() + 60_000).toISOString(),
        operationalState: "generation_retry_pending",
      }),
    );
    assert.equal(result.stale, false);
  });

  test("not stale: lifecycle stage present means generation completed", () => {
    const candidate = baseCandidate({ lifecycleStage: "Generated" });
    const result = assessStaleness(candidate);
    assert.equal(result.stale, false);
  });

  test("not stale: current_version_id present means generation completed", () => {
    const candidate = baseCandidate({
      currentVersionId: "00000000-0000-0000-0000-000000000002",
    });
    const result = assessStaleness(candidate);
    assert.equal(result.stale, false);
  });

  test("not stale: non-generation status is excluded", () => {
    const candidate = baseCandidate({ status: "preview_ready" });
    const result = assessStaleness(candidate);
    assert.equal(result.stale, false);
  });

  test("injectable now parameter works for deterministic testing", () => {
    const now = new Date(
      Date.now() + STALE_GENERATION_THRESHOLD_MS + 10_000
    );
    const candidate = freshCandidate();
    const result = assessStaleness(candidate, now);
    // With a far-future 'now', even a fresh attempt appears stale
    assert.equal(result.stale, true);
  });
});

// ─── Recovery eligibility ────────────────────────────────────────────────────

describe("evaluateRecoveryEligibility", () => {
  test("eligible when all preconditions met", () => {
    const result = evaluateRecoveryEligibility(baseCandidate());
    assert.equal(result.eligible, true);
    assert.match(result.reason, /attempt 1 of 3/);
  });

  test("ineligible when lifecycle_stage is set", () => {
    const result = evaluateRecoveryEligibility(
      baseCandidate({ lifecycleStage: "Generated" })
    );
    assert.equal(result.eligible, false);
    assert.match(result.reason, /lifecycle stage/i);
  });

  test("ineligible when current_version_id is set", () => {
    const result = evaluateRecoveryEligibility(
      baseCandidate({ currentVersionId: "00000000-0000-0000-0000-000000000002" })
    );
    assert.equal(result.eligible, false);
    assert.match(result.reason, /current version/i);
  });

  test("ineligible when status is non-recoverable", () => {
    const result = evaluateRecoveryEligibility(
      baseCandidate({ status: "failed" })
    );
    assert.equal(result.eligible, false);
    assert.match(result.reason, /not eligible/i);
  });

  test("ineligible at max recovery attempts", () => {
    const result = evaluateRecoveryEligibility(
      baseCandidate({
        generationRecoveryAttempts: MAX_GENERATION_RECOVERY_ATTEMPTS,
      })
    );
    assert.equal(result.eligible, false);
    assert.match(result.reason, /limit.*reached|Human intervention/i);
  });

  test("eligible at attempt count 1 below max", () => {
    const result = evaluateRecoveryEligibility(
      baseCandidate({
        generationRecoveryAttempts: MAX_GENERATION_RECOVERY_ATTEMPTS - 1,
      })
    );
    assert.equal(result.eligible, true);
  });
});

// ─── Reclaim predicates ──────────────────────────────────────────────────────

describe("buildRecoveryClaimPredicates", () => {
  test("predicates encode all required atomic lock fields", () => {
    const candidate = baseCandidate();
    const predicates = buildRecoveryClaimPredicates(candidate);

    assert.equal(predicates.bookId, candidate.bookId);
    assert.deepEqual(
      predicates.statusIn.sort(),
      Array.from(RECOVERABLE_GENERATION_STATUSES).sort()
    );
    assert.equal(predicates.lifecycleStageIsNull, true);
    assert.equal(predicates.currentVersionIdIsNull, true);
    assert.equal(predicates.maxRecoveryAttempts, MAX_GENERATION_RECOVERY_ATTEMPTS);
    assert.equal(predicates.updatedAt, candidate.updatedAt);
  });
});

// ─── Sweep route authorization ───────────────────────────────────────────────

describe("recover-stuck-generation route authorization", () => {
  test("route exports only POST, not GET, PUT, or DELETE", () => {
    assert.match(recoverRoute, /export async function POST/);
    assert.doesNotMatch(recoverRoute, /export async function GET/);
    assert.doesNotMatch(recoverRoute, /export async function PUT/);
    assert.doesNotMatch(recoverRoute, /export async function DELETE/);
  });

  test("enforces CRON_SECRET Bearer token", () => {
    assert.match(recoverRoute, /CRON_SECRET/);
    assert.match(recoverRoute, /Bearer \$\{expectedToken\}/);
    assert.match(recoverRoute, /status: 401/);
  });

  test("rejects when CRON_SECRET is missing or token does not match", () => {
    // Verify the guard requires BOTH a configured secret AND a matching header
    assert.match(
      recoverRoute,
      /!expectedToken \|\| authHeader !== `Bearer \$\{expectedToken\}`/
    );
  });
});

// ─── Sweep route atomic reclaim predicates ───────────────────────────────────

describe("recover-stuck-generation route reclaim predicates", () => {
  test("sweep queries lifecycle_stage IS NULL and current_version_id IS NULL", () => {
    assert.match(recoveryService, /\.is\("lifecycle_stage", null\)/);
    assert.match(recoveryService, /\.is\("current_version_id", null\)/);
  });

  test("atomic UPDATE includes exact updated_at predicate", () => {
    assert.match(recoveryService, /\.eq\("updated_at", candidate\.updatedAt\)/);
  });

  test("atomic UPDATE preserves lifecycle_stage and current_version_id IS NULL predicates", () => {
    // The conditional update must re-check both predicates
    const updateBlock = recoveryService.slice(
      recoveryService.indexOf(".update({"),
      recoveryService.indexOf(".maybeSingle()")
    );
    assert.match(updateBlock, /\.is\("lifecycle_stage", null\)/);
    assert.match(updateBlock, /\.is\("current_version_id", null\)/);
  });

  test("atomic UPDATE increments generation_recovery_attempts", () => {
    assert.match(recoveryService, /generation_recovery_attempts: attempt/);
  });

  test("sweep checks generation_recovery_attempts < MAX before scanning", () => {
    assert.match(
      recoveryService,
      /\.lt\("generation_recovery_attempts", MAX_GENERATION_RECOVERY_ATTEMPTS\)/
    );
  });

  test("dispatch uses claimedRecoveryGeneration control exclusively", () => {
    assert.match(recoveryService, /claimedRecoveryGeneration: true/);
    assert.doesNotMatch(recoveryService, /claimedPublicGeneration: true/);
    assert.doesNotMatch(recoveryService, /controlledLegacyRecovery: true/);
  });

  test("no lifecycle stage, order, payment, or access mutations", () => {
    // Must not call lifecycle transition or touch orders/access
    assert.doesNotMatch(recoveryService, /transitionStage/);
    assert.doesNotMatch(recoveryService, /lifecycle_stage.*=/);
    assert.doesNotMatch(recoveryService, /from\("orders"\)/);
    assert.doesNotMatch(recoveryService, /from\("access_grants"\)/);
    assert.doesNotMatch(recoveryService, /payment/);
  });
});

describe("automatic production recovery trigger", () => {
  test("authenticated book-status traffic invokes the activity sweep", () => {
    assert.match(bookStatusRoute, /runActivityTriggeredGenerationRecovery/);
    assert.match(
      bookStatusRoute,
      /if \(book\.status === "preview_generating"\)[\s\S]*await runActivityTriggeredGenerationRecovery\(\)/,
    );
  });

  test("the existing creation UI automatically polls book-status", () => {
    assert.match(previewPoller, /fetch\(`\/api\/book-status\?bookId=\$\{bookId\}`\)/);
    assert.match(previewPoller, /setInterval\(poll, POLL_INTERVAL\)/);
  });

  test("activity sweeps are throttled but database claims stay atomic", () => {
    assert.match(recoveryService, /ACTIVITY_SWEEP_THROTTLE_MS = 60_000/);
    assert.match(
      recoveryService,
      /\.eq\("generation_recovery_attempts", candidate\.generationRecoveryAttempts\)/,
    );
  });

  test("the protected endpoint is explicitly optional", () => {
    assert.match(recoverRoute, /Optional secondary trigger/);
    assert.match(recoverRoute, /does not depend on this endpoint/);
  });
});

// ─── Pipeline control validation ─────────────────────────────────────────────

describe("pipeline claimedRecoveryGeneration control", () => {
  test("claimedRecoveryGeneration is defined in PreviewGenerationControls", () => {
    assert.match(pipeline, /claimedRecoveryGeneration\?: boolean/);
  });

  test("pipeline validates claimedRecoveryGeneration requires preview_generating status and null lifecycle", () => {
    assert.match(
      pipeline,
      /isClaimedRecoveryGeneration[\s\S]*lifecycleStage !== null[\s\S]*book\.status !== "preview_generating"/
    );
  });

  test("pipeline rejects claimedRecoveryGeneration with skipGate or legacy recovery", () => {
    assert.match(
      pipeline,
      /isClaimedRecoveryGeneration[\s\S]*skipGate[\s\S]*isControlledLegacyRecovery/
    );
  });

  test("invalid claimedRecoveryGeneration invocation throws a descriptive error", () => {
    assert.match(
      pipeline,
      /Invalid claimed recovery generation invocation/
    );
  });

  test("claimedRecoveryGeneration sets generationStarted = true before dispatch", () => {
    // Find the claimedRecoveryGeneration branch and verify generationStarted = true
    const branchStart = pipeline.indexOf("isClaimedRecoveryGeneration");
    const branchText = pipeline.slice(branchStart, branchStart + 1000);
    assert.match(branchText, /generationStarted = true/);
  });

  test("claimedPublicGeneration is mutually exclusive with claimedRecoveryGeneration", () => {
    // The public generation branch must reject if claimedRecoveryGeneration is set
    assert.match(
      pipeline,
      /isClaimedPublicGeneration[\s\S]*isClaimedRecoveryGeneration/
    );
  });
});

// ─── Subscription route durable claim ────────────────────────────────────────

describe("subscription generate route durable claim", () => {
  test("inserts book in preview_generating state with generation_attempt_started_at", () => {
    assert.match(subscriptionRoute, /status: "preview_generating"/);
    assert.match(subscriptionRoute, /generation_attempt_started_at:/);
  });

  test("dispatches with its dedicated subscription claim control", () => {
    assert.match(subscriptionRoute, /claimedSubscriptionGeneration: true/);
    assert.doesNotMatch(subscriptionRoute, /claimedPublicGeneration: true/);
  });

  test("does not insert book in plain draft state", () => {
    // The subscription route must never insert as plain draft without a claim
    assert.doesNotMatch(subscriptionRoute, /status: "draft"/);
  });
});

// ─── Public preview route owner check preservation ──────────────────────────

describe("public preview route owner checks (unchanged)", () => {
  test("fetches book with id, user_id, status, lifecycle_stage", () => {
    assert.match(
      publicPreviewRoute,
      /\.select\("id, user_id, status, lifecycle_stage"\)/
    );
  });

  test("enforces isCreatorOwner identity check", () => {
    assert.match(publicPreviewRoute, /isCreatorOwner\(identity\.userId, book\.user_id\)/);
  });

  test("blocks lifecycle_stage !== null OR status !== draft", () => {
    assert.match(
      publicPreviewRoute,
      /book\.lifecycle_stage !== null \|\| book\.status !== "draft"/
    );
  });

  test("atomic draft claim predicate includes lifecycle IS NULL", () => {
    assert.match(publicPreviewRoute, /\.is\("lifecycle_stage", null\)/);
    assert.match(publicPreviewRoute, /\.eq\("status", "draft"\)/);
    assert.match(publicPreviewRoute, /\.eq\("user_id", identity\.userId\)/);
  });
});

// ─── Migration ───────────────────────────────────────────────────────────────

describe("migration 011 schema additions", () => {
  test("adds generation_attempt_started_at column", () => {
    assert.match(
      migration,
      /add column if not exists generation_attempt_started_at timestamptz/
    );
  });

  test("adds generation_heartbeat_at column", () => {
    assert.match(
      migration,
      /add column if not exists generation_heartbeat_at timestamptz/
    );
  });

  test("adds the nullable durable retry timestamp", () => {
    assert.match(
      migration,
      /add column if not exists generation_retry_at timestamptz/,
    );
  });

  test("adds generation_recovery_attempts column with default 0", () => {
    assert.match(
      migration,
      /add column if not exists generation_recovery_attempts integer not null default 0/
    );
  });

  test("creates partial index for stale generation scan", () => {
    assert.match(migration, /idx_books_stale_generation/);
    assert.match(migration, /lifecycle_stage is null/);
    assert.match(migration, /current_version_id is null/);
  });

  test("creates a dedicated private character-reference bucket", () => {
    assert.match(migration, /character-reference-sheets/);
    assert.match(migration, /false,/);
  });

  test("creates service-role-only policy for character references", () => {
    assert.match(
      migration,
      /Service role manages character reference sheets/
    );
    assert.match(migration, /to service_role/);
    assert.match(migration, /bucket_id = 'character-reference-sheets'/);
  });

  test("does not alter the existing illustration bucket privacy or policies", () => {
    assert.doesNotMatch(migration, /bucket_id = 'book-illustrations'/);
    assert.doesNotMatch(migration, /Illustrations are publicly readable/);
  });
});
