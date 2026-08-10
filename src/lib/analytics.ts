/**
 * Google Analytics 4 + Google Ads tagging.
 *
 * Every ID is optional. With none configured the app injects no tag at all,
 * so the site behaves exactly as it did before marketing supplied IDs. Add
 * the env vars later and redeploy - no code change needed.
 */

export interface GoogleTagConfig {
  /** GA4 measurement ID, e.g. "G-ABCD123456". */
  ga4Id: string | null;
  /** Google Ads conversion ID, e.g. "AW-123456789". */
  adsId: string | null;
  /** Conversion label paired with adsId, e.g. "AbC-D_efGh". */
  adsPurchaseLabel: string | null;
}

export interface PurchaseDetails {
  transactionId: string;
  /** Major units (dollars, not cents). Null when the amount is unknown. */
  value: number | null;
  currency: string;
}

export type GtagEvent = [name: string, params: Record<string, unknown>];

function clean(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readGoogleTagConfig(
  env: Record<string, string | undefined>,
): GoogleTagConfig {
  return {
    ga4Id: clean(env.NEXT_PUBLIC_GA4_ID),
    adsId: clean(env.NEXT_PUBLIC_GOOGLE_ADS_ID),
    adsPurchaseLabel: clean(env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL),
  };
}

/** Nothing is injected unless at least one ID exists. */
export function isTaggingEnabled(config: GoogleTagConfig): boolean {
  return config.ga4Id !== null || config.adsId !== null;
}

/** IDs that each need their own gtag("config", id) call. */
export function configurableIds(config: GoogleTagConfig): string[] {
  return [config.ga4Id, config.adsId].filter(
    (id): id is string => id !== null,
  );
}

/**
 * The gtag events a completed purchase should fire.
 *
 * GA4 wants a "purchase" event; Google Ads wants a "conversion" routed to a
 * specific send_to target. Ads is skipped unless BOTH the conversion ID and
 * its label are present, because a send_to without a label records nothing.
 */
export function purchaseEvents(
  config: GoogleTagConfig,
  purchase: PurchaseDetails,
): GtagEvent[] {
  const events: GtagEvent[] = [];

  if (config.ga4Id !== null) {
    events.push([
      "purchase",
      {
        transaction_id: purchase.transactionId,
        value: purchase.value ?? 0,
        currency: purchase.currency,
      },
    ]);
  }

  if (config.adsId !== null && config.adsPurchaseLabel !== null) {
    events.push([
      "conversion",
      {
        send_to: config.adsId + "/" + config.adsPurchaseLabel,
        transaction_id: purchase.transactionId,
        value: purchase.value ?? 0,
        currency: purchase.currency,
      },
    ]);
  }

  return events;
}

/** Stripe reports cents; gtag wants major units. Null stays null. */
export function centsToMajorUnits(
  cents: number | null | undefined,
): number | null {
  if (typeof cents !== "number") return null;
  if (Number.isFinite(cents) === false) return null;
  return Math.round(cents) / 100;
}
