import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { decideCheckoutProcessing, TERMINAL_ORDER_STATES } from "@/lib/webhook-idempotency";

describe("stripe webhook replay protection", () => {
  test("processes a pending order exactly once", () => {
    const d = decideCheckoutProcessing({ sessionId: "cs_1", order: { id: "o1", status: "pending" } });
    assert.equal(d.process, true);
  });

  test("refuses a redelivered event once the order is paid", () => {
    const d = decideCheckoutProcessing({ sessionId: "cs_1", order: { id: "o1", status: "paid" } });
    assert.equal(d.process, false);
    if (d.process === false) {
      assert.equal(d.reason, "already_processed");
      assert.match(d.detail, /already paid/);
    }
  });

  test("treats every terminal state as already processed", () => {
    for (const status of TERMINAL_ORDER_STATES) {
      const d = decideCheckoutProcessing({ sessionId: "cs_x", order: { id: "o", status } });
      assert.equal(d.process, false, status + " should not reprocess");
    }
  });

  test("refuses to apply a payment to an unknown order", () => {
    const d = decideCheckoutProcessing({ sessionId: "cs_missing", order: null });
    assert.equal(d.process, false);
    if (d.process === false) assert.equal(d.reason, "no_order");
  });

  test("a failed order can still be retried", () => {
    const d = decideCheckoutProcessing({ sessionId: "cs_2", order: { id: "o2", status: "failed" } });
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
