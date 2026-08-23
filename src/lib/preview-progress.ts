export const LONG_RUNNING_NOTICE_AFTER_MS = 120_000;

export type PreviewProgressPhase = "working" | "ready" | "failed";

export interface PreviewProgressState {
  phase: PreviewProgressPhase;
  keepPolling: boolean;
  showLongRunningNotice: boolean;
}

const READY_STATUSES = new Set([
  "preview_ready",
  "complete",
  "completed",
  "purchased",
]);

/**
 * Only a real terminal status stops polling. Elapsed time changes the message,
 * never the generation outcome.
 */
export function getPreviewProgressState(
  status: unknown,
  elapsedMs: number,
): PreviewProgressState {
  if (typeof status === "string" && READY_STATUSES.has(status)) {
    return {
      phase: "ready",
      keepPolling: false,
      showLongRunningNotice: false,
    };
  }
  if (status === "failed") {
    return {
      phase: "failed",
      keepPolling: false,
      showLongRunningNotice: false,
    };
  }
  return {
    phase: "working",
    keepPolling: true,
    showLongRunningNotice: elapsedMs >= LONG_RUNNING_NOTICE_AFTER_MS,
  };
}