/**
 * Replay protection for Stripe webhooks.
 *
 * Stripe retries a webhook until it gets a 2xx, and can redeliver the same
 * event more than once. Without a guard, `checkout.session.completed` would
 * re-run its side effects (marking the order paid, flagging the book as
 * purchased, kicking off generation) on every redelivery.
 *
 * The order row itself is the idempotency record - no extra table is needed.
 * Terminal states are never reprocessed.
 */

/** Order states that mean the payment has already been handled. */
export const TERMINAL_ORDER_STATES = ["paid", "fulfilled", "refunded"] as const;

export type WebhookDecision =
  | { process: true }
  | { process: false; reason: "no_order" | "already_processed"; detail: string };

/**
 * Decide whether a `checkout.session.completed` event should be acted on.
 * Pure and synchronous so it can be unit tested without Stripe or Supabase.
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
        "; ignoring duplicate delivery of session " +
        sessionId +
        ".",
    };
  }

  return { process: true };
}
