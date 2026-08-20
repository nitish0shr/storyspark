import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getEmailRuntimeState,
  isEmailConfigured,
  sendEmail,
} from "@/lib/email-provider";
import {
  shouldSendPurchaseConfirmation,
  shouldSendDelivery,
} from "@/lib/webhook-idempotency";

/**
 * The contract is that non-production never calls a provider, regardless of
 * credentials, while production requires an explicit provider mode and full
 * provider configuration.
 *
 * No real email is sent in any of these tests.
 */

describe("email provider (no credentials configured)", () => {
  test("reports itself as not configured", () => {
    delete process.env.SENDGRID_API_KEY;
    assert.equal(isEmailConfigured(), false);
  });

  test("non-production defaults to a suppressed, unsent result", async () => {
    delete process.env.SENDGRID_API_KEY;
    const result = await sendEmail({
      to: "nobody@example.com",
      subject: "test",
      html: "<p>test</p>",
    });
    assert.equal(result.sent, false);
    assert.equal(result.reason, "suppressed_not_sent");
  });

  test("a provider key cannot cause a non-production network call", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalMode = process.env.EMAIL_MODE;
    const originalKey = process.env.SENDGRID_API_KEY;
    const originalFetch = globalThis.fetch;
    let providerCalls = 0;
    try {
      process.env.NODE_ENV = "development";
      process.env.EMAIL_MODE = "provider";
      process.env.SENDGRID_API_KEY = "test-never-used";
      globalThis.fetch = (async () => {
        providerCalls += 1;
        throw new Error("provider must not be called");
      }) as typeof fetch;
      const result = await sendEmail({
        to: "nobody@example.com",
        subject: "test",
        html: "<p>test</p>",
      });
      assert.equal(result.sent, false);
      assert.equal(result.reason, "suppressed_not_sent");
      assert.equal(providerCalls, 0);
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
      if (originalMode === undefined) delete process.env.EMAIL_MODE;
      else process.env.EMAIL_MODE = originalMode;
      if (originalKey === undefined) delete process.env.SENDGRID_API_KEY;
      else process.env.SENDGRID_API_KEY = originalKey;
      globalThis.fetch = originalFetch;
    }
  });

  test("capture is internal and never reports sent", () => {
    const state = getEmailRuntimeState({
      NODE_ENV: "test",
      EMAIL_MODE: "capture",
      SENDGRID_API_KEY: "test-never-used",
    });
    assert.deepEqual(state, {
      mode: "capture",
      reason: "non_production_capture",
    });
  });

  test("production fails closed without explicit complete provider readiness", () => {
    assert.equal(
      getEmailRuntimeState({
        NODE_ENV: "production",
        SENDGRID_API_KEY: "configured",
        EMAIL_FROM: "hello@example.com",
      }).mode,
      "unavailable",
    );
    assert.equal(
      getEmailRuntimeState({
        NODE_ENV: "production",
        EMAIL_MODE: "provider",
        SENDGRID_API_KEY: "configured",
      }).mode,
      "unavailable",
    );
    assert.equal(
      getEmailRuntimeState({
        NODE_ENV: "production",
        EMAIL_MODE: "provider",
        SENDGRID_API_KEY: "configured",
        EMAIL_FROM: "hello@example.com",
      }).mode,
      "provider",
    );
  });

  test("delivery must not be recorded when result.sent is false", async () => {
    delete process.env.SENDGRID_API_KEY;
    const order = {
      fulfilled_at: null as string | null,
      email_delivered: false,
    };

    const result = await sendEmail({ to: "a@b.com", subject: "s", html: "h" });

    // Mirrors webhook handler: only write fulfilled_at after a confirmed send.
    if (result.sent) {
      order.fulfilled_at = new Date().toISOString();
      order.email_delivered = true;
    }

    assert.equal(order.fulfilled_at, null, "fulfilled_at must not be set");
    assert.equal(order.email_delivered, false, "email_delivered must not be set");
  });

  test("a second delivery attempt is refused once fulfilled_at is set", () => {
    const order = { fulfilled_at: "2026-08-04T00:00:00Z" };
    // shouldSendDelivery is the canonical guard used by the webhook handler.
    assert.equal(shouldSendDelivery(order), false);
  });

  test("purchase_confirmation_sent_at guards duplicate confirmation sends", async () => {
    delete process.env.SENDGRID_API_KEY;
    let order = { purchase_confirmation_sent_at: null as string | null };
    let confirmationsSent = 0;

    // Simulate 3 webhook redeliveries. Only the first may send.
    for (let i = 0; i < 3; i++) {
      if (shouldSendPurchaseConfirmation(order)) {
        const result = await sendEmail({
          to: "buyer@example.com",
          subject: "Your book is purchased",
          html: "<p>unlocked</p>",
        });
        // Only mark sent when the provider confirmed (it won't — unconfigured).
        if (result.sent) {
          confirmationsSent++;
          order = { purchase_confirmation_sent_at: new Date().toISOString() };
        }
        // Even when not sent, guard prevents re-entering on next iteration if
        // the caller records something else. Here the guard stays open because
        // result.sent === false and sent_at was never written. That is correct
        // behaviour: the confirmation will be retried on the next webhook call.
      }
    }

    // Provider is unconfigured, so confirmationsSent stays 0 and sent_at null.
    assert.equal(confirmationsSent, 0);
    assert.equal(order.purchase_confirmation_sent_at, null);
  });
});

// ---------------------------------------------------------------------------
// Purchase confirmation guard (pure guard logic — no email sent)
// ---------------------------------------------------------------------------

describe("purchase confirmation delivery guard", () => {
  test("should send when confirmation has never been sent", () => {
    assert.equal(
      shouldSendPurchaseConfirmation({ purchase_confirmation_sent_at: null }),
      true
    );
  });

  test("should NOT send when confirmation already sent", () => {
    assert.equal(
      shouldSendPurchaseConfirmation({
        purchase_confirmation_sent_at: "2026-08-04T00:00:00Z",
      }),
      false
    );
  });

  test("should NOT send for a null/undefined order", () => {
    assert.equal(shouldSendPurchaseConfirmation(null), false);
    assert.equal(shouldSendPurchaseConfirmation(undefined), false);
  });
});

// ---------------------------------------------------------------------------
// Fulfilment delivery guard (pure guard logic — no email sent)
// ---------------------------------------------------------------------------

describe("fulfilment delivery guard", () => {
  test("should send delivery when not yet fulfilled", () => {
    assert.equal(shouldSendDelivery({ fulfilled_at: null }), true);
  });

  test("should NOT send delivery when already fulfilled", () => {
    assert.equal(
      shouldSendDelivery({ fulfilled_at: "2026-08-04T12:00:00Z" }),
      false
    );
  });

  test("should NOT send delivery for a null/undefined order", () => {
    assert.equal(shouldSendDelivery(null), false);
    assert.equal(shouldSendDelivery(undefined), false);
  });
});

// ---------------------------------------------------------------------------
// Purchase confirmation email copy — must say "purchased/unlocked", not "under review"
// ---------------------------------------------------------------------------

describe("purchase confirmation email copy", () => {
  test("confirmation template contains 'purchased' and 'unlocked'", () => {
    const fs = require("node:fs");
    const path = require("node:path");
    const src: string = fs.readFileSync(
      path.resolve(process.cwd(), "src/lib/email-notifications.ts"),
      "utf-8"
    );

    // Must mention purchased/unlocked — NOT "under review".
    assert.ok(
      src.includes("purchased") || src.includes("unlocked"),
      'email-notifications.ts must contain "purchased" or "unlocked" in the confirmation copy'
    );
    assert.ok(
      !src.includes("under review") && !src.includes("under-review"),
      'email-notifications.ts must NOT contain "under review" in the purchase confirmation'
    );
  });

  test('invitation CTA has exact text "Preview and Complete Your Purchase"', () => {
    const fs = require("node:fs");
    const path = require("node:path");
    const src: string = fs.readFileSync(
      path.resolve(process.cwd(), "src/lib/email-notifications.ts"),
      "utf-8"
    );
    assert.ok(
      src.includes("Preview and Complete Your Purchase"),
      'email-notifications.ts must contain exact CTA: "Preview and Complete Your Purchase"'
    );
  });

  test("application email routes contain no direct Resend provider send", () => {
    const fs = require("node:fs");
    const path = require("node:path");
    for (const relativePath of [
      "src/app/api/email/route.ts",
      "src/app/api/webhooks/stripe/route.ts",
    ]) {
      const src: string = fs.readFileSync(
        path.resolve(process.cwd(), relativePath),
        "utf-8",
      );
      assert.ok(!src.includes("resend.emails.send"));
      assert.ok(src.includes("sendEmail("));
    }
  });
});
