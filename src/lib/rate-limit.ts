/**
 * Sliding-window rate limiter for the public, no-login preview endpoint.
 *
 * /create is reachable without an account and every submission costs money at
 * the AI provider, so an unmetered endpoint is both a cost risk and an abuse
 * vector. This keeps a per-key list of recent hit timestamps in memory.
 *
 * Scope: per server instance. Replit autoscale may run more than one instance,
 * so the effective limit is (limit x instances). That is acceptable as a first
 * line of defence; a shared store would be needed for a hard global cap.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the caller may retry. 0 when allowed. */
  retryAfterSeconds: number;
}

const buckets = new Map<string, number[]>();

/** Default: 5 previews per hour per key. */
export const PREVIEW_LIMIT = Number(process.env.PREVIEW_RATE_LIMIT || 5);
export const PREVIEW_WINDOW_MS = 60 * 60 * 1000;

/**
 * Record a hit and decide whether it is allowed.
 * `now` is injectable so the behaviour can be unit tested deterministically.
 */
export function checkRateLimit(
  key: string,
  limit: number = PREVIEW_LIMIT,
  windowMs: number = PREVIEW_WINDOW_MS,
  now: number = Date.now(),
): RateLimitResult {
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) || []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    const oldest = hits[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, hits);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, remaining: Math.max(0, limit - hits.length), retryAfterSeconds: 0 };
}

/** Test helper - clears all counters. */
export function __resetRateLimits(): void {
  buckets.clear();
}

/**
 * Best-effort client identity. Replit sits behind a proxy, so x-forwarded-for
 * is the real client; fall back to a constant so the limiter still applies.
 */
export function clientKeyFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
