/**
 * Durable generation recovery — pure predicate and bookkeeping logic.
 *
 * This module contains ONLY the recovery-specific logic and constants.
 * It has no side effects: callers (the sweep route) decide when to act.
 *
 * Key design decisions:
 *
 *   • A generation is recoverable when its durable retry time is due or its
 *     last liveness proof is older than STALE_GENERATION_THRESHOLD_MS.
 *
 *   • A recovery is "eligible" when the book has no current_version_id
 *     (no complete snapshot), lifecycle_stage IS NULL (never reached
 *     Generated), and generation_recovery_attempts < MAX_RECOVERY_ATTEMPTS.
 *
 *   • The sweep uses an atomic conditional UPDATE so only one sweep
 *     winner can reclaim a given row in a race.
 *
 *   • generatePreview is invoked with `claimedRecoveryGeneration: true`
 *     only after the atomic reclaim succeeds. This control is analogous
 *     to claimedPublicGeneration and must be validated inside the pipeline.
 *
 *   • No lifecycle stage, order, payment, or access data is mutated here.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Milliseconds since the last heartbeat (or generation_attempt_started_at
 * when no heartbeat exists) before a generation is considered stale.
 * 20 minutes: long enough for a real generation, short enough to recover
 * within a reasonable time window.
 */
export const STALE_GENERATION_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes

/**
 * Maximum number of automatic recovery attempts before the sweep stops
 * touching the book. Keeps the loop bounded and forces human attention
 * after repeated failures.
 */
export const MAX_GENERATION_RECOVERY_ATTEMPTS = 3;
export const MIN_GENERATION_RETRY_DELAY_MS = 30_000;
export const MAX_GENERATION_RETRY_DELAY_MS = 15 * 60_000;

/**
 * Statuses that indicate an in-progress generation that can become stale.
 * draft  : inserted, but generation never started (subscription path races)
 * preview_generating : claimed and dispatched
 */
export const RECOVERABLE_GENERATION_STATUSES = new Set([
  "preview_generating",
]);

function retryAfterMilliseconds(
  value: string | null,
  nowMs: number,
): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const dateMs = Date.parse(value);
  return Number.isFinite(dateMs) ? Math.max(0, dateMs - nowMs) : null;
}

/**
 * Schedules a new durable worker attempt; it does not retry an SDK call.
 * Provider Retry-After is honoured when present, otherwise recovery attempts
 * use bounded exponential backoff. Positive jitter avoids a queue stampede.
 */
export function computeGenerationRetryDelayMs(params: {
  retryAfter: string | null;
  recoveryAttempts: number;
  nowMs?: number;
  jitterUnit?: number;
}): number {
  const nowMs = params.nowMs ?? Date.now();
  const jitterUnit = Math.max(0, Math.min(1, params.jitterUnit ?? Math.random()));
  const exponent = Math.max(0, Math.min(params.recoveryAttempts, 4));
  const exponential = 60_000 * 2 ** exponent;
  const providerDelay = retryAfterMilliseconds(params.retryAfter, nowMs);
  const guidedDelay = providerDelay ?? exponential;
  const withPositiveJitter = guidedDelay * (1 + jitterUnit * 0.25);
  return Math.round(
    Math.max(
      MIN_GENERATION_RETRY_DELAY_MS,
      Math.min(withPositiveJitter, MAX_GENERATION_RETRY_DELAY_MS),
    ),
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GenerationRecoveryCandidate {
  /** Book identifier */
  bookId: string;
  /** Current status column value */
  status: string;
  /** When the generation attempt started (non-null for claimed generation) */
  generationAttemptStartedAt: string | null;
  /** Most recent heartbeat timestamp, if any */
  generationHeartbeatAt: string | null;
  /** Explicit durable retry time after a final transient SDK failure. */
  generationRetryAt: string | null;
  /** Observable worker/retry state. */
  operationalState: string | null;
  /** How many recovery attempts have already been made */
  generationRecoveryAttempts: number;
  /** Must be NULL: recovery only applies to pre-lifecycle books */
  lifecycleStage: string | null;
  /** Must be NULL: book must have no complete snapshot */
  currentVersionId: string | null;
  /** updated_at: used as an optimistic lock predicate in the atomic reclaim */
  updatedAt: string;
}

export interface RecoveryEligibility {
  eligible: boolean;
  reason: string;
}

export interface StalenessAssessment {
  stale: boolean;
  reason: string;
  livenessProof: string | null;
  ageMs: number;
}

// ─── Staleness ────────────────────────────────────────────────────────────────

/**
 * Determines whether a generation attempt is stale.
 *
 * A stale generation has:
 *   1. generation_attempt_started_at set (an attempt was made), OR
 *      status = 'draft' with no attempt started (subscription insert races)
 *   2. The best liveness proof (heartbeat > attempt_started) is older
 *      than STALE_GENERATION_THRESHOLD_MS
 *   3. lifecycle_stage IS NULL and current_version_id IS NULL
 *      (generation never completed successfully)
 *
 * @param candidate - The candidate book row
 * @param now       - Reference timestamp (injectable for tests)
 */
export function assessStaleness(
  candidate: GenerationRecoveryCandidate,
  now: Date = new Date(),
): StalenessAssessment {
  if (candidate.lifecycleStage !== null) {
    return {
      stale: false,
      reason: "Book has a lifecycle stage; generation completed normally.",
      livenessProof: null,
      ageMs: 0,
    };
  }

  if (candidate.currentVersionId !== null) {
    return {
      stale: false,
      reason: "Book has a current version; generation completed successfully.",
      livenessProof: null,
      ageMs: 0,
    };
  }

  if (!RECOVERABLE_GENERATION_STATUSES.has(candidate.status)) {
    return {
      stale: false,
      reason: `Status '${candidate.status}' is not a mid-generation status.`,
      livenessProof: null,
      ageMs: 0,
    };
  }

  if (candidate.generationRetryAt) {
    const retryAtMs = new Date(candidate.generationRetryAt).getTime();
    const ageMs = now.getTime() - retryAtMs;
    if (Number.isFinite(retryAtMs) && ageMs >= 0) {
      return {
        stale: true,
        reason: "The durable provider retry time is due.",
        livenessProof: candidate.generationRetryAt,
        ageMs,
      };
    }
    return {
      stale: false,
      reason: "The durable provider retry time has not arrived.",
      livenessProof: candidate.generationRetryAt,
      ageMs,
    };
  }

  // Best liveness proof: prefer heartbeat over attempt_started
  const livenessProof =
    candidate.generationHeartbeatAt ?? candidate.generationAttemptStartedAt;

  // Defensive fallback for claimed rows created before the timestamp migration.
  const referenceTimestamp = livenessProof ?? candidate.updatedAt;

  const ageMs = now.getTime() - new Date(referenceTimestamp).getTime();

  if (ageMs < STALE_GENERATION_THRESHOLD_MS) {
    return {
      stale: false,
      reason: `Generation is ${Math.round(ageMs / 1000)}s old; threshold is ${STALE_GENERATION_THRESHOLD_MS / 1000}s.`,
      livenessProof,
      ageMs,
    };
  }

  return {
    stale: true,
    reason: `Generation has been unresponsive for ${Math.round(ageMs / 1000)}s (threshold: ${STALE_GENERATION_THRESHOLD_MS / 1000}s).`,
    livenessProof,
    ageMs,
  };
}

// ─── Recovery eligibility ─────────────────────────────────────────────────────

/**
 * Determines whether a stale book is eligible for automatic recovery.
 *
 * Preconditions (checked separately from staleness):
 *   • lifecycle_stage IS NULL — never reached the canonical pipeline
 *   • current_version_id IS NULL — no complete snapshot
 *   • generation_recovery_attempts < MAX_GENERATION_RECOVERY_ATTEMPTS
 *   • status is a known mid-generation status
 *
 * @param candidate - The candidate book row
 */
export function evaluateRecoveryEligibility(
  candidate: GenerationRecoveryCandidate,
): RecoveryEligibility {
  if (candidate.lifecycleStage !== null) {
    return {
      eligible: false,
      reason: "Book has a lifecycle stage; only pre-lifecycle books are recovered automatically.",
    };
  }

  if (candidate.currentVersionId !== null) {
    return {
      eligible: false,
      reason: "Book has a current version; no generation recovery is needed.",
    };
  }

  if (!RECOVERABLE_GENERATION_STATUSES.has(candidate.status)) {
    return {
      eligible: false,
      reason: `Status '${candidate.status}' is not eligible for automatic recovery.`,
    };
  }

  if (candidate.generationRecoveryAttempts >= MAX_GENERATION_RECOVERY_ATTEMPTS) {
    return {
      eligible: false,
      reason: `Recovery attempt limit (${MAX_GENERATION_RECOVERY_ATTEMPTS}) reached. Human intervention required.`,
    };
  }

  return {
    eligible: true,
    reason: `Eligible for recovery attempt ${candidate.generationRecoveryAttempts + 1} of ${MAX_GENERATION_RECOVERY_ATTEMPTS}.`,
  };
}

// ─── Atomic reclaim predicate ─────────────────────────────────────────────────

/**
 * Returns the conditional UPDATE predicates that must ALL be true for the
 * atomic reclaim to succeed. The sweep passes these directly to the database
 * query so only one concurrent sweeper can win.
 *
 * Predicates:
 *   • id = bookId                          (target row)
 *   • status IN (recoverable statuses)     (still mid-generation)
 *   • lifecycle_stage IS NULL              (has not completed)
 *   • current_version_id IS NULL           (no snapshot)
 *   • generation_recovery_attempts < MAX   (bounded)
 *   • updated_at = candidate.updatedAt     (optimistic lock)
 */
export interface RecoveryClaimPredicates {
  bookId: string;
  statusIn: string[];
  lifecycleStageIsNull: true;
  currentVersionIdIsNull: true;
  maxRecoveryAttempts: number;
  updatedAt: string;
}

export function buildRecoveryClaimPredicates(
  candidate: GenerationRecoveryCandidate,
): RecoveryClaimPredicates {
  return {
    bookId: candidate.bookId,
    statusIn: Array.from(RECOVERABLE_GENERATION_STATUSES),
    lifecycleStageIsNull: true,
    currentVersionIdIsNull: true,
    maxRecoveryAttempts: MAX_GENERATION_RECOVERY_ATTEMPTS,
    updatedAt: candidate.updatedAt,
  };
}

// ─── Recovery summary types ────────────────────────────────────────────────────

export interface RecoveryAttemptResult {
  bookId: string;
  claimed: boolean;
  dispatched: boolean;
  reason: string;
}

export interface RecoverySweepSummary {
  scannedCount: number;
  staleCount: number;
  eligibleCount: number;
  claimedCount: number;
  dispatchedCount: number;
  skippedCount: number;
  results: RecoveryAttemptResult[];
}
