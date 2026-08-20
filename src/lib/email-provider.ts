/**
 * Starmee outbound email.
 *
 * Deliberately provider-agnostic. No provider key is configured yet, so every
 * send returns { sent: false, reason: "not_configured" } instead of throwing.
 * Callers MUST treat a false result as "not delivered" and keep the order in a
 * state a human can act on - we never mark something delivered we did not send.
 *
 * To go live, set SENDGRID_API_KEY (and optionally EMAIL_FROM). Resend is not
 * usable on this domain: DreamHost cannot create the subdomain MX record it
 * requires. SendGrid, Brevo and Postmark all work with CNAME/TXT only.
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

function fromAddress(): string {
  return process.env.EMAIL_FROM || "hello@starmeestories.com";
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY);
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

  if (!isEmailConfigured()) {
    console.warn(
      "[email] Not configured - skipping send to " + msg.to + " (" + msg.subject + "). " +
        "Set SENDGRID_API_KEY to enable delivery.",
    );
    return { sent: false, reason: "not_configured" };
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
