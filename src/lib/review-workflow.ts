/**
 * The Starmee human-approval workflow.
 *
 * Rules this file enforces:
 *   - nothing reaches a customer without a human approving it
 *   - approve/reject are conditional on the CURRENT status, so a repeated
 *     click or a second reviewer cannot double-process an order
 *   - every transition is appended to book_review_events and the book row is
 *     never deleted
 *   - delivery is only marked once the send actually succeeded
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, isEmailConfigured } from "@/lib/email-provider";
import { createReviewToken, revokeReviewTokens } from "@/lib/review-tokens";

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

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL || "https://app.starmeestories.com"
  ).replace(/\/$/, "");
}

function reviewerInbox(): string {
  return process.env.REVIEW_EMAIL || process.env.ADMIN_EMAIL || "";
}

/** Append an immutable audit row. Never throws into the caller's path. */
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

/**
 * Move a freshly generated book into the review queue and notify the reviewer.
 * Safe to call twice: the status update is conditional.
 */
export async function submitForReview(bookId: string): Promise<WorkflowResult> {
  const { data: rows, error } = await supabaseAdmin
    .from("books")
    .update({ status: "pending_review", updated_at: new Date().toISOString() })
    .eq("id", bookId)
    .in("status", ["preview_ready", "generating", "complete", "needs_regeneration", "draft"])
    .select("id, child_name, recipient_name, theme_title, selected_animal, public_ref");

  if (error) return { ok: false, message: "Could not submit for review: " + error.message };
  if (!rows || rows.length === 0) {
    return { ok: false, message: "Book is not in a state that can be submitted for review." };
  }

  const book = rows[0];
  await logReviewEvent({ bookId, action: "submitted", toStatus: "pending_review" });

  // A fresh, expiring, single-use link per submission.
  let link = appUrl() + "/admin/books";
  try {
    const token = await createReviewToken(bookId);
    link = appUrl() + "/review/" + token;
  } catch (err) {
    console.error("[review] could not mint review token:", err);
  }

  const to = reviewerInbox();
  const name = book.recipient_name || book.child_name || "a child";
  const html =
    "<p>A new Starmee story is ready for review.</p>" +
    "<p><strong>Order:</strong> " + (book.public_ref || bookId).slice(0, 12) + "<br/>" +
    "<strong>For:</strong> " + name + "<br/>" +
    "<strong>Theme:</strong> " + (book.theme_title || "-") + "<br/>" +
    "<strong>Animal:</strong> " + (book.selected_animal || "-") + "</p>" +
    "<p><a href=\"" + link + "\">Open the review screen</a></p>" +
    "<p>This link opens the story for reading only. Nothing is approved until you " +
    "choose Approve or Reject on that page. It expires in 7 days.</p>" +
    "<p>The customer receives nothing until you approve it.</p>";

  const result = await sendEmail({
    to,
    subject: "Starmee: a story is waiting for review (" + name + ")",
    html,
  });

  return {
    ok: true,
    status: "pending_review",
    message: result.sent
      ? "Submitted for review and reviewer notified."
      : "Submitted for review. Reviewer email NOT sent (" + (result.reason || "unknown") + ").",
  };
}

/**
 * Approve a book. Conditional on status = pending_review, so a second click
 * or a second reviewer gets "already processed" rather than approving twice.
 */
export async function approveBook(params: {
  bookId: string;
  reviewer: string;
  notes?: string;
}): Promise<WorkflowResult> {
  const { bookId, reviewer, notes } = params;
  if (!reviewer || !reviewer.trim()) {
    return { ok: false, message: "Please identify yourself before approving." };
  }

  const now = new Date().toISOString();
  const { data: rows, error } = await supabaseAdmin
    .from("books")
    .update({
      status: "approved",
      reviewed_by: reviewer.trim(),
      reviewed_at: now,
      review_notes: notes || null,
      updated_at: now,
    })
    .eq("id", bookId)
    .eq("status", "pending_review")
    .select("id");

  if (error) return { ok: false, message: "Approval failed: " + error.message };
  if (!rows || rows.length === 0) {
    const current = await getBookStatus(bookId);
    return {
      ok: false,
      status: current,
      message: "Already processed. This order is currently \"" + current + "\".",
    };
  }

  await logReviewEvent({
    bookId,
    action: "approved",
    reviewer: reviewer.trim(),
    notes: notes || null,
    fromStatus: "pending_review",
    toStatus: "approved",
  });
  await revokeReviewTokens(bookId);

  return await deliverBook(bookId);
}

/**
 * Reject a book and route it back for regeneration. The rejected version stays
 * in the audit trail and is never sent to the customer.
 */
export async function rejectBook(params: {
  bookId: string;
  reviewer: string;
  reason: string;
}): Promise<WorkflowResult> {
  const { bookId, reviewer, reason } = params;
  if (!reviewer || !reviewer.trim()) {
    return { ok: false, message: "Please identify yourself before rejecting." };
  }
  if (!reason || !reason.trim()) {
    return { ok: false, message: "Please give a reason so the retry can fix it." };
  }

  const now = new Date().toISOString();
  const { data: rows, error } = await supabaseAdmin
    .from("books")
    .update({
      status: "needs_regeneration",
      reviewed_by: reviewer.trim(),
      reviewed_at: now,
      rejection_reason: reason.trim(),
      updated_at: now,
    })
    .eq("id", bookId)
    .eq("status", "pending_review")
    .select("id");

  if (error) return { ok: false, message: "Rejection failed: " + error.message };
  if (!rows || rows.length === 0) {
    const current = await getBookStatus(bookId);
    return {
      ok: false,
      status: current,
      message: "Already processed. This order is currently \"" + current + "\".",
    };
  }

  await logReviewEvent({
    bookId,
    action: "rejected",
    reviewer: reviewer.trim(),
    notes: reason.trim(),
    fromStatus: "pending_review",
    toStatus: "needs_regeneration",
  });
  await revokeReviewTokens(bookId);

  return {
    ok: true,
    status: "needs_regeneration",
    message: "Rejected. The story will be regenerated using your feedback and come back for review.",
  };
}

export async function getBookStatus(bookId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("books")
    .select("status")
    .eq("id", bookId)
    .maybeSingle();
  return data?.status || "unknown";
}

/**
 * Deliver an approved book to the customer.
 *
 * Only ever runs from status = approved, and only marks delivered AFTER the
 * send actually succeeded. If email is not configured the order deliberately
 * stays at "approved" so nothing is silently lost.
 */
export async function deliverBook(bookId: string): Promise<WorkflowResult> {
  const { data: book, error } = await supabaseAdmin
    .from("books")
    .select("id, status, purchaser_email, child_name, recipient_name, public_ref, delivered_at")
    .eq("id", bookId)
    .maybeSingle();

  if (error || !book) return { ok: false, message: "Order not found." };

  if (book.status === "delivered" || book.delivered_at) {
    return { ok: true, status: "delivered", message: "Already delivered - not sending again." };
  }
  if (book.status !== "approved") {
    return {
      ok: false,
      status: book.status,
      message: "Only an approved story can be delivered (currently \"" + book.status + "\").",
    };
  }

  const to = book.purchaser_email;
  if (!to) {
    return {
      ok: false,
      status: "approved",
      message: "Approved, but no purchaser email is on file - cannot deliver.",
    };
  }

  const name = book.recipient_name || book.child_name || "your child";
  const link = appUrl() + "/preview/" + bookId;
  const html =
    "<p>Good news - " + name + "'s Starmee story has been checked by our team and is ready.</p>" +
    "<p><a href=\"" + link + "\">Read the story</a></p>" +
    "<p>Order reference: " + (book.public_ref || "").slice(0, 12) + "</p>" +
    "<p>Thank you for choosing Starmee.</p>";

  const result = await sendEmail({
    to,
    subject: name + "'s Starmee story is ready",
    html,
  });

  if (!result.sent) {
    // Stay at "approved" so a human can retry. Never claim delivery.
    return {
      ok: false,
      status: "approved",
      message: isEmailConfigured()
        ? "Approved, but delivery failed: " + (result.reason || "unknown") + ". Order left as approved."
        : "Approved. Delivery is pending because no email provider is configured (set SENDGRID_API_KEY).",
    };
  }

  const now = new Date().toISOString();
  const { data: rows } = await supabaseAdmin
    .from("books")
    .update({ status: "delivered", delivered_at: now, updated_at: now })
    .eq("id", bookId)
    .eq("status", "approved")
    .select("id");

  if (!rows || rows.length === 0) {
    return { ok: true, status: "delivered", message: "Delivered (already marked by another action)." };
  }

  await logReviewEvent({
    bookId,
    action: "delivered",
    fromStatus: "approved",
    toStatus: "delivered",
  });

  return { ok: true, status: "delivered", message: "Approved and delivered to the customer." };
}
