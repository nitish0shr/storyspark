/**
 * Lightweight error monitoring — a Sentry stand-in for v1.
 *
 * Every call always logs to stdout (Railway captures).
 * In production, also sends an email to ADMIN_NOTIFICATION_EMAIL,
 * rate-limited to one per error kind per cooldown window so a burst
 * of identical errors doesn't blow up your inbox.
 *
 * Usage:
 *   import { logServerError } from "@/lib/monitor";
 *   try { ... } catch (err) {
 *     await logServerError("preview-generation", err, { bookId });
 *     throw err;
 *   }
 */

import { resend, RESEND_FROM_EMAIL, isResendConfigured } from "@/lib/resend";

// In-process dedupe map: kind → last alert timestamp (ms since epoch).
// Survives between requests (same Node process), reset on deploy.
const lastAlertedAt = new Map<string, number>();
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

export type ErrorContext = Record<string, string | number | boolean | null | undefined>;

export async function logServerError(
  kind: string,
  err: unknown,
  context: ErrorContext = {}
): Promise<void> {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  // 1. Always log — structured JSON so Railway's log search works.
  console.error(
    JSON.stringify({
      level: "error",
      kind,
      message,
      context,
      stack,
      timestamp: new Date().toISOString(),
    })
  );

  // 2. Alert email in production — rate limited per kind.
  if (process.env.NODE_ENV !== "production") return;

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail || !isResendConfigured()) return;

  const now = Date.now();
  const last = lastAlertedAt.get(kind) ?? 0;
  if (now - last < COOLDOWN_MS) return; // silenced, still rate-limited

  lastAlertedAt.set(kind, now);

  try {
    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: adminEmail,
      subject: `[Starmee error] ${kind}: ${message.slice(0, 80)}`,
      html: `<div style="font-family:ui-monospace,monospace;font-size:13px;">
        <h2 style="color:#b91c1c;margin:0 0 12px;">Starmee production error</h2>
        <p><strong>Kind:</strong> ${escapeHtml(kind)}</p>
        <p><strong>Message:</strong> ${escapeHtml(message)}</p>
        <p><strong>Context:</strong></p>
        <pre style="background:#f9fafb;padding:10px;border-radius:6px;overflow:auto;">${escapeHtml(
          JSON.stringify(context, null, 2)
        )}</pre>
        <p><strong>Stack:</strong></p>
        <pre style="background:#f9fafb;padding:10px;border-radius:6px;overflow:auto;">${escapeHtml(
          stack ?? "(no stack)"
        )}</pre>
        <p style="color:#6b7280;margin-top:16px;">
          Next alert for this kind suppressed for 10 min.
          Full timeline in Railway logs.
        </p>
      </div>`,
    });
  } catch (alertErr) {
    // Don't throw from the alerter — just log it.
    console.error("logServerError failed to send alert email:", alertErr);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
