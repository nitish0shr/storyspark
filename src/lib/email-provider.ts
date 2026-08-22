/**
 * Starmee outbound email.
 *
 * Deliberately provider-agnostic and environment-safe:
 * - non-production is always non-networking (suppressed by default, or capture)
 * - production sends only when EMAIL_MODE=provider and SendGrid is ready
 * - every non-provider outcome returns sent:false
 * Callers MUST treat a false result as "not delivered" and keep the order in a
 * state a human can act on - we never mark something delivered we did not send.
 *
 * To go live, explicitly set EMAIL_MODE=provider, SENDGRID_API_KEY and
 * EMAIL_FROM in the production environment.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  sent: boolean;
  reason?: string;
  provider?: string;
  providerMessageId?: string;
}

export type EmailRuntimeMode =
  | "suppress"
  | "capture"
  | "provider"
  | "unavailable";

export interface EmailRuntimeState {
  mode: EmailRuntimeMode;
  reason: string;
}

export function getEmailRuntimeState(
  env: NodeJS.ProcessEnv = process.env,
): EmailRuntimeState {
  if (env.NODE_ENV !== "production") {
    return env.EMAIL_MODE === "capture"
      ? { mode: "capture", reason: "non_production_capture" }
      : { mode: "suppress", reason: "non_production_suppressed" };
  }
  if (env.EMAIL_MODE !== "provider") {
    return {
      mode: "unavailable",
      reason: "production_email_mode_not_provider",
    };
  }
  if (!env.SENDGRID_API_KEY || !env.EMAIL_FROM) {
    return {
      mode: "unavailable",
      reason: "production_email_provider_not_configured",
    };
  }
  return { mode: "provider", reason: "production_provider_ready" };
}

function fromAddress(): string {
  return process.env.EMAIL_FROM!;
}

export function isEmailConfigured(): boolean {
  return getEmailRuntimeState().mode === "provider";
}

/** Strip tags for a plain-text fallback part. */
function toPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function sendViaSendGrid(msg: EmailMessage): Promise<SendResult> {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.SENDGRID_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: msg.to }] }],
      from: { email: fromAddress(), name: "Starmee" },
      subject: msg.subject,
      content: [
        { type: "text/plain", value: msg.text || toPlainText(msg.html) },
        { type: "text/html", value: msg.html },
      ],
    }),
  });

  if (res.ok) {
    return {
      sent: true,
      provider: "sendgrid",
      providerMessageId: res.headers.get("x-message-id") ?? undefined,
    };
  }
  const body = await res.text().catch(() => "");
  return {
    sent: false,
    provider: "sendgrid",
    reason: "sendgrid_error_" + res.status + (body ? ": " + body.slice(0, 200) : ""),
  };
}

/**
 * Send an email. Never throws - always returns a result the caller can record.
 */
export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  if (!msg.to) return { sent: false, reason: "no_recipient" };

  const runtime = getEmailRuntimeState();
  if (runtime.mode !== "provider") {
    // Deliberately avoid logging recipient addresses or message contents.
    console.info(`[email] ${runtime.reason}; no provider request was made`);
    return {
      sent: false,
      provider: runtime.mode === "capture" ? "capture" : undefined,
      reason:
        runtime.mode === "capture"
          ? "captured_not_sent"
          : runtime.mode === "suppress"
            ? "suppressed_not_sent"
            : runtime.reason,
    };
  }

  try {
    return await sendViaSendGrid(msg);
  } catch (err) {
    return {
      sent: false,
      provider: "sendgrid",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
