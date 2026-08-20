/**
 * The Starmee human-approval workflow (canonical lifecycle edition).
 *
 * Rules this file enforces:
 *   - nothing reaches a customer without a human approving it
 *   - EVERY lifecycle change goes through the canonical RPC
 *     (transition_book_lifecycle) — never a direct status/stage UPDATE
 *   - approval binds the EXACT version the reviewer evaluated: the token's
 *     version must equal the book's review_version_id, and the RPC re-checks
 *     the version match server-side
 *   - approval mints a FRESH exact-version opaque preview access grant token
 *     (the review token is never reused as a customer preview token)
 *   - preview pages are chosen from the immutable snapshot; page rows are
 *     never mutated
 *   - the invitation email is recorded as a durable delivery attempt and sent
 *     idempotently; only if it actually sends do we advance to
 *     "Ready for Purchase", otherwise the book stays "Approved" and an
 *     operational failure is recorded
 *   - request-changes / reject create exactly one structured revision request
 *     (plus page items) and transition once, via the revision engine
 */

import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email-provider";
import { revokeReviewTokens } from "@/lib/review-tokens";
import { recordOperationalError } from "@/lib/lifecycle-service";
import { fetchVersionPages } from "@/lib/book-versions";
import { selectPreviewPages } from "@/lib/book-lifecycle";
import type { LifecycleStage } from "@/types/book";

export type ReviewAction =
  | "submitted"
  | "approved"
  | "rejected"
  | "regenerated"
  | "delivered"
  | "validation_failed";

export interface WorkflowResult {
  ok: boolean;
  status?: string;
  message: string;
}

const PREVIEW_TOKEN_TTL_DAYS = Number(process.env.PREVIEW_TOKEN_TTL_DAYS || 30);

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL || "https://app.starmeestories.com"
  ).replace(/\/$/, "");
}

function reviewerInbox(): string {
  return process.env.REVIEW_EMAIL || process.env.ADMIN_EMAIL || "";
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ─── Canonical lifecycle transition (RPC gateway) ──────────────────────────────

interface RpcTransitionResult {
  ok: boolean;
  error?: string;
  from_stage?: string | null;
  to_stage?: string;
  version_id?: string | null;
  idempotent_replay?: boolean;
  message?: string;
}

/**
 * The ONLY way this module changes a lifecycle stage. Wraps the SECURITY
 * DEFINER RPC transition_book_lifecycle, which validates the transition,
 * binds version pointers, enforces version/version-match/completeness/payment
 * preconditions, and appends an idempotent lifecycle_events row.
 *
 * Stale-update protection: unless an explicit expectedRevision is supplied,
 * this fetches the book's current lifecycle_revision and passes it as the
 * RPC's optimistic lock. If the counter moved between our read and the RPC's
 * row lock, the transition is rejected with a revision_conflict rather than
 * silently applying a stale change.
 */
async function transitionLifecycle(params: {
  bookId: string;
  expectedStage: LifecycleStage | null;
  toStage: LifecycleStage;
  versionId: string | null;
  actor: string;
  reason?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown> | null;
  expectedRevision?: number | null;
}): Promise<RpcTransitionResult> {
  // Resolve the optimistic-lock revision. When the caller does not pin one,
  // read the book's current lifecycle_revision so concurrent transitions are
  // detected (revision_conflict) instead of clobbering each other.
  let expectedRevision = params.expectedRevision ?? null;
  if (expectedRevision === null) {
    const { data: book, error: revErr } = await supabaseAdmin
      .from("books")
      .select("lifecycle_revision")
      .eq("id", params.bookId)
      .maybeSingle();
    if (revErr) {
      return { ok: false, error: "could_not_read_revision: " + revErr.message };
    }
    if (!book) {
      return { ok: false, error: "book_not_found" };
    }
    expectedRevision = Number(book.lifecycle_revision ?? 0);
  }

  const { data, error } = await supabaseAdmin.rpc("transition_book_lifecycle", {
    p_book_id: params.bookId,
    p_expected_stage: params.expectedStage,
    p_to_stage: params.toStage,
    p_version_id: params.versionId,
    p_expected_revision: expectedRevision,
    p_actor: params.actor,
    p_reason: params.reason ?? null,
    p_idempotency_key: params.idempotencyKey ?? null,
    p_metadata: params.metadata ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return (data ?? { ok: false, error: "empty_rpc_result" }) as RpcTransitionResult;
}

/** Append an immutable review audit row. Never throws into the caller's path. */
export async function logReviewEvent(params: {
  bookId: string;
  action: ReviewAction;
  reviewer?: string | null;
  notes?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  attempt?: number | null;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("book_review_events").insert({
    book_id: params.bookId,
    action: params.action,
    reviewer: params.reviewer ?? null,
    notes: params.notes ?? null,
    from_status: params.fromStatus ?? null,
    to_status: params.toStatus ?? null,
    attempt: params.attempt ?? null,
  });
  if (error) console.error("[review] audit insert failed:", error.message);
}

// ─── Submit for review ─────────────────────────────────────────────────────────

/**
 * Move a freshly generated book into the review queue and notify the reviewer.
 * Transition: Generated -> Under Review (RPC binds review_version_id).
 * Idempotent: a book already Under Review succeeds quietly.
 */
export async function submitForReview(bookId: string): Promise<WorkflowResult> {
  const { data: book, error: fetchErr } = await supabaseAdmin
    .from("books")
    .select(
      "id, lifecycle_stage, current_version_id, child_name, recipient_name, theme_title, selected_animal, public_ref",
    )
    .eq("id", bookId)
    .maybeSingle();

  if (fetchErr || !book) {
    return { ok: false, message: "Book not found: " + (fetchErr?.message ?? "unknown") };
  }

  const currentStage = (book.lifecycle_stage ?? null) as LifecycleStage | null;
  const currentVersionId = (book.current_version_id as string | null) ?? null;

  if (currentStage === "Under Review") {
    return { ok: true, status: "Under Review", message: "Already under review." };
  }

  if (!currentVersionId) {
    return {
      ok: false,
      message: "Cannot submit for review: book has no current version snapshot.",
    };
  }

  const transition = await transitionLifecycle({
    bookId,
    expectedStage: currentStage,
    toStage: "Under Review",
    versionId: currentVersionId,
    actor: "system",
    reason: "Automated validation passed — submitted for human review",
  });

  if (!transition.ok) {
    return {
      ok: false,
      message: "Book cannot be submitted for review: " + (transition.error ?? "transition rejected"),
    };
  }

  await logReviewEvent({ bookId, action: "submitted", toStatus: "Under Review" });

  // Mint a reviewer link bound to the EXACT version being reviewed.
  const { createReviewToken } = await import("@/lib/review-tokens");
  let link = appUrl() + "/admin/books";
  try {
    const token = await createReviewToken(bookId, currentVersionId);
    link = appUrl() + "/review/" + token;
  } catch (err) {
    console.error("[review] could not mint review token:", err);
  }

  const to = reviewerInbox();
  const name =
    (book.recipient_name as string | null) ||
    (book.child_name as string | null) ||
    "a child";
  const html =
    "<p>A new Starmee story is ready for review.</p>" +
    "<p><strong>Order:</strong> " +
    ((book.public_ref as string | null) || bookId).slice(0, 12) +
    "<br/>" +
    "<strong>For:</strong> " + name + "<br/>" +
    "<strong>Theme:</strong> " + ((book.theme_title as string | null) || "-") + "<br/>" +
    "<strong>Animal:</strong> " + ((book.selected_animal as string | null) || "-") + "</p>" +
    '<p><a href="' + link + '">Open the review screen</a></p>' +
    "<p>This link opens the story for reading only. Nothing is approved until you " +
    "choose Approve, Request changes, or Reject on that page. It expires in 7 days.</p>" +
    "<p>The customer receives nothing until you approve it.</p>";

  const result = await sendEmail({
    to,
    subject: "Starmee: a story is waiting for review (" + name + ")",
    html,
  });

  return {
    ok: true,
    status: "Under Review",
    message: result.sent
      ? "Submitted for review and reviewer notified."
      : "Submitted for review. Reviewer email NOT sent (" + (result.reason || "unknown") + ").",
  };
}

// ─── Approve ───────────────────────────────────────────────────────────────────

/**
 * Approve a book at the exact version the reviewer evaluated.
 *
 * Preconditions:
 *   - lifecycle_stage is "Under Review" or "Revised"
 *   - the token's version equals the book's review_version_id (exact-version)
 *
 * On success:
 *   1. Transition (Under Review|Revised) -> Approved via RPC (binds
 *      approved_version_id and re-checks version match server-side)
 *   2. Revoke outstanding review tokens
 *   3. Mint a FRESH exact-version opaque preview access grant token
 *   4. Send an idempotent invitation email recorded as a durable delivery
 *      attempt; only advance to Ready for Purchase if it actually sent,
 *      otherwise remain Approved and record an operational failure.
 */
export async function approveBook(params: {
  bookId: string;
  versionId: string | null;
  reviewer: string;
  notes?: string;
}): Promise<WorkflowResult> {
  const { bookId, versionId, reviewer, notes } = params;
  if (!reviewer || !reviewer.trim()) {
    return { ok: false, message: "Please identify yourself before approving." };
  }

  const { data: book, error: fetchErr } = await supabaseAdmin
    .from("books")
    .select(
      "id, lifecycle_stage, review_version_id, current_version_id, approved_version_id, purchaser_email, child_name, recipient_name, public_ref",
    )
    .eq("id", bookId)
    .maybeSingle();

  if (fetchErr || !book) {
    return { ok: false, message: "Order not found." };
  }

  const currentStage = (book.lifecycle_stage ?? null) as LifecycleStage | null;
  const reviewVersionId = (book.review_version_id as string | null) ?? null;
  const currentVersionId = (book.current_version_id as string | null) ?? null;

  // Idempotency: already approved or further along.
  if (
    currentStage === "Ready for Purchase" ||
    currentStage === "Purchased" ||
    currentStage === "Delivered"
  ) {
    return {
      ok: true,
      status: currentStage,
      message: 'Already processed — book is currently "' + currentStage + '".',
    };
  }

  if (
    currentStage !== "Under Review" &&
    currentStage !== "Revised" &&
    currentStage !== "Approved"
  ) {
    return {
      ok: false,
      status: currentStage ?? undefined,
      message:
        'Cannot approve: book is currently "' +
        (currentStage ?? "unknown") +
        '". Expected "Under Review", "Revised", or an Approved invitation retry.',
    };
  }

  // ── Exact-version binding: token version must equal review_version_id ──────
  // "Revised" may be approved directly if the token is for the exact current /
  // review version. We compare against review_version_id first (set by the RPC
  // when the version entered Under Review), falling back to current_version_id.
  const expectedVersionId =
    currentStage === "Approved"
      ? ((book.approved_version_id as string | null) ?? null)
      : reviewVersionId ?? currentVersionId;
  if (!expectedVersionId) {
    return { ok: false, message: "Cannot approve: no reviewed version is bound to this book." };
  }
  if (!versionId) {
    return { ok: false, message: "Cannot approve: this review link is not bound to a version." };
  }
  if (versionId !== expectedVersionId) {
    return {
      ok: false,
      status: currentStage,
      message:
        "Cannot approve: this link is for a different version than the one under review. " +
        "Ask for a fresh review link for the current version.",
    };
  }

  if (currentStage !== "Approved") {
    // ── Transition -> Approved (RPC re-checks version + completeness) ───────
    const transition = await transitionLifecycle({
      bookId,
      expectedStage: currentStage,
      toStage: "Approved",
      versionId: expectedVersionId,
      actor: reviewer.trim(),
      reason: notes || "Approved by reviewer",
      idempotencyKey: "approve-" + bookId + "-" + expectedVersionId,
      metadata: { reviewer: reviewer.trim(), notes: notes || null },
    });

    if (!transition.ok) {
      return {
        ok: false,
        status: currentStage,
        message:
          "Approval failed: " +
          (transition.error ?? transition.message ?? "transition rejected"),
      };
    }

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("books")
      .update({
        reviewed_by: reviewer.trim(),
        reviewed_at: now,
        review_notes: notes || null,
      })
      .eq("id", bookId);

    await logReviewEvent({
      bookId,
      action: "approved",
      reviewer: reviewer.trim(),
      notes: notes || null,
      fromStatus: currentStage,
      toStatus: "Approved",
    });

    // Review tokens are single-purpose; burn all outstanding ones now.
    await revokeReviewTokens(bookId);
  }

  // ── Send the exact CTA invitation with a fresh preview access grant ───────
  const invite = await sendApprovalInvitation({
    bookId,
    versionId: expectedVersionId,
    purchaserEmail: (book.purchaser_email as string | null) || null,
    name:
      (book.recipient_name as string | null) ||
      (book.child_name as string | null) ||
      "your child",
    publicRef: (book.public_ref as string | null) || "",
  });

  if (!invite.sent) {
    // Email failure is operational: stay at Approved, record the failure.
    await recordOperationalError(
      bookId,
      "approval_invitation",
      new Error(invite.reason || "invitation not sent"),
    );
    return {
      ok: true,
      status: "Approved",
      message:
        "Approved. Invitation NOT sent (" +
        (invite.reason || "unknown") +
        ") — the book remains Approved and will not advance to Ready for Purchase until the invitation is delivered.",
    };
  }

  // ── Only now advance Approved -> Ready for Purchase ───────────────────────
  const rfp = await transitionLifecycle({
    bookId,
    expectedStage: "Approved",
    toStage: "Ready for Purchase",
    versionId: expectedVersionId,
    actor: "system",
    reason: "Invitation delivered to customer",
    idempotencyKey: "rfp-" + bookId + "-" + expectedVersionId,
  });

  if (!rfp.ok) {
    await recordOperationalError(
      bookId,
      "ready_for_purchase_transition",
      new Error(rfp.error ?? rfp.message ?? "transition rejected"),
    );
    return {
      ok: true,
      status: "Approved",
      message:
        "Approved and invitation sent, but could not advance to Ready for Purchase: " +
        (rfp.error ?? rfp.message ?? "unknown") +
        ". The book remains Approved.",
    };
  }

  return {
    ok: true,
    status: "Ready for Purchase",
    message: "Approved and ready for purchase. Invitation sent to the customer.",
  };
}

/**
 * Sends the approval CTA invitation idempotently and durably, recording an
 * approval_invitation_attempts row. Mints a fresh exact-version opaque preview
 * access grant token (never the review token).
 *
 * This attempt is tracked in approval_invitation_attempts — deliberately
 * SEPARATE from delivery_attempts: at approval time there is no paid order yet
 * (delivery_attempts.order_id is NOT NULL), and the approval invitation is a
 * pre-purchase notification distinct from final book delivery.
 *
 * Durability + idempotency:
 *   - Every send attempt is recorded (pending -> sent | failed).
 *   - If a row with status='sent' already exists for this book+version, it does
 *     NOT send again and reports success (the DB also enforces a partial unique
 *     index so a confirmed send is recorded at most once).
 *   - A send is only reported as sent when the provider actually confirmed it,
 *     so callers must never advance the lifecycle on a failed/unsent attempt.
 */
async function sendApprovalInvitation(params: {
  bookId: string;
  versionId: string;
  purchaserEmail: string | null;
  name: string;
  publicRef: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const { bookId, versionId, purchaserEmail, name, publicRef } = params;

  const to = purchaserEmail || (await fetchBookEmail(bookId));
  if (!to) {
    return { sent: false, reason: "no purchaser email on file" };
  }

  // Idempotency: a confirmed invitation for this exact version already exists.
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("approval_invitation_attempts")
    .select("id, status")
    .eq("book_id", bookId)
    .eq("version_id", versionId)
    .eq("status", "sent")
    .limit(1)
    .maybeSingle();

  if (existingErr) {
    return { sent: false, reason: "could not read invitation attempts: " + existingErr.message };
  }
  if (existing) {
    return { sent: true };
  }

  const { data: pendingAttempt, error: pendingError } = await supabaseAdmin
    .from("approval_invitation_attempts")
    .select("id")
    .eq("book_id", bookId)
    .eq("version_id", versionId)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();
  if (pendingError) {
    return {
      sent: false,
      reason: "could not read pending invitation attempts: " + pendingError.message,
    };
  }
  if (pendingAttempt) {
    return {
      sent: false,
      reason:
        "a prior invitation attempt is awaiting provider reconciliation; it was not sent again",
    };
  }

  // Next attempt number for this book+version (durable audit / retry counter).
  const { count: priorCount } = await supabaseAdmin
    .from("approval_invitation_attempts")
    .select("id", { count: "exact", head: true })
    .eq("book_id", bookId)
    .eq("version_id", versionId);
  const attemptNumber = (priorCount ?? 0) + 1;

  // Mint a FRESH exact-version opaque preview access grant token.
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const { data: grant, error: grantErr } = await supabaseAdmin
    .from("access_grants")
    .insert({
      book_id: bookId,
      version_id: versionId,
      grantee_email: to,
      token_hash: hashToken(rawToken),
      expires_at: expiresAt.toISOString(),
      access_kind: "preview",
      metadata: { purpose: "approval_invitation" },
    })
    .select("id")
    .maybeSingle();

  if (grantErr) {
    return { sent: false, reason: "could not create access grant: " + grantErr.message };
  }

  const attemptKey = `approval-invitation:${bookId}:${versionId}:${attemptNumber}`;
  const { data: attempt, error: beginAttemptError } = await supabaseAdmin
    .from("approval_invitation_attempts")
    .insert({
      book_id: bookId,
      version_id: versionId,
      access_grant_id: (grant?.id as string | null) ?? null,
      recipient_email: to,
      attempt_number: attemptNumber,
      idempotency_key: attemptKey,
      status: "pending",
      metadata: { purpose: "approval_invitation", awaiting_provider_result: true },
    })
    .select("id")
    .single();
  if (beginAttemptError || !attempt) {
    if (grant?.id) {
      await supabaseAdmin
        .from("access_grants")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", grant.id);
    }
    return {
      sent: false,
      reason:
        "could not begin invitation attempt: " +
        (beginAttemptError?.message ?? "no row"),
    };
  }

  const previewUrl = appUrl() + "/preview/" + bookId + "?token=" + rawToken;
  const html =
    "<p>Great news — " + name + "'s Starmee story has been reviewed and approved.</p>" +
    '<p><a href="' + previewUrl +
    '" style="font-size:16px;font-weight:bold;padding:12px 24px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:8px;display:inline-block">' +
    "Preview and Complete Your Purchase</a></p>" +
    "<p>This link gives you access to the exact version our team reviewed and approved.</p>" +
    "<p>Order reference: " + publicRef.slice(0, 12) + "</p>";

  const result = await sendEmail({
    to,
    subject: name + "'s storybook preview is ready",
    html,
  });

  const nowTs = new Date().toISOString();
  const { error: attemptErr, count: attemptCount } = await supabaseAdmin
    .from("approval_invitation_attempts")
    .update(
      {
      status: result.sent ? "sent" : "failed",
      error_detail: result.sent ? null : (result.reason ?? "unknown"),
      notification_sent_at: result.sent ? nowTs : null,
      provider_message_id:
        result.providerMessageId ?? result.provider ?? null,
      metadata: {
        purpose: "approval_invitation",
        awaiting_provider_result: false,
      },
      },
      { count: "exact" },
    )
    .eq("id", attempt.id)
    .eq("status", "pending");

  // A failed durable record for a *successful* send is dangerous: we would then
  // have no confirmed 'sent' row and the lifecycle could re-send. Treat it as a
  // send failure so the book stays Approved and the attempt is retried, rather
  // than advancing to Ready for Purchase without a durable record.
  if (attemptErr || (attemptCount ?? 0) !== 1) {
    return {
      sent: false,
      reason:
        "could not record invitation result: " +
        (attemptErr?.message ?? "attempt was no longer pending"),
    };
  }

  if (!result.sent) {
    if (grant?.id) {
      await supabaseAdmin
        .from("access_grants")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", grant.id);
    }
    return { sent: false, reason: result.reason ?? "email send failed" };
  }
  return { sent: true };
}

// ─── Request changes / Reject ──────────────────────────────────────────────────

export interface ReviewItemInput {
  pageNumber: number | null;
  scope: "text" | "illustration" | "both";
  description: string;
  beforeValue?: string | null;
  afterValue?: string | null;
  severity?: "minor" | "major" | "blocker";
}

/**
 * Request changes or reject. Creates EXACTLY ONE structured revision request
 * (with page items) and performs a single transition to "Changes Requested"
 * via the revision engine. The route that records the reviewer decision then
 * invokes the bounded targeted revision runner.
 *
 * @param decision "request_changes" (soft) or "reject" (hard).
 */
export async function requestBookChanges(params: {
  bookId: string;
  versionId: string | null;
  reviewer: string;
  feedback: string;
  affectedPages: number[];
  scope: "text" | "illustration" | "both";
  decision: "request_changes" | "reject";
}): Promise<WorkflowResult & { requestId?: string | null }> {
  const { bookId, versionId, reviewer, feedback, affectedPages, scope, decision } = params;

  if (!reviewer || !reviewer.trim()) {
    return { ok: false, message: "Please identify yourself before submitting changes." };
  }
  if (!feedback || !feedback.trim()) {
    return { ok: false, message: "Please describe what needs to change." };
  }
  if (!affectedPages || affectedPages.length === 0) {
    return { ok: false, message: "Please select at least one affected page." };
  }
  if (scope !== "text" && scope !== "illustration" && scope !== "both") {
    return { ok: false, message: "Please choose text, illustration, or both." };
  }

  const items: ReviewItemInput[] = affectedPages.map((pageNumber) => ({
    pageNumber,
    scope,
    description: feedback.trim(),
    severity: "major",
  }));

  const { createRevisionRequest } = await import("@/services/revision-engine");
  const result = await createRevisionRequest({
    bookId,
    versionId,
    requestedBy: reviewer.trim(),
    decision,
    feedback: feedback.trim(),
    items,
  });

  if (!result.ok) {
    return {
      ok: false,
      message: "Failed to record the request: " + (result.error ?? "unknown"),
      requestId: null,
    };
  }

  await revokeReviewTokens(bookId);

  return {
    ok: true,
    status: "Changes Requested",
    requestId: result.requestId,
    message:
      decision === "reject"
        ? "Rejected. A structured revision request has been recorded and the story will be revised."
        : "Changes requested. A structured revision request has been recorded and the story will be revised.",
  };
}

/**
 * @deprecated Use requestBookChanges. Retained for backward compatibility with
 * older callers that only pass a free-text reason. Records a single whole-book
 * item under a "reject" decision.
 */
export async function rejectBook(params: {
  bookId: string;
  reviewer: string;
  reason: string;
}): Promise<WorkflowResult> {
  const { bookId, reviewer, reason } = params;
  if (!reason || !reason.trim()) {
    return { ok: false, message: "Please give a reason so the retry can fix it." };
  }

  const { data: book } = await supabaseAdmin
    .from("books")
    .select("review_version_id, current_version_id")
    .eq("id", bookId)
    .maybeSingle();

  const versionId =
    (book?.review_version_id as string | null) ||
    (book?.current_version_id as string | null) ||
    null;

  const { createRevisionRequest } = await import("@/services/revision-engine");
  const result = await createRevisionRequest({
    bookId,
    versionId,
    requestedBy: reviewer.trim(),
    decision: "reject",
    feedback: reason.trim(),
    items: [{ pageNumber: null, scope: "both", description: reason.trim(), severity: "major" }],
  });

  await revokeReviewTokens(bookId);

  if (!result.ok) {
    return { ok: false, message: "Failed to create revision request: " + (result.error ?? "unknown") };
  }

  return {
    ok: true,
    status: "Changes Requested",
    message: "Rejected. The story will be revised and returned for review.",
  };
}

// ─── Status query ──────────────────────────────────────────────────────────────

export async function getBookStatus(bookId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("books")
    .select("status, lifecycle_stage")
    .eq("id", bookId)
    .maybeSingle();
  return (
    (data?.lifecycle_stage as string | null) ||
    (data?.status as string | null) ||
    "unknown"
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function fetchBookEmail(bookId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("email_captures")
    .select("email")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.email ?? null;
}

/**
 * Selects up to two preview pages from an immutable version snapshot WITHOUT
 * mutating any page row. Returns the chosen page numbers. Exposed so callers
 * that build customer-facing previews can honour the "at most two pages" rule
 * against the exact reviewed version.
 */
export async function selectApprovedPreviewPages(versionId: string): Promise<number[]> {
  const pages = await fetchVersionPages(versionId);
  const chosen = selectPreviewPages(
    pages.map((p) => ({ pageNumber: p.pageNumber, isPreview: p.isPreview })),
  );
  return chosen.map((p) => p.pageNumber);
}
