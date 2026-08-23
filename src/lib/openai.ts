import OpenAI from "openai";

let _openai: OpenAI | null = null;

/**
 * The OpenAI SDK is the single retry owner. It already applies bounded
 * exponential backoff with jitter and honours Retry-After for eligible errors.
 * Do not wrap SDK calls in another application retry loop.
 */
export const OPENAI_MAX_RETRIES = 3;

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export function getOpenAI(): OpenAI {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OpenAI is not configured. Set OPENAI_API_KEY to enable story generation."
      );
    }
    _openai = new OpenAI({
      apiKey: key,
      maxRetries: OPENAI_MAX_RETRIES,
    });
  }
  return _openai;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ─── Final error classification and safe diagnostics ─────────────────────────

export interface OpenAIErrorDiagnostics {
  status: number | null;
  code: string | null;
  type: string | null;
  requestId: string | null;
  retryAfter: string | null;
  remainingRequests: string | null;
  remainingTokens: string | null;
  resetRequests: string | null;
  resetTokens: string | null;
}

/**
 * Thrown when all retry attempts for a transient OpenAI error are exhausted.
 * Callers can catch this specifically to avoid falling through to fallback
 * models, placeholders, or false-completion paths.
 */
export class RetryableProviderError extends Error {
  readonly isRetryableProviderError = true as const;
  readonly retryable = true as const;
  readonly provider = "openai" as const;

  constructor(
    message: string,
    public readonly diagnostics: OpenAIErrorDiagnostics,
  ) {
    super(message);
    this.name = "RetryableProviderError";
  }
}

/**
 * Returns true for error shapes that are transient and worth retrying:
 *  - HTTP 429  (rate-limited)
 *  - HTTP 408  (request timeout)
 *  - HTTP 5xx  (server-side fault)
 *  - Network / connection errors (no status code)
 */
export function isTransientOpenAIError(err: unknown): boolean {
  if (err == null) return false;

  // OpenAI SDK wraps errors as APIError with a `status` field
  if (typeof err === "object") {
    const status = (err as Record<string, unknown>).status;
    if (typeof status === "number") {
      return status === 429 || status === 408 || status >= 500;
    }

    // Network-level errors: no HTTP status but recognisable messages
    const message =
      String(
        (err as Record<string, unknown>).message ??
          (err as Record<string, unknown>).code ??
          ""
      ).toLowerCase();
    if (
      message.includes("econnreset") ||
      message.includes("econnrefused") ||
      message.includes("etimedout") ||
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("socket hang up") ||
      message.includes("connection error")
    ) {
      return true;
    }
  }

  return false;
}

function readHeader(headers: unknown, name: string): string | null {
  if (!headers || typeof headers !== "object") return null;
  const maybeHeaders = headers as {
    get?: (key: string) => string | null;
    [key: string]: unknown;
  };
  if (typeof maybeHeaders.get === "function") {
    return maybeHeaders.get(name);
  }
  const value =
    maybeHeaders[name] ??
    maybeHeaders[name.toLowerCase()] ??
    maybeHeaders[name.toUpperCase()];
  return typeof value === "string" ? value : null;
}

/**
 * Keeps only provider metadata that is useful for pacing and support. Response
 * bodies, prompts, authorization headers, and API keys are deliberately absent.
 */
export function getOpenAIErrorDiagnostics(
  err: unknown,
): OpenAIErrorDiagnostics {
  const record =
    err && typeof err === "object"
      ? (err as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const headers = record.headers;
  const stringField = (key: string): string | null =>
    typeof record[key] === "string" ? String(record[key]) : null;

  return {
    status: typeof record.status === "number" ? record.status : null,
    code: stringField("code"),
    type: stringField("type"),
    requestId:
      stringField("request_id") ??
      stringField("requestId") ??
      readHeader(headers, "x-request-id"),
    retryAfter: readHeader(headers, "retry-after"),
    remainingRequests: readHeader(headers, "x-ratelimit-remaining-requests"),
    remainingTokens: readHeader(headers, "x-ratelimit-remaining-tokens"),
    resetRequests: readHeader(headers, "x-ratelimit-reset-requests"),
    resetTokens: readHeader(headers, "x-ratelimit-reset-tokens"),
  };
}

export function toRetryableProviderError(
  err: unknown,
  operation: string,
): RetryableProviderError {
  const diagnostics = getOpenAIErrorDiagnostics(err);
  return new RetryableProviderError(
    `OpenAI ${operation} remained temporarily unavailable after the SDK retry budget was exhausted`,
    diagnostics,
  );
}

export function isRetryableProviderError(
  err: unknown,
): err is RetryableProviderError {
  return (
    err instanceof RetryableProviderError ||
    Boolean(
      err &&
        typeof err === "object" &&
        (err as { isRetryableProviderError?: unknown })
          .isRetryableProviderError === true,
    )
  );
}
