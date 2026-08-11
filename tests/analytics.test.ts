import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  readTagConfig,
  isGoogleEnabled,
  isMetaEnabled,
  configurableIds,
  sendToTarget,
  purchaseEvents,
  previewEvents,
  centsToMajorUnits,
  type TrackedEvent,
} from "@/lib/analytics";

// The real production values, so these tests fail loudly if a label is ever
// mistyped or the two conversion actions get swapped.
const LIVE = {
  NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-18257695267",
  NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL: "H74kCK2mmd8cEKOk-YFE",
  NEXT_PUBLIC_GOOGLE_ADS_PREVIEW_LABEL: "IdxHCMyVi98cEKOk-YFE",
  NEXT_PUBLIC_META_PIXEL_ID: "1059108740316571",
};

function namesFor(events: TrackedEvent[], channel: string): string[] {
  return events.filter((e) => e.channel === channel).map((e) => e.name);
}

function firstOf(events: TrackedEvent[], channel: string): TrackedEvent {
  const found = events.find((e) => e.channel === channel);
  assert.ok(found, "expected a " + channel + " event");
  return found;
}

function conversionOf(events: TrackedEvent[]): TrackedEvent | undefined {
  return events.find((e) => e.channel === "gtag" && e.name === "conversion");
}

describe("tag configuration", () => {
  test("no env vars means nothing is enabled", () => {
    const config = readTagConfig({});
    assert.equal(isGoogleEnabled(config), false);
    assert.equal(isMetaEnabled(config), false);
    assert.deepEqual(configurableIds(config), []);
  });

  test("blank and whitespace values count as absent", () => {
    const config = readTagConfig({
      NEXT_PUBLIC_GOOGLE_ADS_ID: "  ",
      NEXT_PUBLIC_META_PIXEL_ID: "",
    });
    assert.equal(isGoogleEnabled(config), false);
    assert.equal(isMetaEnabled(config), false);
  });

  test("the live config enables Google and Meta", () => {
    const config = readTagConfig(LIVE);
    assert.equal(isGoogleEnabled(config), true);
    assert.equal(isMetaEnabled(config), true);
    assert.deepEqual(configurableIds(config), ["AW-18257695267"]);
  });

  test("GA4 is configured alongside Ads when present", () => {
    const config = readTagConfig({ ...LIVE, NEXT_PUBLIC_GA4_ID: "G-ABC123" });
    assert.deepEqual(configurableIds(config), ["G-ABC123", "AW-18257695267"]);
  });

  test("price defaults to 9.99 and accepts an override", () => {
    assert.equal(readTagConfig({}).fallbackValue, 9.99);
    assert.equal(readTagConfig({ NEXT_PUBLIC_BOOK_PRICE: "14.50" }).fallbackValue, 14.5);
  });

  test("a nonsense price falls back rather than sending NaN", () => {
    assert.equal(readTagConfig({ NEXT_PUBLIC_BOOK_PRICE: "abc" }).fallbackValue, 9.99);
    assert.equal(readTagConfig({ NEXT_PUBLIC_BOOK_PRICE: "-5" }).fallbackValue, 9.99);
  });

  test("send_to needs both an ID and a label", () => {
    assert.equal(sendToTarget("AW-1", "L1"), "AW-1/L1");
    assert.equal(sendToTarget("AW-1", null), null);
    assert.equal(sendToTarget(null, "L1"), null);
  });
});

describe("purchase conversion", () => {
  const config = readTagConfig(LIVE);
  const details = { transactionId: "cs_test_123", value: 24.99, currency: "USD" };

  test("uses the standard purchase event names", () => {
    const events = purchaseEvents(config, details);
    assert.deepEqual(namesFor(events, "meta"), ["Purchase"]);
    assert.deepEqual(namesFor(events, "dataLayer"), ["purchase"]);
  });

  test("routes to the purchase conversion label", () => {
    const conversion = conversionOf(purchaseEvents(config, details));
    assert.ok(conversion);
    assert.equal(conversion.params.send_to, "AW-18257695267/H74kCK2mmd8cEKOk-YFE");
  });

  test("sends the real amount, not the hardcoded fallback", () => {
    const meta = firstOf(purchaseEvents(config, details), "meta");
    assert.equal(meta.params.value, 24.99);
    assert.notEqual(meta.params.value, 9.99);
  });

  test("falls back to the configured price when the amount is unknown", () => {
    const events = purchaseEvents(config, { transactionId: "cs_2", value: null });
    assert.equal(firstOf(events, "meta").params.value, 9.99);
  });

  test("pushes a dataLayer event GTM can read", () => {
    const push = firstOf(purchaseEvents(config, details), "dataLayer");
    assert.equal(push.params.event, "purchase");
    const ecommerce = push.params.ecommerce as Record<string, unknown>;
    assert.equal(ecommerce.value, 24.99);
    assert.equal(ecommerce.currency, "USD");
    assert.equal(ecommerce.transaction_id, "cs_test_123");
  });

  test("carries an event_id so server-side CAPI can deduplicate", () => {
    const meta = firstOf(purchaseEvents(config, details), "meta");
    assert.equal(meta.params.event_id, "cs_test_123");
  });
});

describe("preview conversion", () => {
  const config = readTagConfig(LIVE);
  const details = { transactionId: "book_abc", value: null };

  test("maps generate_preview onto the standard add-to-cart events", () => {
    const events = previewEvents(config, details);
    assert.deepEqual(namesFor(events, "meta"), ["AddToCart"]);
    assert.deepEqual(namesFor(events, "dataLayer"), ["add_to_cart"]);
  });

  test("routes to the preview conversion label, not the purchase one", () => {
    const conversion = conversionOf(previewEvents(config, details));
    assert.ok(conversion);
    assert.equal(conversion.params.send_to, "AW-18257695267/IdxHCMyVi98cEKOk-YFE");
  });

  test("a free preview still reports the book price as its value", () => {
    const meta = firstOf(previewEvents(config, details), "meta");
    assert.equal(meta.params.value, 9.99);
    assert.equal(meta.params.currency, "USD");
  });

  test("purchase and preview never share a send_to target", () => {
    assert.notEqual(
      conversionOf(purchaseEvents(config, details))?.params.send_to,
      conversionOf(previewEvents(config, details))?.params.send_to,
    );
  });
});

describe("partial configuration", () => {
  test("Meta alone fires Meta plus dataLayer but no gtag", () => {
    const config = readTagConfig({ NEXT_PUBLIC_META_PIXEL_ID: "1059108740316571" });
    const events = purchaseEvents(config, { transactionId: "t1", value: 9.99 });
    assert.deepEqual(namesFor(events, "gtag"), []);
    assert.deepEqual(namesFor(events, "meta"), ["Purchase"]);
  });

  test("an Ads ID with no label fires no Google conversion", () => {
    const config = readTagConfig({ NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-18257695267" });
    const events = purchaseEvents(config, { transactionId: "t1", value: 1 });
    assert.deepEqual(namesFor(events, "gtag"), []);
  });

  test("with nothing configured only the dataLayer push remains", () => {
    const events = purchaseEvents(readTagConfig({}), { transactionId: "t1", value: 1 });
    assert.deepEqual(events.map((e) => e.channel), ["dataLayer"]);
  });
});

describe("cents conversion", () => {
  test("cents become major units", () => {
    assert.equal(centsToMajorUnits(999), 9.99);
    assert.equal(centsToMajorUnits(2499), 24.99);
    assert.equal(centsToMajorUnits(0), 0);
  });

  test("missing or non-finite amounts stay null", () => {
    assert.equal(centsToMajorUnits(null), null);
    assert.equal(centsToMajorUnits(undefined), null);
    assert.equal(centsToMajorUnits(Number.NaN), null);
    assert.equal(centsToMajorUnits(Number.POSITIVE_INFINITY), null);
  });
});
