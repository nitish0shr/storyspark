/**
 * Lifecycle transition service.
 *
 * All stage transitions go through transitionStage(), which:
 *   1. Validates the move is legal (via book-lifecycle rules)
 *   2. Executes it as a conditional UPDATE (preventing races)
 *   3. Appends an immutable audit event
 *
 * No customer-visible action is taken here — callers handle emails / access
 * grants separately after a successful transition.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { isLegalTransition } from "@/lib/book-lifecycle";
import type { LifecycleStage } from "@/types/book";

export interface TransitionResult {
  ok: boolean;
  fromStage: LifecycleStage | null;
  toStage: LifecycleStage;
  bookId: string;
  error?: string;
}

/**
 * Atomically transitions a book through the canonical database boundary.
 * The RPC locks the book, validates version/payment/delivery preconditions,
 * checks the optimistic lifecycle revision, updates the stage timestamp and
 * appends the lifecycle event in one transaction.
 *
 * @param bookId    - Target book
 * @param toStage   - Desired next stage
 * @param actor     - Human identifier or system label
 * @param reason    - Optional human-readable reason
 * @param extra     - Additional columns to merge into the UPDATE
 */
export async function transitionStage(
  bookId: string,
  toStage: LifecycleStage,
  actor: string,
  reason?: string | null,
  extra: Record<string, unknown> = {},
): Promise<TransitionResult> {
  const { data: book, error: fetchErr } = await supabaseAdmin
    .from("books")
    .select(
      "lifecycle_stage, lifecycle_revision, current_version_id, review_version_id, approved_version_id",
    )
    .eq("id", bookId)
    .maybeSingle();

  if (fetchErr || !book) {
    return {
      ok: false,
      fromStage: null,
      toStage,
      bookId,
      error: "Book not found: " + (fetchErr?.message ?? "no row"),
    };
  }

  const fromStage = (book.lifecycle_stage ?? null) as LifecycleStage | null;

  // Validate
  const validation = isLegalTransition(fromStage, toStage);
  if (!validation.allowed) {
    return {
      ok: false,
      fromStage,
      toStage,
      bookId,
      error: validation.reason ?? "Transition not allowed",
    };
  }

  const currentVersionId = book.current_version_id as string | null;
  const reviewVersionId = book.review_version_id as string | null;
  const approvedVersionId = book.approved_version_id as string | null;
  const versionId =
    toStage === "Approved"
      ? reviewVersionId
      : toStage === "Ready for Purchase" ||
          toStage === "Purchased" ||
          toStage === "Delivered"
        ? approvedVersionId
        : currentVersionId;

  const idempotencyKey = [
    "lifecycle",
    bookId,
    String(book.lifecycle_revision ?? 0),
    String(fromStage),
    toStage,
  ].join(":");

  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
    "transition_book_lifecycle",
    {
      p_book_id: bookId,
      p_expected_stage: fromStage,
      p_to_stage: toStage,
      p_version_id: versionId,
      p_expected_revision: Number(book.lifecycle_revision ?? 0),
      p_actor: actor,
      p_reason: reason ?? null,
      p_idempotency_key: idempotencyKey,
      p_metadata: Object.keys(extra).length > 0 ? { extra } : null,
    },
  );

  if (rpcError) {
    return {
      ok: false,
      fromStage,
      toStage,
      bookId,
      error: "Lifecycle RPC failed: " + rpcError.message,
    };
  }

  const result = rpcData as {
    ok?: boolean;
    error?: string;
    current_stage?: string | null;
    message?: string;
  } | null;
  if (!result?.ok) {
    return {
      ok: false,
      fromStage,
      toStage,
      bookId,
      error:
        result?.message ??
        result?.error ??
        `Transition from '${String(fromStage)}' to '${toStage}' was rejected`,
    };
  }

  if (Object.keys(extra).length > 0) {
    const { error: extraError } = await supabaseAdmin
      .from("books")
      .update({ ...extra, updated_at: new Date().toISOString() })
      .eq("id", bookId)
      .eq("lifecycle_stage", toStage);
    if (extraError) {
      await recordOperationalError(bookId, "transition_metadata", extraError);
    }
  }

  return { ok: true, fromStage, toStage, bookId };
}

// ─── Audit log ────────────────────────────────────────────────────────────────

/** @deprecated Lifecycle events are appended transactionally by the RPC. */
export async function appendLifecycleEvent(params: {
  bookId: string;
  fromStage: LifecycleStage | null;
  toStage: LifecycleStage;
  actor: string;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("lifecycle_events").insert({
    book_id: params.bookId,
    from_stage: params.fromStage ?? null,
    to_stage: params.toStage,
    actor: params.actor,
    reason: params.reason ?? null,
    metadata: params.metadata ?? null,
  });

  if (error) {
    // Audit failures are non-fatal — the transition already succeeded
    console.error("[lifecycle] audit insert failed:", error.message);
  }
}

// ─── Operational state helpers ─────────────────────────────────────────────────

/**
 * Records an operational attempt on a book (e.g. "generating_preview").
 * Operational state is separate from lifecycle stage.
 */
export async function setOperationalState(
  bookId: string,
  state: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("books")
    .update({
      operational_state: state,
      updated_at: new Date().toISOString(),
      ...extra,
    })
    .eq("id", bookId);

  if (error) {
    console.error(`[lifecycle] setOperationalState(${bookId}, ${state}) failed:`, error.message);
  }
}

/**
 * Records an operational error against a book.
 * Does NOT change lifecycle_stage — the human reviewer decides what to do.
 */
export async function recordOperationalError(
  bookId: string,
  errorContext: string,
  err: unknown,
): Promise<void> {
  const maybeProviderError =
    err && typeof err === "object"
      ? (err as {
          isRetryableProviderError?: unknown;
          diagnostics?: unknown;
        })
      : null;
  const providerDiagnostics =
    maybeProviderError?.isRetryableProviderError === true &&
    maybeProviderError.diagnostics &&
    typeof maybeProviderError.diagnostics === "object"
      ? maybeProviderError.diagnostics
      : null;
  const errorPayload = {
    context: errorContext,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? (err.stack?.slice(0, 500) ?? null) : null,
    providerDiagnostics,
    recordedAt: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("books")
    .update({
      operational_error: errorPayload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookId);

  if (error) {
    console.error(`[lifecycle] recordOperationalError(${bookId}) failed:`, error.message);
  }

  const { error: logError } = await supabaseAdmin
    .from("operational_failures")
    .insert({
      book_id: bookId,
      stage: errorContext,
      error_code: "operation_failed",
      error_detail: errorPayload.message,
      context: errorPayload,
    });
  if (logError) {
    console.error(`[lifecycle] operational failure insert (${bookId}) failed:`, logError.message);
  }
}

// ─── Stage query helpers ───────────────────────────────────────────────────────

export async function getLifecycleStage(bookId: string): Promise<LifecycleStage | null> {
  const { data } = await supabaseAdmin
    .from("books")
    .select("lifecycle_stage")
    .eq("id", bookId)
    .maybeSingle();
  return (data?.lifecycle_stage ?? null) as LifecycleStage | null;
}
