/**
 * Conversion tracking: Google Ads, GA4, and the Meta pixel.
 *
 * Two conversions matter, both mapped onto the platforms' STANDARD ecommerce
 * events so the ad platforms optimise bidding against them properly:
 *
 *   free preview generated -> GA4 "add_to_cart" / Meta "AddToCart"
 *   book purchased         -> GA4 "purchase"    / Meta "Purchase"
 *
 * Google Ads additionally needs its own "conversion" event routed to a
 * send_to target built from the conversion ID plus that action's label.
 *
 * Every ID is optional. With none configured nothing is injected and no
 * event fires, so the site is safe to ship before marketing supplies IDs.
 */

export interface TagConfig {
  /** GA4 measurement ID, e.g. "G-ABCD123456". */
  ga4Id: string | null;
  /** Google Ads conversion ID, e.g. "AW-18257695267". */
  adsId: string | null;
  /** Label for the purchase conversion action. */
  adsPurchaseLabel: string | null;
  /** Label for the generate_preview conversion action. */
  adsPreviewLabel: string | null;
  /** Meta pixel / dataset ID, e.g. "1059108740316571". */
  metaPixelId: string | null;
  /**
   * Value reported when the real amount is unknown - a preview has no
   * amount, and a purchase falls back to this if Stripe cannot be read.
   */
  fallbackValue: number;
  currency: string;
}

export interface ConversionDetails {
  /** Stripe session id for a purchase, book id for a preview. */
  transactionId: string;
  /** Major units (dollars, not cents). Null means "use the fallback". */
  value: number | null;
  /** Overrides the configured currency when known. */
  currency?: string | null;
}

/** One tracking call, kept declarative so it can be unit tested. */
export type TrackedEvent =
  | { channel: "gtag"; name: string; params: Record<string, unknown> }
  | { channel: "meta"; name: string; params: Record<string, unknown> }
  | { channel: "dataLayer"; name: string; params: Record<string, unknown> };

const DEFAULT_FALLBACK_VALUE = 9.99;
const DEFAULT_CURRENCY = "USD";

function clean(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number.parseFloat((value ?? "").trim());
  if (Number.isFinite(parsed) === false) return fallback;
  if (parsed < 0) return fallback;
  return parsed;
}

export function readTagConfig(
  env: Record<string, string | undefined>,
): TagConfig {
  return {
    ga4Id: clean(env.NEXT_PUBLIC_GA4_ID),
    adsId: clean(env.NEXT_PUBLIC_GOOGLE_ADS_ID),
    adsPurchaseLabel: clean(env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL),
    adsPreviewLabel: clean(env.NEXT_PUBLIC_GOOGLE_ADS_PREVIEW_LABEL),
    metaPixelId: clean(env.NEXT_PUBLIC_META_PIXEL_ID),
    fallbackValue: toNumber(env.NEXT_PUBLIC_BOOK_PRICE, DEFAULT_FALLBACK_VALUE),
    currency: clean(env.NEXT_PUBLIC_CURRENCY) ?? DEFAULT_CURRENCY,
  };
}

/** True when gtag.js should be loaded at all. */
export function isGoogleEnabled(config: TagConfig): boolean {
  return config.ga4Id !== null || config.adsId !== null;
}

/** True when the Meta pixel should be loaded at all. */
export function isMetaEnabled(config: TagConfig): boolean {
  return config.metaPixelId !== null;
}

/** IDs that each need their own gtag("config", id) call. */
export function configurableIds(config: TagConfig): string[] {
  return [config.ga4Id, config.adsId].filter((id): id is string => id !== null);
}

/**
 * Google Ads send_to target, or null when the action is not fully
 * configured. A send_to without a label silently records nothing, so both
 * halves are required.
 */
export function sendToTarget(
  adsId: string | null,
  label: string | null,
): string | null {
  if (adsId === null || label === null) return null;
  return adsId + "/" + label;
}

function resolveValue(config: TagConfig, details: ConversionDetails) {
  const value =
    typeof details.value === "number" && Number.isFinite(details.value)
      ? details.value
      : config.fallbackValue;
  const currency = clean(details.currency ?? undefined) ?? config.currency;
  return { value, currency };
}

function buildEvents(
  config: TagConfig,
  details: ConversionDetails,
  googleStandardName: string,
  metaStandardName: string,
  adsLabel: string | null,
): TrackedEvent[] {
  const events: TrackedEvent[] = [];
  const { value, currency } = resolveValue(config, details);

  const items = [
    {
      item_id: "starmee_storybook",
      item_name: "Starmee personalised storybook",
      price: value,
      quantity: 1,
    },
  ];

  if (config.ga4Id !== null) {
    events.push({
      channel: "gtag",
      name: googleStandardName,
      params: {
        transaction_id: details.transactionId,
        value,
        currency,
        items,
      },
    });
  }

  const sendTo = sendToTarget(config.adsId, adsLabel);
  if (sendTo !== null) {
    events.push({
      channel: "gtag",
      name: "conversion",
      params: {
        send_to: sendTo,
        transaction_id: details.transactionId,
        value,
        currency,
      },
    });
  }

  // event_id lets a future server-side Conversions API call deduplicate
  // against this browser event.
  if (config.metaPixelId !== null) {
    events.push({
      channel: "meta",
      name: metaStandardName,
      params: {
        value,
        currency,
        content_ids: ["starmee_storybook"],
        content_type: "product",
        event_id: details.transactionId,
      },
    });
  }

  // Data-layer push so Google Tag Manager can read the real value from a
  // Data Layer Variable instead of a hardcoded one.
  events.push({
    channel: "dataLayer",
    name: googleStandardName,
    params: {
      event: googleStandardName,
      ecommerce: {
        transaction_id: details.transactionId,
        value,
        currency,
        items,
      },
    },
  });

  return events;
}

/** Fired once a paid book is confirmed. */
export function purchaseEvents(
  config: TagConfig,
  details: ConversionDetails,
): TrackedEvent[] {
  return buildEvents(config, details, "purchase", "Purchase", config.adsPurchaseLabel);
}

/**
 * Fired when a free preview has been generated. Mapped to add_to_cart /
 * AddToCart: the visitor has chosen a book but has not paid yet.
 */
export function previewEvents(
  config: TagConfig,
  details: ConversionDetails,
): TrackedEvent[] {
  return buildEvents(config, details, "add_to_cart", "AddToCart", config.adsPreviewLabel);
}

/** Stripe reports cents; the ad platforms want major units. */
export function centsToMajorUnits(
  cents: number | null | undefined,
): number | null {
  if (typeof cents !== "number") return null;
  if (Number.isFinite(cents) === false) return null;
  return Math.round(cents) / 100;
}
