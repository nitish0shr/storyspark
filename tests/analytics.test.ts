import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  readGoogleTagConfig,
  isTaggingEnabled,
  configurableIds,
  purchaseEvents,
  centsToMajorUnits,
} from "@/lib/analytics";

const GA = "G-TEST12345";
const ADS = "AW-987654321";
const LABEL = "AbC-D_efGh";

describe("google tag configuration", () => {
  test("no env vars means tagging is off", () => {
    const config = readGoogleTagConfig({});
    assert.equal(isTaggingEnabled(config), false);
    assert.deepEqual(configurableIds(config), []);
  });

  test("blank and whitespace values count as absent", () => {
    const config = readGoogleTagConfig({
      NEXT_PUBLIC_GA4_ID: "",
      NEXT_PUBLIC_GOOGLE_ADS_ID: "   ",
    });
    assert.equal(isTaggingEnabled(config), false);
  });

  test("surrounding whitespace is trimmed off real IDs", () => {
    const config = readGoogleTagConfig({ NEXT_PUBLIC_GA4_ID: "  " + GA + " " });
    assert.equal(config.ga4Id, GA);
    assert.equal(isTaggingEnabled(config), true);
  });

  test("either ID alone switches tagging on", () => {
    assert.equal(
      isTaggingEnabled(readGoogleTagConfig({ NEXT_PUBLIC_GA4_ID: GA })),
      true,
    );
    assert.equal(
      isTaggingEnabled(readGoogleTagConfig({ NEXT_PUBLIC_GOOGLE_ADS_ID: ADS })),
      true,
    );
  });

  test("both IDs each get their own config call", () => {
    const config = readGoogleTagConfig({
      NEXT_PUBLIC_GA4_ID: GA,
      NEXT_PUBLIC_GOOGLE_ADS_ID: ADS,
    });
    assert.deepEqual(configurableIds(config), [GA, ADS]);
  });
});

describe("purchase events", () => {
  const purchase = { transactionId: "cs_test_123", value: 24.99, currency: "USD" };

  test("nothing fires when nothing is configured", () => {
    assert.deepEqual(purchaseEvents(readGoogleTagConfig({}), purchase), []);
  });

  test("GA4 alone fires only a purchase event", () => {
    const events = purchaseEvents(
      readGoogleTagConfig({ NEXT_PUBLIC_GA4_ID: GA }),
      purchase,
    );
    assert.equal(events.length, 1);
    assert.equal(events[0][0], "purchase");
    assert.deepEqual(events[0][1], {
      transaction_id: "cs_test_123",
      value: 24.99,
      currency: "USD",
    });
  });

  test("an Ads ID without its label fires no conversion", () => {
    const events = purchaseEvents(
      readGoogleTagConfig({ NEXT_PUBLIC_GOOGLE_ADS_ID: ADS }),
      purchase,
    );
    assert.deepEqual(events, []);
  });

  test("Ads ID plus label builds the send_to target", () => {
    const events = purchaseEvents(
      readGoogleTagConfig({
        NEXT_PUBLIC_GOOGLE_ADS_ID: ADS,
        NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL: LABEL,
      }),
      purchase,
    );
    assert.equal(events.length, 1);
    assert.equal(events[0][0], "conversion");
    assert.equal(events[0][1].send_to, ADS + "/" + LABEL);
  });

  test("a fully configured account fires both events", () => {
    const events = purchaseEvents(
      readGoogleTagConfig({
        NEXT_PUBLIC_GA4_ID: GA,
        NEXT_PUBLIC_GOOGLE_ADS_ID: ADS,
        NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL: LABEL,
      }),
      purchase,
    );
    assert.deepEqual(
      events.map((e) => e[0]),
      ["purchase", "conversion"],
    );
  });

  test("an unknown amount reports zero rather than null", () => {
    const events = purchaseEvents(readGoogleTagConfig({ NEXT_PUBLIC_GA4_ID: GA }), {
      transactionId: "cs_test_456",
      value: null,
      currency: "GBP",
    });
    assert.equal(events[0][1].value, 0);
    assert.equal(events[0][1].currency, "GBP");
  });
});

describe("cents conversion", () => {
  test("cents become major units", () => {
    assert.equal(centsToMajorUnits(4999), 49.99);
    assert.equal(centsToMajorUnits(0), 0);
  });

  test("missing or non-finite amounts stay null", () => {
    assert.equal(centsToMajorUnits(null), null);
    assert.equal(centsToMajorUnits(undefined), null);
    assert.equal(centsToMajorUnits(Number.NaN), null);
    assert.equal(centsToMajorUnits(Number.POSITIVE_INFINITY), null);
  });
});
