export type OrderStatus = "pending" | "paid" | "fulfilled" | "refunded" | "failed";
export type PricingTier = "base" | "mid" | "premium";

export interface Order {
  id: string;
  userId: string | null;
  purchaserEmail?: string | null;
  bookId: string;
  /** The book version this order was placed for */
  versionId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  status: OrderStatus;
  amountCents: number;
  currency: string;
  tier: PricingTier;
  isGift: boolean;
  giftRecipientName: string | null;
  giftRecipientEmail: string | null;
  giftMessage: string | null;
  emailDelivered: boolean;
  /** Prevents duplicate checkout sessions across retries */
  checkoutIdempotencyKey: string | null;
  /** When the payment was cryptographically verified (e.g. Stripe webhook) */
  paymentVerifiedAt: string | null;
  /** When the purchase-confirmation email was dispatched */
  purchaseConfirmationSentAt: string | null;
  /** Exact timestamp when the order was marked fulfilled */
  fulfilledAt: string | null;
  /** Legacy idempotency key (kept for backward compat) */
  idempotencyKey: string | null;
  /** Legacy payment confirmed timestamp */
  paymentConfirmedAt: string | null;
  paymentMethod: string | null;
  paymentMetadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Stripe webhook event (idempotency log) ───────────────────────────────────
export type StripeWebhookOutcome = "processed" | "skipped" | "error";

export interface StripeWebhookEvent {
  id: string;
  stripeEventId: string;
  eventType: string;
  processedAt: string;
  orderId: string | null;
  bookId: string | null;
  outcome: StripeWebhookOutcome | null;
  errorDetail: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Checkout attempt ─────────────────────────────────────────────────────────
export type CheckoutAttemptStatus = "initiated" | "completed" | "expired" | "abandoned";

export interface CheckoutAttempt {
  id: string;
  bookId: string;
  orderId: string | null;
  versionId: string | null;
  stripeCheckoutSessionId: string | null;
  idempotencyKey: string | null;
  status: CheckoutAttemptStatus;
  initiatedAt: string;
  completedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Operational failure ──────────────────────────────────────────────────────
export interface OperationalFailure {
  id: string;
  bookId: string | null;
  orderId: string | null;
  stage: string | null;
  errorCode: string;
  errorDetail: string | null;
  context: Record<string, unknown> | null;
  resolvedAt: string | null;
  createdAt: string;
}
