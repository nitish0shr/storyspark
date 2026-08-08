import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, __resetRateLimits, clientKeyFromHeaders } from "@/lib/rate-limit";

describe("public preview rate limiting", () => {
  beforeEach(() => __resetRateLimits());

  test("allows up to the limit then blocks", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) {
      assert.equal(checkRateLimit("ip-a", 3, 60_000, now).allowed, true, "hit " + i);
    }
    const blocked = checkRateLimit("ip-a", 3, 60_000, now);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSeconds > 0);
  });

  test("counts each client separately", () => {
    const now = 1_000_000;
    checkRateLimit("ip-a", 1, 60_000, now);
    assert.equal(checkRateLimit("ip-a", 1, 60_000, now).allowed, false);
    assert.equal(checkRateLimit("ip-b", 1, 60_000, now).allowed, true);
  });

  test("allows again once the window slides past", () => {
    const now = 1_000_000;
    checkRateLimit("ip-c", 1, 60_000, now);
    assert.equal(checkRateLimit("ip-c", 1, 60_000, now).allowed, false);
    assert.equal(checkRateLimit("ip-c", 1, 60_000, now + 60_001).allowed, true);
  });

  test("reports remaining budget", () => {
    const now = 2_000_000;
    assert.equal(checkRateLimit("ip-d", 2, 60_000, now).remaining, 1);
    assert.equal(checkRateLimit("ip-d", 2, 60_000, now).remaining, 0);
  });

  test("derives the client key from proxy headers", () => {
    assert.equal(clientKeyFromHeaders(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })), "1.2.3.4");
    assert.equal(clientKeyFromHeaders(new Headers({ "x-real-ip": "9.9.9.9" })), "9.9.9.9");
    assert.equal(clientKeyFromHeaders(new Headers()), "unknown");
  });
});
