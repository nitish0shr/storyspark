import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  decideCheckoutProcessing,
  extractSessionMetadata,
  verifySessionPayment,
  verifyExactIdentity,
  shouldSendPurchaseConfirmation,
} from "@/lib/webhook-idempotency";
import { isResendConfigured, resend, RESEND_FROM_EMAIL } from "@/lib/resend";
import { getAppUrl } from "@/lib/utils";
import { getNextThemeForSubscriber } from "@/services/theme-rotation";
import { sendPurchaseConfirmationEmail } from "@/lib/email-notifications";
import { shouldApplyCheckoutExpiry } from "@/lib/checkout-recovery";

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 }
    );
  }

  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  // Atomically claim the event before any side effects. Concurrent deliveries
  // receive 503 while the active claim is live; abandoned claims can be taken
  // over after the bounded lease expires.
  const claimToken = randomUUID();
  let claim: "claimed" | "completed" | "in_progress";
  try {
    claim = await claimWebhookEvent(event, claimToken);
  } catch (claimError) {
    console.error("[stripe] Could not claim webhook event:", claimError);
    return NextResponse.json(
      { error: "Transient error claiming event; retry later." },
      { status: 503 }
    );
  }
  if (claim === "completed") {
    return NextResponse.json({ received: true, idempotent: true });
  }
  if (claim === "in_progress") {
    return NextResponse.json(
      { error: "Event is already being processed; retry later." },
      { status: 503 },
    );
  }

  // ---------------------------------------------------------------------------
  // Process the event. Handlers may return context (order_id / book_id) used
  // when recording the event row.
  // ---------------------------------------------------------------------------

  let processingError: unknown = null;
  let handlerContext: HandlerContext = {};

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        handlerContext = await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }

      case "checkout.session.expired": {
        await handleCheckoutExpired(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      case "invoice.payment_succeeded": {
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      }

      case "invoice.payment_failed": {
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    processingError = err;
  }

  // ---------------------------------------------------------------------------
  // On a transient failure: do NOT seal the event. Return 503 so Stripe retries
  // and the idempotent handler runs again.
  // ---------------------------------------------------------------------------

  if (processingError && isRetryableError(processingError)) {
    const message =
      processingError instanceof Error
        ? processingError.message
        : String(processingError);
    console.error(
      `[stripe] Transient error processing ${event.type} (will retry):`,
      processingError
    );
    await releaseWebhookClaim(event.id, claimToken);
    return NextResponse.json(
      { error: "Transient processing failure — retry", detail: message },
      { status: 503 }
    );
  }

  // ---------------------------------------------------------------------------
  // Seal the event: record success or permanent failure so future re-deliveries
  // are short-circuited. A failure to write this row is itself transient — ask
  // Stripe to retry rather than risk re-running side effects silently.
  // ---------------------------------------------------------------------------

  const errMsg =
    processingError instanceof Error
      ? processingError.message
      : processingError != null
        ? String(processingError)
        : null;

  const { error: sealErr, count: sealCount } = await supabaseAdmin
    .from("stripe_webhook_events")
    .update(
      {
      status: processingError ? "permanent_error" : "processed",
      outcome: processingError ? "error" : "processed",
      error_detail: errMsg,
      order_id: handlerContext.orderId ?? null,
      book_id: handlerContext.bookId ?? null,
      processed_at: new Date().toISOString(),
      claim_expires_at: null,
    },
    { count: "exact" },
    )
    .eq("stripe_event_id", event.id)
    .eq("claim_token", claimToken)
    .eq("status", "processing");

  if (sealErr || (sealCount ?? 0) !== 1) {
    console.error("[stripe] Failed to seal webhook event:", sealErr);
    return NextResponse.json(
      { error: "Failed to record event; retry later." },
      { status: 503 }
    );
  }

  if (processingError) {
    // Permanent / non-retryable failure — return 200 so Stripe stops retrying
    // (the event is now sealed with outcome=error for observability).
    console.error(
      `[stripe] Non-retryable error processing ${event.type}:`,
      processingError
    );
    return NextResponse.json(
      { error: "Non-retryable processing failure", detail: errMsg },
      { status: 200 }
    );
  }

  return NextResponse.json({ received: true });
}

async function claimWebhookEvent(
  event: Stripe.Event,
  claimToken: string,
): Promise<"claimed" | "completed" | "in_progress"> {
  const claimExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { error: insertError } = await supabaseAdmin
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      status: "processing",
      claim_token: claimToken,
      claim_expires_at: claimExpiresAt,
      received_at: new Date().toISOString(),
    });
  if (!insertError) return "claimed";
  if (insertError.code !== "23505") {
    throw new Error(insertError.message);
  }

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("stripe_webhook_events")
    .select("status, claim_token, claim_expires_at")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (lookupError || !existing) {
    throw new Error(lookupError?.message ?? "Webhook claim disappeared");
  }
  if (existing.status === "processed" || existing.status === "permanent_error") {
    return "completed";
  }

  const expired =
    !existing.claim_expires_at ||
    new Date(existing.claim_expires_at as string).getTime() <= Date.now();
  if (!expired) return "in_progress";

  let reclaim = supabaseAdmin
    .from("stripe_webhook_events")
    .update(
      {
        claim_token: claimToken,
        claim_expires_at: claimExpiresAt,
        received_at: new Date().toISOString(),
      },
      { count: "exact" },
    )
    .eq("stripe_event_id", event.id)
    .eq("status", "processing");
  reclaim = existing.claim_token
    ? reclaim.eq("claim_token", existing.claim_token)
    : reclaim.is("claim_token", null);
  const { error: reclaimError, count } = await reclaim;
  if (reclaimError) throw new Error(reclaimError.message);
  return (count ?? 0) === 1 ? "claimed" : "in_progress";
}

async function releaseWebhookClaim(
  stripeEventId: string,
  claimToken: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("stripe_webhook_events")
    .delete()
    .eq("stripe_event_id", stripeEventId)
    .eq("claim_token", claimToken)
    .eq("status", "processing");
  if (error) {
    console.error("[stripe] Failed to release retryable webhook claim:", error);
  }
}

// ---------------------------------------------------------------------------
// Handler context returned by event handlers for event-row bookkeeping.
// ---------------------------------------------------------------------------

interface HandlerContext {
  orderId?: string | null;
  bookId?: string | null;
}

// ---------------------------------------------------------------------------
// Error classifier
// ---------------------------------------------------------------------------

/**
 * Returns true for transient / infrastructure errors where Stripe should retry.
 * Returns false for permanent data / logic errors where retrying is useless.
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  if (msg.includes("econnrefused") || msg.includes("enotfound")) return true;
  if (msg.includes("timeout") || msg.includes("timed out")) return true;
  if (msg.includes("rate limit") || msg.includes("too many requests")) return true;
  if (msg.includes("503") || msg.includes("502") || msg.includes("504")) return true;
  if (msg.includes("connection") && msg.includes("refused")) return true;
  // Explicit marker used by handlers to flag DB / RPC-transport / finalisation
  // failures that should cause Stripe to retry (see [transient] tags below).
  if (msg.includes("[transient]")) return true;
  return false;
}

// ---------------------------------------------------------------------------
// checkout.session.completed
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<HandlerContext> {
  // ── Step 0: extract and validate metadata ─────────────────────────────────

  const meta = extractSessionMetadata(session.metadata);
  const { bookId, userId, versionId, isGift, giftRecipientEmail, giftRecipientName } =
    meta;

  if (!bookId || !versionId) {
    console.error(
      "[stripe] Missing book_id or version_id in session metadata for session",
      session.id
    );
    // Non-retryable — bad data from checkout creation.
    return {};
  }

  // ── Step 1: verify payment_status === "paid" ───────────────────────────────

  const basePaymentCheck = verifySessionPayment({ session });
  if (!basePaymentCheck.verified) {
    console.error(
      "[stripe] Payment status check failed for session",
      session.id,
      ":",
      basePaymentCheck.reason
    );
    return { bookId }; // non-retryable
  }

  // ── Step 2: load the order (includes version_id, amount_cents, currency) ──

  let orderQuery = supabaseAdmin
    .from("orders")
    .select(
      "id, status, user_id, purchaser_email, book_id, version_id, amount_cents, currency, purchase_confirmation_sent_at, fulfilled_at"
    );
  orderQuery = meta.orderId
    ? orderQuery.eq("id", meta.orderId)
    : orderQuery.eq("stripe_checkout_session_id", session.id);
  const { data: order, error: orderFetchErr } = await orderQuery.maybeSingle();

  if (orderFetchErr) {
    // Retryable — could be a transient DB error.
    throw new Error(
      "[transient] Failed to query orders for session " +
        session.id +
        ": " +
        orderFetchErr.message
    );
  }

  // ── Step 3: replay guard using order status ────────────────────────────────

  const decision = decideCheckoutProcessing({ sessionId: session.id, order });
  if (!decision.process && decision.reason === "no_order") {
    throw new Error(
      "[transient] Paid checkout has no durable order reservation yet: " +
        decision.detail,
    );
  }
  if (!decision.process) {
    console.warn(
      "[stripe] Re-entering an already-paid order to finish idempotent notifications/finalisation:",
      decision.detail,
    );
  }

  // ── Step 4: verify session amount / currency match the order record ────────

  const amountCheck = verifySessionPayment({
    session,
    expectedAmountCents: order?.amount_cents ?? undefined,
    expectedCurrency: order?.currency ?? undefined,
  });
  if (!amountCheck.verified) {
    console.error(
      "[stripe] Amount/currency mismatch for session",
      session.id,
      ":",
      amountCheck.reason
    );
    return { orderId: order?.id ?? null, bookId }; // non-retryable — wrong payment details
  }

  // ── Step 5: load book and verify exact identity + lifecycle stage ──────────

  const { data: book, error: bookFetchErr } = await supabaseAdmin
    .from("books")
    .select(
      "id, child_name, theme_title, status, pdf_url, user_id, lifecycle_stage, approved_version_id"
    )
    .eq("id", bookId)
    .maybeSingle();

  if (bookFetchErr) {
    throw new Error(
      "[transient] Failed to query books for book_id " +
        bookId +
        ": " +
        bookFetchErr.message
    );
  }

  const identityCheck = verifyExactIdentity({ sessionMeta: meta, order, book });
  if (!identityCheck.verified) {
    console.error(
      "[stripe] Identity / lifecycle check failed for session",
      session.id,
      ":",
      identityCheck.reason
    );
    return { orderId: order?.id ?? null, bookId }; // non-retryable — data mismatch
  }

  // ── Step 6: atomically record payment and transition the exact version ────

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

  const effectiveVersionId = versionId ?? order?.version_id ?? null;
  if (!paymentIntentId || !effectiveVersionId || !order) {
    throw new Error(
      "Verified checkout is missing its order, payment intent, or exact version.",
    );
  }

  const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc(
    "record_verified_payment_and_purchase",
    {
      p_order_id: order.id,
      p_checkout_session_id: session.id,
      p_payment_intent_id: paymentIntentId,
      p_amount_cents: order.amount_cents,
      p_currency: order.currency,
      p_book_id: bookId,
      p_version_id: effectiveVersionId,
      p_actor: "stripe-webhook",
      p_idempotency_key: `checkout-${session.id}`,
      p_metadata: {
        session_id: session.id,
        payment_intent_id: paymentIntentId,
      },
    }
  );

  if (rpcErr) {
    throw new Error(
      "[transient] atomic payment RPC failed for book " +
        bookId +
        ": " +
        rpcErr.message
    );
  }

  const result = (rpcData ?? {}) as {
    ok?: boolean;
    idempotent_replay?: boolean;
    error?: string;
    current_stage?: string;
  };

  if (!result.ok) {
    throw new Error(
      "Atomic verified payment/Purchased transition rejected for book " +
        bookId +
        ": " +
        (result.error ?? "unknown"),
    );
  } else if (result.idempotent_replay) {
    console.warn(
      "[stripe] transition_book_lifecycle idempotent replay for book",
      bookId,
      "— continuing."
    );
  } else {
    console.log(
      "[stripe] Book",
      bookId,
      "transitioned Ready for Purchase → Purchased for session",
      session.id
    );
  }

  // ── Step 8: fetch buyer info for emails ────────────────────────────────────

  const { data: profile } = userId
    ? await supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };

  const buyerEmail =
    session.customer_details?.email ||
    session.customer_email ||
    profile?.email ||
    order.purchaser_email;
  const buyerName = session.customer_details?.name || profile?.full_name || "there";
  const childName = book?.child_name || "your child";
  const appUrl = getAppUrl();

  // ── Step 9: idempotent purchase confirmation email ─────────────────────────
  //   Only send when: email known + not already sent + provider is configured.
  //   Only record sent_at when the provider actually delivered the email.

  const { data: freshOrder } = await supabaseAdmin
    .from("orders")
    .select("purchase_confirmation_sent_at, purchase_confirmation_status")
    .eq("id", order.id)
    .maybeSingle();

  if (buyerEmail && shouldSendPurchaseConfirmation(freshOrder)) {
    const { count: confirmationClaimCount, error: confirmationClaimError } =
      await supabaseAdmin
        .from("orders")
        .update(
          {
            purchase_confirmation_status: "pending",
            purchase_confirmation_error: null,
          },
          { count: "exact" },
        )
        .eq("id", order.id)
        .is("purchase_confirmation_sent_at", null)
        .or(
          "purchase_confirmation_status.is.null,purchase_confirmation_status.eq.failed",
        );
    if (confirmationClaimError) {
      throw new Error(
        "[transient] Could not claim purchase confirmation: " +
          confirmationClaimError.message,
      );
    }
    if ((confirmationClaimCount ?? 0) !== 1) {
      throw new Error(
        "[transient] Purchase confirmation is awaiting provider reconciliation",
      );
    }

    let providerAccepted = false;
    try {
      const sendResult = await sendPurchaseConfirmationEmail({
        email: buyerEmail,
        buyerName,
        childName,
        bookId,
        dashboardUrl: `${appUrl}/dashboard`,
      });
      providerAccepted = sendResult.sent;

      if (!sendResult.sent) {
        throw new Error(
          "Purchase confirmation not sent: " +
            (sendResult.reason ?? "provider returned not_sent"),
        );
      }

      const { error: confErr, count: confCount } = await supabaseAdmin
        .from("orders")
        .update(
          {
            email_delivered: true,
            purchase_confirmation_sent_at: new Date().toISOString(),
            purchase_confirmation_status: "sent",
            purchase_confirmation_error: null,
            purchase_confirmation_provider_message_id:
              sendResult.providerMessageId ?? sendResult.provider ?? null,
          },
          { count: "exact" },
        )
        .eq("id", order.id)
        .eq("purchase_confirmation_status", "pending");
      if (confErr || (confCount ?? 0) !== 1) {
        throw new Error(
          "Could not durably record purchase confirmation: " +
            (confErr?.message ?? "claim was no longer pending"),
        );
      }
    } catch (emailErr) {
      // If the provider did not accept the message, this is safe to retry. If
      // it did accept it, retain pending so an operator reconciles the
      // ambiguous acknowledgement before any resend.
      if (!providerAccepted) {
        await supabaseAdmin
          .from("orders")
          .update({
            purchase_confirmation_status: "failed",
            purchase_confirmation_error:
              emailErr instanceof Error ? emailErr.message : String(emailErr),
          })
          .eq("id", order.id)
          .eq("purchase_confirmation_status", "pending");
      }
      throw new Error(
        "[transient] " +
          (emailErr instanceof Error ? emailErr.message : String(emailErr)),
      );
    }
  }

  const orderId = order?.id ?? null;

  // ── Step 10: gift notification (best-effort, before finalisation) ──────────
  //   Sent here so a later transient finalisation failure (which re-runs the
  //   whole idempotent handler on Stripe retry) does not repeatedly re-trigger
  //   the gift email — the gift email is guarded only by best-effort logging,
  //   so we keep it ahead of the throwing finalisation call. (The book is
  //   already Purchased at this point.)

  if (isGift && giftRecipientEmail && isResendConfigured()) {
    try {
      const { data: orderWithGift } = await supabaseAdmin
        .from("orders")
        .select("gift_message")
        .eq("stripe_checkout_session_id", session.id)
        .single();

      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: giftRecipientEmail,
        subject: `You've received a Starmee storybook!`,
        html: buildGiftNotificationEmail({
          recipientName: giftRecipientName || "Friend",
          senderName: buyerName,
          childName,
          giftMessage: orderWithGift?.gift_message || null,
          bookUrl: `${appUrl}/gift/${bookId}`,
          appUrl,
        }),
      });
    } catch (emailErr) {
      console.error("[stripe] Failed to send gift notification email:", emailErr);
    }
  }

  // ── Step 11: finalisation — AWAITED, idempotent, let transient failures throw
  //   We deliberately do NOT fire-and-forget. finalisePurchasedBook is
  //   idempotent (it no-ops when the order is already fulfilled), so awaiting it
  //   inline means:
  //     - A transient failure propagates out of the handler; the outer POST
  //       returns 503 and does NOT seal the event, so Stripe retries and the
  //       whole idempotent flow re-runs until finalisation succeeds.
  //     - A success completes the delivery pipeline before we seal the event.
  //   The book is already Purchased and the order already marked paid, so a
  //   retry re-enters via the "already advanced / already Purchased" branches
  //   above and reaches this call again without duplicating side effects.

  const { finalisePurchasedBook } = await import("@/services/book-pipeline");
  try {
    await finalisePurchasedBook(bookId, effectiveVersionId, orderId);
  } catch (finaliseErr) {
    // Finalisation is idempotent, so treat any failure here as transient: tag
    // it so the outer handler returns 503 and Stripe retries the (idempotent)
    // flow until finalisation succeeds. We never seal the event on this path.
    const detail =
      finaliseErr instanceof Error ? finaliseErr.message : String(finaliseErr);
    throw new Error(
      "[transient] finalisePurchasedBook failed for book " +
        bookId +
        ": " +
        detail
    );
  }

  return { orderId, bookId };
}

// ---------------------------------------------------------------------------
// checkout.session.expired
// ---------------------------------------------------------------------------

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("status, payment_verified_at")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();
  if (
    !order ||
    !shouldApplyCheckoutExpiry({
      orderStatus: order.status,
      paymentVerifiedAt: order.payment_verified_at,
    })
  ) {
    return;
  }
  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      status: "failed",
      checkout_idempotency_key: null,
      checkout_reservation_expires_at: null,
    })
    .eq("stripe_checkout_session_id", session.id)
    .eq("status", "pending")
    .is("payment_verified_at", null);

  if (error) {
    console.error("Failed to update order to failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Gift email template
// ---------------------------------------------------------------------------

function buildGiftNotificationEmail(data: {
  recipientName: string;
  senderName: string;
  childName: string;
  giftMessage: string | null;
  bookUrl: string;
  appUrl: string;
}): string {
  const giftMessageBlock = data.giftMessage
    ? `<div style="background:#f8f0ff;border-left:4px solid #7C3AED;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p style="margin:0;color:#4a4a5a;font-size:14px;font-style:italic;line-height:1.6;">"${data.giftMessage}"</p>
        <p style="margin:8px 0 0;color:#7C3AED;font-size:13px;font-weight:600;">— ${data.senderName}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFFBF5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:linear-gradient(135deg,#7C3AED,#EC4899);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Starmee Stories</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">You've received a magical gift!</p>
    </div>
    <div style="background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #f0e6d6;border-top:none;">
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Hi ${data.recipientName}!</h2>
      <p style="margin:0 0 16px;color:#4a4a5a;font-size:15px;line-height:1.6;">
        ${data.senderName} has gifted ${data.childName} a personalised storybook from Starmee!
        It's a beautifully illustrated story where ${data.childName} is the hero.
      </p>
      ${giftMessageBlock}
      <div style="text-align:center;margin:24px 0;">
        <a href="${data.bookUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:600;">
          View the Book
        </a>
      </div>
      <p style="margin:24px 0 0;color:#9a9aaa;font-size:13px;text-align:center;">
        Want to create a Starmee book of your own?
        <a href="${data.appUrl}" style="color:#7C3AED;">Get started here</a>.
      </p>
    </div>
    <div style="text-align:center;padding:24px 0;color:#9a9aaa;font-size:12px;">
      <p style="margin:0;">Made with love by Starmee Stories</p>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Subscription event handlers
// ---------------------------------------------------------------------------

function mapStripeSubStatus(status: string): string {
  switch (status) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "paused":
      return "paused";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    case "trialing":
      return "active";
    case "unpaid":
      return "past_due";
    default:
      console.warn(
        `Unknown Stripe subscription status: ${status}, treating as incomplete`
      );
      return "incomplete";
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata ?? {};
  const userId = metadata.user_id;
  const childProfileId = metadata.child_profile_id;

  if (!userId || !childProfileId) {
    console.error(
      "Missing user_id or child_profile_id in subscription metadata"
    );
    return;
  }

  const hasPauseCollection = !!(
    subscription as unknown as Record<string, unknown>
  ).pause_collection;
  const status = hasPauseCollection
    ? "paused"
    : mapStripeSubStatus(subscription.status);
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  const sub = subscription as unknown as Record<string, unknown>;
  const periodStart = sub.current_period_start
    ? new Date((sub.current_period_start as number) * 1000).toISOString()
    : null;
  const periodEnd = sub.current_period_end
    ? new Date((sub.current_period_end as number) * 1000).toISOString()
    : null;

  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status,
        stripe_customer_id: customerId,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      child_profile_id: childProfileId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const inv = invoice as unknown as Record<string, unknown>;
  const rawSub = inv.subscription;
  const subId =
    typeof rawSub === "string"
      ? rawSub
      : (rawSub as Stripe.Subscription | null)?.id ?? null;

  if (!subId) return;

  const isInitialPayment =
    (inv.billing_reason as string) === "subscription_create";

  const invoiceId = invoice.id;
  if (invoiceId) {
    const { data: existingBook } = await supabaseAdmin
      .from("books")
      .select("id")
      .eq("stripe_invoice_id", invoiceId)
      .maybeSingle();

    if (existingBook) {
      console.log(`Book already created for invoice ${invoiceId}, skipping`);
      return;
    }
  }

  let sub: Record<string, unknown> | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", subId)
      .single();
    if (data) {
      sub = data;
      break;
    }
    if (isInitialPayment && attempt < 2) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  if (!sub || (sub.status !== "active" && !isInitialPayment)) return;

  const nextTheme = getNextThemeForSubscriber(
    (sub.used_theme_ids as string[]) || []
  );
  if (!nextTheme) {
    console.warn(`No available themes for subscription ${sub.id}`);
    return;
  }

  const subId_ = sub.id as string;
  const subUserId = sub.user_id as string;
  const subChildId = sub.child_profile_id as string;
  const subUsedThemes = (sub.used_theme_ids as string[]) || [];
  const subBooksGenerated = (sub.books_generated as number) || 0;

  const { data: book, error: bookError } = await supabaseAdmin
    .from("books")
    .insert({
      user_id: subUserId,
      child_profile_id: subChildId,
      theme_id: nextTheme,
      status: "draft",
      language: "en",
      subscription_id: subId_,
      stripe_invoice_id: invoice.id || null,
      contextual_answers: {},
    })
    .select("id")
    .single();

  if (bookError || !book) {
    console.error("Failed to create subscription book:", bookError);
    return;
  }

  await supabaseAdmin
    .from("subscriptions")
    .update({
      used_theme_ids: [...subUsedThemes, nextTheme],
      books_generated: subBooksGenerated + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subId_);

  // Subscription books are NOT canonical purchases: they must never route
  // through the purchase-fulfilment path (finalisePurchasedBook) or the
  // lifecycle RPC. They are freshly-inserted drafts (status='draft', no
  // lifecycle_stage), so they run the legacy preview→full generation pipeline
  // directly. We import ONLY the legacy generation entrypoints and guard
  // against ever invoking full generation on a Purchased book.
  const { generatePreview: genPreview, generateFullBook: genFull } =
    await import("@/services/book-pipeline");

  genPreview(book.id)
    .then(async () => {
      // Defensive guard: never run full generation on a Purchased book from
      // the subscription path (that is reserved for the checkout webhook).
      const { data: freshBook } = await supabaseAdmin
        .from("books")
        .select("lifecycle_stage")
        .eq("id", book.id)
        .maybeSingle();

      if (freshBook?.lifecycle_stage === "Purchased") {
        console.warn(
          `[stripe] Subscription book ${book.id} unexpectedly in Purchased ` +
            `stage — skipping legacy full generation.`
        );
        return;
      }

      await genFull(book.id);
    })
    .catch(async (err: Error) => {
      console.error(
        `Subscription book generation failed for ${book.id}:`,
        err
      );
      const { error: failErr } = await supabaseAdmin
        .from("books")
        .update({ status: "failed" })
        .eq("id", book.id);
      if (failErr) {
        console.error(
          `[stripe] Failed to mark subscription book ${book.id} failed:`,
          failErr
        );
      }
    });

  const appUrl = getAppUrl();
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name")
    .eq("id", subUserId)
    .single();

  const { data: child } = await supabaseAdmin
    .from("child_profiles")
    .select("name")
    .eq("id", subChildId)
    .single();

  if (profile?.email && isResendConfigured()) {
    try {
      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: profile.email,
        subject: `${child?.name || "Your child"}'s new monthly Starmee book is being created!`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FFFBF5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:linear-gradient(135deg,#7C3AED,#EC4899);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Starmee Stories</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Your monthly book is on its way!</p>
    </div>
    <div style="background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #f0e6d6;border-top:none;">
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Hi ${profile.full_name || "there"}!</h2>
      <p style="margin:0 0 16px;color:#4a4a5a;font-size:15px;line-height:1.6;">
        Great news! ${child?.name || "Your child"}'s new monthly storybook is being created right now. It'll be ready in your dashboard shortly.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${appUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:600;">
          View Your Books
        </a>
      </div>
    </div>
    <div style="text-align:center;padding:24px 0;color:#9a9aaa;font-size:12px;">
      <p style="margin:0;">Made with love by Starmee Stories</p>
    </div>
  </div>
</body>
</html>`,
      });
    } catch (emailErr) {
      console.error("Failed to send subscription renewal email:", emailErr);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const inv2 = invoice as unknown as Record<string, unknown>;
  const rawSub2 = inv2.subscription;
  const subId =
    typeof rawSub2 === "string"
      ? rawSub2
      : (rawSub2 as Stripe.Subscription | null)?.id ?? null;

  if (!subId) return;

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subId);
}
