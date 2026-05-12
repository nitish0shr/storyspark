import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "Stripe is not configured. Set STRIPE_SECRET_KEY to enable payments."
      );
    }
    _stripe = new Stripe(key, {
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

function centsFromEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function labelFromCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Centralized pricing — single source of truth */
const baseCents = centsFromEnv("PRICE_BASE", 999);
export const PRICING = {
  base: { cents: baseCents, label: labelFromCents(baseCents), name: "Digital PDF" },
} as const;

/** @deprecated Use PRICING object instead */
export const PRICE_BASE = PRICING.base.cents;
