export const CHECKOUT_RESERVATION_LEASE_MS = 15 * 60 * 1000;

export function shouldReuseUnboundCheckoutReservation(params: {
  status: string;
  stripeSessionId: string | null;
  reservationExpiresAt: string | null;
  createdAt: string;
  nowMs: number;
}): boolean {
  // Even after the operational lease timestamp, an unbound reservation must
  // be replayed with the same Stripe idempotency key. Releasing it solely
  // because time passed could leave an accepted but unbound Stripe session.
  return params.status === "pending" && !params.stripeSessionId;
}

export function shouldApplyCheckoutExpiry(params: {
  orderStatus: string;
  paymentVerifiedAt: string | null;
}): boolean {
  return params.orderStatus === "pending" && !params.paymentVerifiedAt;
}