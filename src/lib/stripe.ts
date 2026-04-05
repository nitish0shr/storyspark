import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/** Centralized pricing — single source of truth */
export const PRICING = {
  base: { cents: 999, label: "$9.99", name: "Digital Book" },
  mid: { cents: 1999, label: "$19.99", name: "Deluxe Digital" },
  premium: { cents: 3499, label: "$34.99", name: "Premium Bundle" },
} as const;

/** @deprecated Use PRICING object instead */
export const PRICE_BASE = PRICING.base.cents;
export const PRICE_MID = PRICING.mid.cents;
export const PRICE_PREMIUM = PRICING.premium.cents;
