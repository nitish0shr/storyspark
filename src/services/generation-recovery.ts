import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  MAX_GENERATION_RECOVERY_ATTEMPTS,
  assessStaleness,
  evaluateRecoveryEligibility,
  type GenerationRecoveryCandidate,
  type RecoveryAttemptResult,
  type RecoverySweepSummary,
} from "@/lib/generation-recovery";
import { generatePreview } from "@/services/book-pipeline";

const SWEEP_SCAN_LIMIT = 50;
const ACTIVITY_SWEEP_THROTTLE_MS = 60_000;

let lastActivitySweepAt = 0;
let activitySweepInFlight: Promise<RecoverySweepSummary> | null = null;

function toCandidate(row: Record<string, unknown>): GenerationRecoveryCandidate {
  return {
    bookId: String(row.id),
    status: String(row.status),
    generationAttemptStartedAt:
      typeof row.generation_attempt_started_at === "string"
        ? row.generation_attempt_started_at
        : null,
    generationHeartbeatAt:
      typeof row.generation_heartbeat_at === "string"
        ? row.generation_heartbeat_at
        : null,
    generationRetryAt:
      typeof row.generation_retry_at === "string"
        ? row.generation_retry_at
        : null,
    generationRecoveryAttempts: Number(row.generation_recovery_attempts ?? 0),
    operationalState:
      typeof row.operational_state === "string" ? row.operational_state : null,
    lifecycleStage:
      typeof row.lifecycle_stage === "string" ? row.lifecycle_stage : null,
    currentVersionId:
      typeof row.current_version_id === "string" ? row.current_version_id : null,
    updatedAt: String(row.updated_at),
  };
}

async function claimAndDispatch(
  candidate: GenerationRecoveryCandidate,
  trigger: "activity" | "protected_endpoint",
  now: Date,
): Promise<RecoveryAttemptResult> {
  const staleness = assessStaleness(candidate, now);
  if (!staleness.stale) {
    return {
      bookId: candidate.bookId,
      claimed: false,
      dispatched: false,
      reason: staleness.reason,
    };
  }
  const eligibility = evaluateRecoveryEligibility(candidate);
  if (!eligibility.eligible) {
    return {
      bookId: candidate.bookId,
      claimed: false,
      dispatched: false,
      reason: eligibility.reason,
    };
  }

  const attempt = candidate.generationRecoveryAttempts + 1;
  const nowIso = now.toISOString();
  const { data, error } = await supabaseAdmin
    .from("books")
    .update({
      status: "preview_generating",
      operational_state: "generation_recovery_claimed",
      generation_attempt_started_at: nowIso,
      generation_heartbeat_at: nowIso,
      generation_retry_at: null,
      generation_recovery_attempts: attempt,
      updated_at: nowIso,
    })
    .eq("id", candidate.bookId)
    .eq("status", "preview_generating")
    .is("lifecycle_stage", null)
    .is("current_version_id", null)
    .eq("generation_recovery_attempts", candidate.generationRecoveryAttempts)
    .eq("updated_at", candidate.updatedAt)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      bookId: candidate.bookId,
      claimed: false,
      dispatched: false,
      reason: error
        ? `Atomic recovery claim failed: ${error.message}`
        : "Another worker won the atomic recovery claim.",
    };
  }

  void generatePreview(candidate.bookId, false, {
    claimedRecoveryGeneration: true,
  }).catch((error: unknown) => {
    // The pipeline owns durable failure classification. Log only the safe
    // message here; never overwrite retry_pending with a terminal state.
    console.warn(
      `[generation-recovery] ${trigger} worker ended for ${candidate.bookId}: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
  });

  return {
    bookId: candidate.bookId,
    claimed: true,
    dispatched: true,
    reason: `Recovery attempt ${attempt} of ${MAX_GENERATION_RECOVERY_ATTEMPTS} dispatched by ${trigger}.`,
  };
}

export async function runGenerationRecoverySweep(
  trigger: "activity" | "protected_endpoint",
  now: Date = new Date(),
): Promise<RecoverySweepSummary> {
  const { data, error } = await supabaseAdmin
    .from("books")
    .select(
      "id, status, generation_attempt_started_at, generation_heartbeat_at, generation_retry_at, generation_recovery_attempts, operational_state, lifecycle_stage, current_version_id, updated_at",
    )
    .eq("status", "preview_generating")
    .is("lifecycle_stage", null)
    .is("current_version_id", null)
    .lt("generation_recovery_attempts", MAX_GENERATION_RECOVERY_ATTEMPTS)
    .order("updated_at", { ascending: true })
    .limit(SWEEP_SCAN_LIMIT);

  if (error) throw new Error(`Generation recovery scan failed: ${error.message}`);

  const candidates = (data ?? []).map((row) =>
    toCandidate(row as Record<string, unknown>),
  );
  const summary: RecoverySweepSummary = {
    scannedCount: candidates.length,
    staleCount: 0,
    eligibleCount: 0,
    claimedCount: 0,
    dispatchedCount: 0,
    skippedCount: 0,
    results: [],
  };

  for (const candidate of candidates) {
    const stale = assessStaleness(candidate, now).stale;
    if (stale) summary.staleCount++;
    const eligible = stale && evaluateRecoveryEligibility(candidate).eligible;
    if (eligible) summary.eligibleCount++;
    const result = await claimAndDispatch(candidate, trigger, now);
    summary.results.push(result);
    if (result.claimed) summary.claimedCount++;
    else summary.skippedCount++;
    if (result.dispatched) summary.dispatchedCount++;
  }

  return summary;
}

/**
 * Existing authenticated book-status polling invokes this in the live Autoscale
 * web deployment. The process-local throttle prevents each three-second poll
 * from scanning the queue, while the database claim remains the cross-instance
 * concurrency boundary.
 */
export async function runActivityTriggeredGenerationRecovery(): Promise<RecoverySweepSummary> {
  const now = Date.now();
  if (activitySweepInFlight) return activitySweepInFlight;
  if (now - lastActivitySweepAt < ACTIVITY_SWEEP_THROTTLE_MS) {
    return {
      scannedCount: 0,
      staleCount: 0,
      eligibleCount: 0,
      claimedCount: 0,
      dispatchedCount: 0,
      skippedCount: 0,
      results: [],
    };
  }
  lastActivitySweepAt = now;
  activitySweepInFlight = runGenerationRecoverySweep("activity");
  try {
    return await activitySweepInFlight;
  } finally {
    activitySweepInFlight = null;
  }
}