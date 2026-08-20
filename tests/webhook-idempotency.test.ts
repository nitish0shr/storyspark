import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  decideCheckoutProcessing,
  TERMINAL_ORDER_STATES,
  extractSessionMetadata,
  verifySessionPayment,
  verifyExactIdentity,
  shouldSendPurchaseConfirmation,
  shouldSendDelivery,
  lifecycleStageIndex,
  BOOK_LIFECYCLE_STAGES,
} from "@/lib/webhook-idempotency";
import {
  shouldApplyCheckoutExpiry,
  shouldReuseUnboundCheckoutReservation,
} from "@/lib/checkout-recovery";
import { runPostPaymentRecovery } from "@/lib/notification-recovery";

// ---------------------------------------------------------------------------
// Replay protection — decideCheckoutProcessing
// ---------------------------------------------------------------------------

describe("stripe webhook replay protection", () => {
  test("processes a pending order exactly once", () => {
    const d = decideCheckoutProcessing({
      sessionId: "cs_1",
      order: { id: "o1", status: "pending" },
    });
    assert.equal(d.process, true);
  });

  test("refuses a redelivered event once the order is paid", () => {
    const d = decideCheckoutProcessing({
      sessionId: "cs_1",
      order: { id: "o1", status: "paid" },
    });
    assert.equal(d.process, false);
    if (d.process === false) {
      assert.equal(d.reason, "already_processed");
      // detail must mention "already paid" somewhere
      assert.match(d.detail, /already paid/i);
    }
  });

  test("treats every terminal state as already processed", () => {
    for (const status of TERMINAL_ORDER_STATES) {
      const d = decideCheckoutProcessing({
        sessionId: "cs_x",
        order: { id: "o", status },
      });
      assert.equal(d.process, false, status + " should not reprocess");
    }
  });

  test("refuses to apply a payment to an unknown order", () => {
    const d = decideCheckoutProcessing({
      sessionId: "cs_missing",
      order: null,
    });
    assert.equal(d.process, false);
    if (d.process === false) assert.equal(d.reason, "no_order");
  });

  test("a failed order can still be retried", () => {
    const d = decideCheckoutProcessing({
      sessionId: "cs_2",
      order: { id: "o2", status: "failed" },
    });
    assert.equal(d.process, true);
  });

  test("simulated double delivery produces exactly one side effect", () => {
    let order: { id: string; status: string } = { id: "o3", status: "pending" };
    let sideEffects = 0;
    for (let i = 0; i < 3; i++) {
      const d = decideCheckoutProcessing({ sessionId: "cs_3", order });
      if (d.process) {
        sideEffects++;
        order = { ...order, status: "paid" };
      }
    }
    assert.equal(sideEffects, 1);
    assert.equal(order.status, "paid");
  });
});

describe("post-payment notification recovery", () => {
  test("suppressed confirmation is recorded but finalisation still runs", async () => {
    let failures = 0;
    let finalisations = 0;
    const result = await runPostPaymentRecovery({
      attemptNotification: async () => {
        throw new Error("not_configured");
      },
      recordNotificationFailure: async () => {
        failures += 1;
      },
      finalise: async () => {
        finalisations += 1;
      },
    });
    assert.equal(result.notificationSucceeded, false);
    assert.equal(failures, 1);
    assert.equal(finalisations, 1);
  });

  test("finalisation failures remain retryable to the caller", async () => {
    await assert.rejects(
      runPostPaymentRecovery({
        attemptNotification: async () => undefined,
        recordNotificationFailure: async () => undefined,
        finalise: async () => {
          throw new Error("[transient] finalisation failed");
        },
      }),
      /finalisation failed/,
    );
  });
});

describe("checkout crash and event-order recovery", () => {
  test("reuses a live unbound reservation after a process crash", () => {
    assert.equal(
      shouldReuseUnboundCheckoutReservation({
        status: "pending",
        stripeSessionId: null,
        reservationExpiresAt: "2026-08-20T12:15:00Z",
        createdAt: "2026-08-20T12:00:00Z",
        nowMs: Date.parse("2026-08-20T12:05:00Z"),
      }),
      true,
    );
  });

  test("replays an expired unbound reservation instead of risking an orphan", () => {
    assert.equal(
      shouldReuseUnboundCheckoutReservation({
        status: "pending",
        stripeSessionId: null,
        reservationExpiresAt: "2026-08-20T12:15:00Z",
        createdAt: "2026-08-20T12:00:00Z",
        nowMs: Date.parse("2026-08-20T12:16:00Z"),
      }),
      true,
    );
  });

  test("a late expiry event cannot downgrade a verified paid order", () => {
    assert.equal(
      shouldApplyCheckoutExpiry({
        orderStatus: "paid",
        paymentVerifiedAt: "2026-08-20T12:10:00Z",
      }),
      false,
    );
    assert.equal(
      shouldApplyCheckoutExpiry({
        orderStatus: "pending",
        paymentVerifiedAt: null,
      }),
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// Metadata extraction — extractSessionMetadata
// ---------------------------------------------------------------------------

describe("extractSessionMetadata", () => {
  test("extracts all canonical fields including version_id", () => {
    const m = extractSessionMetadata({
      book_id: "book_abc",
      user_id: "user_xyz",
      version_id: "ver_001",
      is_gift: "true",
      gift_recipient_email: "gift@example.com",
      gift_recipient_name: "Alice",
    });
    assert.equal(m.bookId, "book_abc");
    assert.equal(m.userId, "user_xyz");
    assert.equal(m.versionId, "ver_001");
    assert.equal(m.isGift, true);
    assert.equal(m.giftRecipientEmail, "gift@example.com");
    assert.equal(m.giftRecipientName, "Alice");
  });

  test("returns nulls for absent fields", () => {
    const m = extractSessionMetadata({});
    assert.equal(m.bookId, null);
    assert.equal(m.userId, null);
    assert.equal(m.versionId, null);
    assert.equal(m.isGift, false);
    assert.equal(m.giftRecipientEmail, null);
    assert.equal(m.giftRecipientName, null);
  });

  test("handles null metadata gracefully", () => {
    const m = extractSessionMetadata(null);
    assert.equal(m.bookId, null);
    assert.equal(m.isGift, false);
  });

  test("is_gift false when not exactly 'true'", () => {
    assert.equal(extractSessionMetadata({ is_gift: "false" }).isGift, false);
    assert.equal(extractSessionMetadata({ is_gift: "1" }).isGift, false);
    assert.equal(extractSessionMetadata({ is_gift: "TRUE" }).isGift, false);
  });
});

// ---------------------------------------------------------------------------
// Payment verification — verifySessionPayment
// ---------------------------------------------------------------------------

describe("verifySessionPayment", () => {
  const paid = {
    payment_status: "paid" as const,
    amount_total: 999,
    currency: "usd",
  };

  test("accepts a paid session with matching amount and currency from order", () => {
    const r = verifySessionPayment({
      session: paid,
      expectedAmountCents: 999,
      expectedCurrency: "usd",
    });
    assert.equal(r.verified, true);
  });

  test("rejects non-paid payment_status", () => {
    const r = verifySessionPayment({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: { ...paid, payment_status: "unpaid" as any },
    });
    assert.equal(r.verified, false);
    assert.ok(r.reason?.includes("payment_status"));
  });

  test("rejects amount mismatch against order.amount_cents", () => {
    const r = verifySessionPayment({
      session: paid,
      expectedAmountCents: 1999,
    });
    assert.equal(r.verified, false);
    assert.ok(r.reason?.includes("amount_total"));
  });

  test("rejects currency mismatch against order.currency", () => {
    const r = verifySessionPayment({
      session: paid,
      expectedCurrency: "gbp",
    });
    assert.equal(r.verified, false);
    assert.ok(r.reason?.includes("currency"));
  });

  test("currency comparison is case-insensitive", () => {
    const r = verifySessionPayment({ session: paid, expectedCurrency: "USD" });
    assert.equal(r.verified, true);
  });

  test("passes without optional constraints", () => {
    const r = verifySessionPayment({ session: paid });
    assert.equal(r.verified, true);
  });

  test("rejects null payment_status", () => {
    const r = verifySessionPayment({
      session: { payment_status: null, amount_total: 999, currency: "usd" },
    });
    assert.equal(r.verified, false);
  });
});

// ---------------------------------------------------------------------------
// Exact identity verification — verifyExactIdentity
// ---------------------------------------------------------------------------

describe("verifyExactIdentity", () => {
  const goodMeta = {
    bookId: "book_1",
    orderId: "order_1",
    userId: "user_1",
    buyerIdentity: "user:user_1",
    versionId: "ver_1",
    isGift: false,
    giftRecipientEmail: null,
    giftRecipientName: null,
  };

  const goodOrder = {
    id: "order_1",
    user_id: "user_1",
    status: "pending",
    book_id: "book_1",
    version_id: "ver_1",
    amount_cents: 999,
    currency: "usd",
  };

  const goodBook = {
    id: "book_1",
    user_id: "user_1",
    lifecycle_stage: "Ready for Purchase",
    approved_version_id: "ver_1",
  };

  test("verifies fully matching identity", () => {
    const r = verifyExactIdentity({
      sessionMeta: goodMeta,
      order: goodOrder,
      book: goodBook,
    });
    assert.equal(r.verified, true);
  });

  test("verifies an anonymous exact-version buyer claim", () => {
    const result = verifyExactIdentity({
      sessionMeta: {
        ...goodMeta,
        userId: null,
        buyerIdentity: "anon:hashed-email",
      },
      order: {
        ...goodOrder,
        user_id: null,
        purchaser_email: "buyer@example.test",
      },
      book: goodBook,
    });
    assert.equal(result.verified, true);
  });

  test("rejects an anonymous order without an anonymous buyer claim", () => {
    const result = verifyExactIdentity({
      sessionMeta: {
        ...goodMeta,
        userId: null,
        buyerIdentity: null,
      },
      order: {
        ...goodOrder,
        user_id: null,
        purchaser_email: "buyer@example.test",
      },
      book: goodBook,
    });
    assert.equal(result.verified, false);
  });

  test("rejects missing book_id in metadata", () => {
    const r = verifyExactIdentity({
      sessionMeta: { ...goodMeta, bookId: null },
      order: goodOrder,
      book: goodBook,
    });
    assert.equal(r.verified, false);
  });

  test("rejects user_id mismatch between session and order", () => {
    const r = verifyExactIdentity({
      sessionMeta: { ...goodMeta, userId: "user_X" },
      order: goodOrder,
      book: goodBook,
    });
    assert.equal(r.verified, false);
    assert.ok(r.reason?.includes("user_id"));
  });

  test("rejects book_id mismatch between session and order", () => {
    const r = verifyExactIdentity({
      sessionMeta: { ...goodMeta, bookId: "book_other" },
      order: { ...goodOrder, book_id: "book_1" },
      book: goodBook,
    });
    assert.equal(r.verified, false);
    assert.ok(r.reason?.includes("book_id"));
  });

  test("rejects version_id mismatch between session and order", () => {
    const r = verifyExactIdentity({
      sessionMeta: { ...goodMeta, versionId: "ver_X" },
      order: { ...goodOrder, version_id: "ver_1" },
      book: goodBook,
    });
    assert.equal(r.verified, false);
    assert.ok(r.reason?.includes("version_id"));
  });

  test("rejects book not at 'Ready for Purchase' stage", () => {
    const r = verifyExactIdentity({
      sessionMeta: goodMeta,
      order: goodOrder,
      book: { ...goodBook, lifecycle_stage: "Approved" },
    });
    assert.equal(r.verified, false);
    assert.ok(r.reason?.includes("Ready for Purchase"));
  });

  test("rejects book approved_version_id mismatch", () => {
    const r = verifyExactIdentity({
      sessionMeta: goodMeta,
      order: goodOrder,
      book: { ...goodBook, approved_version_id: "ver_other" },
    });
    assert.equal(r.verified, false);
    assert.ok(r.reason?.includes("approved_version_id"));
  });

  test("rejects missing order", () => {
    const r = verifyExactIdentity({
      sessionMeta: goodMeta,
      order: null,
      book: goodBook,
    });
    assert.equal(r.verified, false);
  });

  test("rejects missing book", () => {
    const r = verifyExactIdentity({
      sessionMeta: goodMeta,
      order: goodOrder,
      book: null,
    });
    assert.equal(r.verified, false);
  });
});

// ---------------------------------------------------------------------------
// Email delivery guards
// ---------------------------------------------------------------------------

describe("shouldSendPurchaseConfirmation", () => {
  test("true when purchase_confirmation_sent_at is null", () => {
    assert.equal(
      shouldSendPurchaseConfirmation({ purchase_confirmation_sent_at: null }),
      true
    );
  });

  test("false when purchase_confirmation_sent_at is set", () => {
    assert.equal(
      shouldSendPurchaseConfirmation({
        purchase_confirmation_sent_at: "2026-08-04T00:00:00Z",
      }),
      false
    );
  });

  test("false for null order", () => {
    assert.equal(shouldSendPurchaseConfirmation(null), false);
  });

  test("simulated idempotent confirmation — exactly one send", () => {
    let order: { purchase_confirmation_sent_at: string | null } = {
      purchase_confirmation_sent_at: null,
    };
    let sends = 0;
    for (let i = 0; i < 3; i++) {
      if (shouldSendPurchaseConfirmation(order)) {
        sends++;
        order = { purchase_confirmation_sent_at: new Date().toISOString() };
      }
    }
    assert.equal(sends, 1, "exactly one confirmation should be sent");
    assert.ok(order.purchase_confirmation_sent_at !== null);
  });
});

describe("shouldSendDelivery", () => {
  test("true when fulfilled_at is null", () => {
    assert.equal(shouldSendDelivery({ fulfilled_at: null }), true);
  });

  test("false when fulfilled_at is set", () => {
    assert.equal(
      shouldSendDelivery({ fulfilled_at: "2026-08-04T00:00:00Z" }),
      false
    );
  });

  test("false for null order", () => {
    assert.equal(shouldSendDelivery(null), false);
  });

  test("simulated idempotent delivery — exactly one send", () => {
    let order: { fulfilled_at: string | null } = { fulfilled_at: null };
    let deliveries = 0;
    for (let i = 0; i < 3; i++) {
      if (shouldSendDelivery(order)) {
        deliveries++;
        order = { fulfilled_at: new Date().toISOString() };
      }
    }
    assert.equal(deliveries, 1, "exactly one delivery email should be sent");
    assert.ok(order.fulfilled_at !== null);
  });
});

// ---------------------------------------------------------------------------
// Lifecycle stage ordering — title-cased canonical stages
// ---------------------------------------------------------------------------

describe("lifecycleStageIndex", () => {
  test("all canonical title-cased stages have unique, ascending indices", () => {
    const indices = BOOK_LIFECYCLE_STAGES.map((s) => lifecycleStageIndex(s));
    // All must be non-negative (found in the array).
    for (let i = 0; i < indices.length; i++) {
      assert.ok(
        indices[i] >= 0,
        `Stage "${BOOK_LIFECYCLE_STAGES[i]}" should be in BOOK_LIFECYCLE_STAGES`
      );
    }
    // Indices must be strictly ascending.
    for (let i = 1; i < indices.length; i++) {
      assert.ok(
        indices[i] > indices[i - 1],
        `"${BOOK_LIFECYCLE_STAGES[i]}" (idx ${indices[i]}) must be > "${BOOK_LIFECYCLE_STAGES[i - 1]}" (idx ${indices[i - 1]})`
      );
    }
  });

  test("unknown stage returns -1", () => {
    assert.equal(lifecycleStageIndex("totally_unknown"), -1);
    assert.equal(lifecycleStageIndex(""), -1);
    assert.equal(lifecycleStageIndex("purchased"), -1); // lowercase ≠ "Purchased"
  });

  test("stages are exactly title-cased — case-sensitive", () => {
    // "purchased" (lowercase) is NOT in the canonical list.
    assert.equal(lifecycleStageIndex("purchased"), -1);
    // "Purchased" (title-case) IS in the list.
    assert.ok(lifecycleStageIndex("Purchased") >= 0);
  });

  test("'Ready for Purchase' precedes 'Purchased'", () => {
    const rfp = lifecycleStageIndex("Ready for Purchase");
    const pur = lifecycleStageIndex("Purchased");
    assert.ok(rfp >= 0 && pur >= 0 && rfp < pur);
  });

  test("'Purchased' precedes 'Delivered'", () => {
    const pur = lifecycleStageIndex("Purchased");
    const del = lifecycleStageIndex("Delivered");
    assert.ok(pur >= 0 && del >= 0 && pur < del);
  });
});
