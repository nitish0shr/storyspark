/**
 * Replay protection and payment verification for Stripe webhooks.
 *
 * All exported helpers are pure and synchronous so they can be unit-tested
 * without Stripe or Supabase.
 *
 * Migration contract
 * ──────────────────
 * • books.lifecycle_stage uses title-cased stage names ("Ready for Purchase",
 *   "Purchased", "Delivered", …) aligned with the LIFECYCLE_STAGES const in
 *   src/lib/book-lifecycle.ts.
 * • orders row has: version_id, amount_cents, currency,
 *   payment_verified_at, purchase_confirmation_sent_at, fulfilled_at.
 * • stripe_webhook_events has: stripe_event_id (PK/unique), event_type,
 *   status ("processing" | "processed" | "failed"), received_at, processed_at.
 */

// ---------------------------------------------------------------------------
// Order state classification
// ---------------------------------------------------------------------------

/** Order statuses that mean the payment has already been fully handled. */
export const TERMINAL_ORDER_STATES = ["paid", "fulfilled", "refunded"] as const;
export type TerminalOrderState = (typeof TERMINAL_ORDER_STATES)[number];

export type WebhookDecision =
  | { process: true }
  | {
      process: false;
      reason: "no_order" | "already_processed";
      detail: string;
    };

/**
 * Decide whether a `checkout.session.completed` event should be acted on.
 * Pure and synchronous so it can be unit-tested without Stripe or Supabase.
 */
export function decideCheckoutProcessing(params: {
  sessionId: string;
  order: { id: string; status: string } | null | undefined;
}): WebhookDecision {
  const { sessionId, order } = params;

  if (!order) {
    return {
      process: false,
      reason: "no_order",
      detail:
        "No order row matches checkout session " +
        sessionId +
        ". Refusing to process so a payment is never applied to an unknown order.",
    };
  }

  if ((TERMINAL_ORDER_STATES as readonly string[]).includes(order.status)) {
    return {
      process: false,
      reason: "already_processed",
      detail:
        "Order " +
        order.id +
        " is already " +
        order.status +
        " (already paid); ignoring duplicate delivery of session " +
        sessionId +
        ".",
    };
  }

  return { process: true };
}

// ---------------------------------------------------------------------------
// Session metadata extraction
// ---------------------------------------------------------------------------

export interface CheckoutSessionMetadata {
  bookId: string | null;
  /** Durable order reservation created before the Stripe session. */
  orderId: string | null;
  userId: string | null;
  /** Stable opaque account/claim identity used when checkout was created. */
  buyerIdentity: string | null;
  /** Pinned product-artefact version ID embedded at checkout creation time. */
  versionId: string | null;
  isGift: boolean;
  giftRecipientEmail: string | null;
  giftRecipientName: string | null;
}

/**
 * Extracts and validates the canonical metadata fields from a Stripe session.
 * Pure helper — testable without Stripe.
 */
export function extractSessionMetadata(
  metadata: Record<string, string | null | undefined> | null | undefined
): CheckoutSessionMetadata {
  const m = metadata ?? {};
  return {
    bookId: (m.book_id as string) || null,
    orderId: (m.order_id as string) || null,
    userId: (m.user_id as string) || null,
    buyerIdentity: (m.buyer_identity as string) || null,
    versionId: (m.version_id as string) || null,
    isGift: m.is_gift === "true",
    giftRecipientEmail: (m.gift_recipient_email as string) || null,
    giftRecipientName: (m.gift_recipient_name as string) || null,
  };
}

// ---------------------------------------------------------------------------
// Payment verification
// ---------------------------------------------------------------------------

export interface PaymentVerificationResult {
  verified: boolean;
  reason?: string;
}

/** Minimal subset of a Stripe Checkout Session needed for payment verification. */
export interface StripeCheckoutSessionSubset {
  payment_status: string | null;
  amount_total: number | null;
  currency: string | null;
}

/**
 * Verifies that a Stripe checkout session represents a legitimate completed
 * payment. Checks payment_status, amount_total against the order record, and
 * currency.
 *
 * Pure helper — can be unit-tested by passing synthetic session objects.
 */
export function verifySessionPayment(params: {
  session: StripeCheckoutSessionSubset;
  /** Expected amount in cents from the orders.amount_cents column. */
  expectedAmountCents?: number;
  /** Expected ISO 4217 currency code (case-insensitive) from orders.currency. */
  expectedCurrency?: string;
}): PaymentVerificationResult {
  const { session, expectedAmountCents, expectedCurrency } = params;

  if (session.payment_status !== "paid") {
    return {
      verified: false,
      reason:
        "payment_status is " +
        session.payment_status +
        "; expected 'paid'.",
    };
  }

  if (
    expectedAmountCents !== undefined &&
    session.amount_total !== expectedAmountCents
  ) {
    return {
      verified: false,
      reason:
        "amount_total mismatch: session has " +
        session.amount_total +
        " but order expects " +
        expectedAmountCents +
        ".",
    };
  }

  if (
    expectedCurrency !== undefined &&
    (session.currency ?? "").toLowerCase() !== expectedCurrency.toLowerCase()
  ) {
    return {
      verified: false,
      reason:
        "currency mismatch: session has " +
        session.currency +
        " but order expects " +
        expectedCurrency +
        ".",
    };
  }

  return { verified: true };
}

// ---------------------------------------------------------------------------
// Exact identity + book version verification
// ---------------------------------------------------------------------------

/**
 * Verifies exact session/order/book/user/version identity before processing.
 * All fields must align — any mismatch is a hard stop.
 *
 * Also checks that the book's current lifecycle_stage is "Ready for Purchase"
 * and that its approved_version_id matches the version pinned at checkout.
 */
export function verifyExactIdentity(params: {
  sessionMeta: CheckoutSessionMetadata;
  order: {
    id?: string;
    user_id: string | null;
    purchaser_email?: string | null;
    status?: string;
    book_id: string;
    version_id?: string | null;
    amount_cents?: number | null;
    currency?: string | null;
  } | null | undefined;
  book: {
    id: string;
    user_id?: string | null;
    lifecycle_stage?: string | null;
    approved_version_id?: string | null;
  } | null | undefined;
}): PaymentVerificationResult {
  const { sessionMeta, order, book } = params;

  if (!sessionMeta.bookId || !sessionMeta.versionId) {
    return {
      verified: false,
      reason: "Session metadata missing book_id or version_id.",
    };
  }

  if (!order) {
    return { verified: false, reason: "No matching order found." };
  }
  if (sessionMeta.orderId && order.id !== sessionMeta.orderId) {
    return {
      verified: false,
      reason:
        "Order id " +
        order.id +
        " does not match session order_id " +
        sessionMeta.orderId +
        ".",
    };
  }

  if (order.user_id) {
    if (!sessionMeta.userId || order.user_id !== sessionMeta.userId) {
      return {
        verified: false,
        reason:
          "Order user_id " +
          order.user_id +
          " does not match session user_id " +
          sessionMeta.userId +
          ".",
      };
    }
  } else {
    if (sessionMeta.userId || !sessionMeta.buyerIdentity?.startsWith("anon:")) {
      return {
        verified: false,
        reason: "Anonymous order does not have a matching anonymous buyer claim.",
      };
    }
  }

  if (order.book_id !== sessionMeta.bookId) {
    return {
      verified: false,
      reason:
        "Order book_id " +
        order.book_id +
        " does not match session book_id " +
        sessionMeta.bookId +
        ".",
    };
  }

  // If order has a pinned version_id it must match the session metadata
  if (
    order.version_id &&
    sessionMeta.versionId &&
    order.version_id !== sessionMeta.versionId
  ) {
    return {
      verified: false,
      reason:
        "Order version_id " +
        order.version_id +
        " does not match session version_id " +
        sessionMeta.versionId +
        ".",
    };
  }

  if (!book) {
    return { verified: false, reason: "No matching book found." };
  }

  if (book.id !== sessionMeta.bookId) {
    return {
      verified: false,
      reason:
        "Book id " +
        book.id +
        " does not match session book_id " +
        sessionMeta.bookId +
        ".",
    };
  }

  // When lifecycle_stage is present on the book object, it must be "Ready for Purchase".
  // If the field is absent (e.g. legacy rows or test stubs), skip this check so
  // the function remains usable without the canonical lifecycle columns.
  const allowedStages =
    order.status === "paid" || order.status === "fulfilled"
      ? ["Ready for Purchase", "Purchased", "Delivered"]
      : ["Ready for Purchase"];
  if (
    "lifecycle_stage" in book &&
    !allowedStages.includes(book.lifecycle_stage ?? "")
  ) {
    return {
      verified: false,
      reason:
        "Book lifecycle_stage is '" +
        book.lifecycle_stage +
        "' but expected one of: " +
        allowedStages.join(", ") +
        ".",
    };
  }

  // approved_version_id must match the version pinned at checkout (when both are present).
  const effectiveVersionId = sessionMeta.versionId ?? order.version_id;
  if (
    effectiveVersionId &&
    "approved_version_id" in book &&
    book.approved_version_id !== null &&
    book.approved_version_id !== undefined &&
    book.approved_version_id !== effectiveVersionId
  ) {
    return {
      verified: false,
      reason:
        "Book approved_version_id " +
        book.approved_version_id +
        " does not match expected version " +
        effectiveVersionId +
        ".",
    };
  }

  return { verified: true };
}

// ---------------------------------------------------------------------------
// Purchase confirmation guard
// ---------------------------------------------------------------------------

/**
 * Returns true when a purchase confirmation email should be sent.
 * Keyed to the purchase_confirmation_sent_at column — idempotent across
 * webhook redeliveries.
 */
export function shouldSendPurchaseConfirmation(
  order: { purchase_confirmation_sent_at?: string | null } | null | undefined
): boolean {
  if (!order) return false;
  return !order.purchase_confirmation_sent_at;
}

// ---------------------------------------------------------------------------
// Delivery guard
// ---------------------------------------------------------------------------

/**
 * Returns true when the full-access delivery email should be sent.
 * Guards against re-sending if fulfilled_at is already set.
 */
export function shouldSendDelivery(
  order: { fulfilled_at?: string | null } | null | undefined
): boolean {
  if (!order) return false;
  return !order.fulfilled_at;
}

// ---------------------------------------------------------------------------
// Lifecycle stage — canonical title-cased values
// ---------------------------------------------------------------------------

/**
 * The canonical (title-cased) lifecycle stages for books.
 * These are the exact strings stored in books.lifecycle_stage and enforced
 * by the transition_book_lifecycle RPC.
 *
 * Customer-visible progress stages exposed in the success-page poller are a
 * subset of these — see BookStatusPoller.tsx.
 */
export const BOOK_LIFECYCLE_STAGES = [
  "Generated",
  "Under Review",
  "Changes Requested",
  "Revised",
  "Approved",
  "Ready for Purchase",
  "Purchased",
  "Delivered",
] as const;

export type BookLifecycleStage = (typeof BOOK_LIFECYCLE_STAGES)[number];

/**
 * Maps a raw books.lifecycle_stage string to a 0-based index in
 * BOOK_LIFECYCLE_STAGES. Returns -1 for unknown/unmapped values.
 * The function is case-sensitive: "Purchased" != "purchased".
 */
export function lifecycleStageIndex(stage: string): number {
  return (BOOK_LIFECYCLE_STAGES as readonly string[]).findIndex(
    (s) => s === stage,
  );
}
