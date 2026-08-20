export const CANONICAL_RECOVERY_PAGE_COUNT = 12;
export const LEGACY_RECOVERY_CONFIRM_PREFIX = "REGENERATE";

export function canInvokeCanonicalFullBook(
  lifecycleStage: string | null | undefined,
): boolean {
  return lifecycleStage === "Purchased";
}

const RECOVERABLE_LEGACY_STATUSES = new Set([
  "preview_ready",
  "pending_review",
  "failed",
]);

const ACTIVE_GENERATION_STATES = new Set([
  "generating_preview",
  "legacy_recovery_queued",
  "preview_generating",
  "generating",
]);

export interface LegacyRecoveryEvidence {
  lifecycleStage: string | null;
  legacyStatus: string;
  isPurchased: boolean;
  paidOrderCount: number;
  completeVersionCount: number;
  operationalState: string | null;
  skeletonPageNumbers: number[];
}

export interface LegacyRecoveryEligibility {
  allowed: boolean;
  reason: string;
}

export function legacyRecoveryConfirmation(bookId: string): string {
  return `${LEGACY_RECOVERY_CONFIRM_PREFIX} ${bookId.slice(0, 8)}`;
}

export function evaluateLegacyRecoveryEligibility(
  evidence: LegacyRecoveryEvidence,
): LegacyRecoveryEligibility {
  if (evidence.lifecycleStage !== null) {
    return {
      allowed: false,
      reason: "A canonical lifecycle stage already exists.",
    };
  }
  if (evidence.legacyStatus === "delivered") {
    return {
      allowed: false,
      reason:
        "The legacy Delivered claim requires separate payment and delivery reconciliation; regeneration is blocked.",
    };
  }
  if (evidence.isPurchased || evidence.paidOrderCount > 0) {
    return {
      allowed: false,
      reason:
        "Payment evidence exists. Reconcile the financial record without regenerating or recharging.",
    };
  }
  if (evidence.completeVersionCount > 0) {
    return {
      allowed: false,
      reason:
        "A complete immutable version already exists. Reconcile its lifecycle pointers instead of spending on regeneration.",
    };
  }
  if (!RECOVERABLE_LEGACY_STATUSES.has(evidence.legacyStatus)) {
    return {
      allowed: false,
      reason: `Legacy status '${evidence.legacyStatus}' is not approved for controlled regeneration.`,
    };
  }
  if (
    evidence.operationalState &&
    ACTIVE_GENERATION_STATES.has(evidence.operationalState)
  ) {
    return {
      allowed: false,
      reason: "A generation or recovery operation is already active.",
    };
  }

  const hasCanonicalSkeleton =
    evidence.skeletonPageNumbers.length === CANONICAL_RECOVERY_PAGE_COUNT &&
    evidence.skeletonPageNumbers.every(
      (pageNumber, index) => pageNumber === index + 1,
    );
  if (!hasCanonicalSkeleton) {
    return {
      allowed: false,
      reason:
        "The selected theme does not provide the required contiguous 12-page canonical skeleton.",
    };
  }

  return {
    allowed: true,
    reason:
      "Eligible for one explicitly confirmed 12-page recovery generation attempt.",
  };
}