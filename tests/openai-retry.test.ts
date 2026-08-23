/**
 * Unit tests for the OpenAI transient-retry helpers in src/lib/openai.ts.
 *
 * No real OpenAI calls are made — all tests use synthetic error objects that
 * mimic what the OpenAI SDK produces.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  OPENAI_MAX_RETRIES,
  isTransientOpenAIError,
  isRetryableProviderError,
  RetryableProviderError,
  getOpenAIErrorDiagnostics,
} from "@/lib/openai";

// ─── isTransientOpenAIError ───────────────────────────────────────────────────

describe("isTransientOpenAIError", () => {
  test("returns true for HTTP 429", () => {
    assert.ok(isTransientOpenAIError({ status: 429, message: "rate limit" }));
  });

  test("returns true for HTTP 408", () => {
    assert.ok(isTransientOpenAIError({ status: 408, message: "timeout" }));
  });

  test("returns true for HTTP 500", () => {
    assert.ok(isTransientOpenAIError({ status: 500, message: "internal server error" }));
  });

  test("returns true for HTTP 503", () => {
    assert.ok(isTransientOpenAIError({ status: 503, message: "service unavailable" }));
  });

  test("returns false for HTTP 400 (bad request — not transient)", () => {
    assert.equal(isTransientOpenAIError({ status: 400, message: "bad request" }), false);
  });

  test("returns false for HTTP 401 (auth — not transient)", () => {
    assert.equal(isTransientOpenAIError({ status: 401, message: "unauthorized" }), false);
  });

  test("returns false for HTTP 404 (not found — not transient)", () => {
    assert.equal(isTransientOpenAIError({ status: 404, message: "not found" }), false);
  });

  test("returns true for network ECONNRESET", () => {
    assert.ok(isTransientOpenAIError(new Error("read ECONNRESET")));
  });

  test("returns true for fetch failed", () => {
    assert.ok(isTransientOpenAIError(new Error("fetch failed")));
  });

  test("returns true for socket hang up", () => {
    assert.ok(isTransientOpenAIError(new Error("socket hang up")));
  });

  test("returns false for null", () => {
    assert.equal(isTransientOpenAIError(null), false);
  });

  test("returns false for a plain string", () => {
    assert.equal(isTransientOpenAIError("some string"), false);
  });

  test("returns false for a non-transient Error with no status", () => {
    assert.equal(isTransientOpenAIError(new Error("Expected 12 pages but got 10")), false);
  });
});

// ─── RetryableProviderError ───────────────────────────────────────────────────

describe("RetryableProviderError", () => {
  const diagnostics = {
    status: 503,
    code: null,
    type: null,
    requestId: null,
    retryAfter: null,
    remainingRequests: null,
    remainingTokens: null,
    resetRequests: null,
    resetTokens: null,
  };

  test("is instanceof Error", () => {
    const err = new RetryableProviderError("msg", diagnostics);
    assert.ok(err instanceof Error);
  });

  test("name is RetryableProviderError", () => {
    const err = new RetryableProviderError("msg", diagnostics);
    assert.equal(err.name, "RetryableProviderError");
  });

  test("carries isRetryableProviderError flag", () => {
    const err = new RetryableProviderError("msg", diagnostics);
    assert.equal(err.isRetryableProviderError, true);
  });

  test("carries retryable and provider markers", () => {
    const err = new RetryableProviderError("msg", diagnostics);
    assert.equal(err.retryable, true);
    assert.equal(err.provider, "openai");
  });

  test("preserves diagnostics", () => {
    const err = new RetryableProviderError("wrapped", { ...diagnostics, status: 429 });
    assert.equal(err.diagnostics.status, 429);
  });
});

// ─── isRetryableProviderError ─────────────────────────────────────────────────

describe("isRetryableProviderError", () => {
  const diag = {
    status: 503, code: null, type: null, requestId: null, retryAfter: null,
    remainingRequests: null, remainingTokens: null, resetRequests: null, resetTokens: null,
  };

  test("true for RetryableProviderError instances", () => {
    assert.ok(isRetryableProviderError(new RetryableProviderError("msg", diag)));
  });

  test("true for duck-type objects with isRetryableProviderError flag", () => {
    assert.ok(isRetryableProviderError({ isRetryableProviderError: true }));
  });

  test("false for ordinary errors", () => {
    assert.equal(isRetryableProviderError(new Error("plain")), false);
  });

  test("false for null", () => {
    assert.equal(isRetryableProviderError(null), false);
  });
});

// ─── getOpenAIErrorDiagnostics ────────────────────────────────────────────────

describe("getOpenAIErrorDiagnostics", () => {
  test("extracts status, code, type from an OpenAI-style error", () => {
    const d = getOpenAIErrorDiagnostics({
      status: 429,
      code: "rate_limit_exceeded",
      type: "requests",
      message: "Too Many Requests",
    });
    assert.equal(d.status, 429);
    assert.equal(d.code, "rate_limit_exceeded");
    assert.equal(d.type, "requests");
  });

  test("reads retry-after from headers object", () => {
    const d = getOpenAIErrorDiagnostics({
      status: 429,
      message: "Too Many Requests",
      headers: { "retry-after": "30" },
    });
    assert.equal(d.retryAfter, "30");
  });

  test("reads safe request and rate-limit metadata from Headers", () => {
    const headers = new Headers({
      "x-request-id": "req_safe_123",
      "x-ratelimit-remaining-requests": "4",
      "x-ratelimit-remaining-tokens": "900",
      "x-ratelimit-reset-requests": "2s",
      "x-ratelimit-reset-tokens": "1s",
      authorization: "Bearer must-never-be-copied",
    });
    const d = getOpenAIErrorDiagnostics({ status: 429, headers });
    assert.equal(d.requestId, "req_safe_123");
    assert.equal(d.remainingRequests, "4");
    assert.equal(d.remainingTokens, "900");
    assert.equal(d.resetRequests, "2s");
    assert.equal(d.resetTokens, "1s");
    assert.equal("authorization" in d, false);
  });

  test("returns nulls for unknown error shapes", () => {
    const d = getOpenAIErrorDiagnostics(new Error("plain error"));
    assert.equal(d.status, null);
    assert.equal(d.code, null);
    assert.equal(d.retryAfter, null);
  });
});

describe("single OpenAI retry owner", () => {
  const openaiSource = readFileSync("src/lib/openai.ts", "utf8");
  const storySource = readFileSync("src/services/story-generation.ts", "utf8");
  const illustrationSource = readFileSync("src/services/illustration.ts", "utf8");

  test("uses a bounded SDK retry budget", () => {
    assert.equal(OPENAI_MAX_RETRIES, 3);
    assert.match(openaiSource, /maxRetries: OPENAI_MAX_RETRIES/);
  });

  test("has no application-level OpenAI retry wrapper", () => {
    const forbiddenName = ["with", "OpenAI", "Retry"].join("");
    assert.equal(openaiSource.includes(forbiddenName), false);
    assert.equal(storySource.includes(forbiddenName), false);
    assert.equal(illustrationSource.includes(forbiddenName), false);
  });

  test("story parse retry exits immediately on final transient SDK errors", () => {
    assert.match(storySource, /isTransientOpenAIError\(error\)/);
    assert.match(storySource, /toRetryableProviderError\(error, "chat\.completions\.create"\)/);
  });
});
