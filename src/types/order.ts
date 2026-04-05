export type OrderStatus = "pending" | "paid" | "fulfilled" | "refunded" | "failed";
export type PricingTier = "base" | "mid" | "premium";

export interface Order {
  id: string;
  userId: string;
  bookId: string;
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
  createdAt: string;
}
