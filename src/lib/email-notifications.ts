/**
 * Outbound email notifications for the book lifecycle.
 *
 * Uses the provider-agnostic email-provider abstraction so callers receive a
 * concrete SendResult they can act on.  Callers MUST check result.sent before
 * recording delivery — never mark something delivered when the send did not
 * happen.
 *
 * Non-production is always non-networking. Suppressed/captured attempts resolve
 * to sent:false so callers cannot mistake acceptance into a test adapter for
 * provider delivery.
 */

import { sendEmail } from "@/lib/email-provider";
import type { SendResult } from "@/lib/email-provider";
import { getAppUrl } from "@/lib/utils";

// Re-export so callers can inspect the result type without a second import.
export type { SendResult };

// ---------------------------------------------------------------------------
// Param types
// ---------------------------------------------------------------------------

export interface PurchaseConfirmationParams {
  /** Buyer's email address */
  email: string;
  /** Buyer's display name */
  buyerName: string;
  /** Child's name */
  childName: string;
  /** Book ID */
  bookId: string;
  /** Dashboard URL (or preview URL if available) */
  dashboardUrl?: string | null;
}

export interface InvitationEmailParams {
  /** Buyer's email address */
  email: string;
  /** Buyer's display name */
  buyerName: string;
  /** Child's name */
  childName: string;
  /** Book ID */
  bookId: string;
  /** Full preview URL — CTA takes buyer here to view and complete their purchase */
  previewUrl: string;
}

export interface DeliveryEmailParams {
  /** Recipient's email address */
  email: string;
  /** Recipient's display name */
  recipientName: string;
  /** Child's name */
  childName: string;
  /** Book ID */
  bookId: string;
  /** Full-access book URL (online reader) */
  bookUrl: string;
  /** Optional PDF download URL */
  pdfUrl?: string | null;
}

export interface PreviewEmailParams {
  email: string;
  childName: string;
  bookId: string;
}

export interface BookReadyEmailParams {
  email: string;
  childName: string;
  bookId: string;
  pdfUrl?: string | null;
}

// ---------------------------------------------------------------------------
// Send helpers
// ---------------------------------------------------------------------------

/**
 * Sends the purchase confirmation email immediately after a successful payment.
 *
 * Copy confirms the purchase was successful and the book is unlocked/purchased.
 * Does not mention any review or moderation step in the subject line.
 *
 * Returns the provider SendResult so the caller can decide whether to record
 * purchase_confirmation_sent_at. Only record it when result.sent === true.
 */
export async function sendPurchaseConfirmationEmail(
  params: PurchaseConfirmationParams
): Promise<SendResult> {
  const appUrl = getAppUrl();

  return sendEmail({
    to: params.email,
    subject: `🎉 ${params.childName}'s book is purchased and unlocked!`,
    html: purchaseConfirmationHtml({
      buyerName: params.buyerName,
      childName: params.childName,
      dashboardUrl: params.dashboardUrl || `${appUrl}/dashboard`,
      appUrl,
    }),
  });
}

/**
 * Sends the invitation email once the admin has approved the preview.
 *
 * CTA: EXACT TEXT "Preview and Complete Your Purchase"
 *
 * Returns the provider SendResult.
 */
export async function sendInvitationEmail(
  params: InvitationEmailParams
): Promise<SendResult> {
  return sendEmail({
    to: params.email,
    subject: `✨ ${params.childName}'s storybook preview is ready!`,
    html: invitationEmailHtml({
      buyerName: params.buyerName,
      childName: params.childName,
      previewUrl: params.previewUrl,
    }),
  });
}

/**
 * Sends the full-access delivery email after the complete book is generated.
 *
 * Must only be called after shouldSendDelivery() returns true and the caller
 * has atomically set fulfilled_at. Returns the provider SendResult.
 */
export async function sendDeliveryEmail(
  params: DeliveryEmailParams
): Promise<SendResult> {
  return sendEmail({
    to: params.email,
    subject: `🎉 ${params.childName}'s complete storybook is ready to read!`,
    html: deliveryEmailHtml({
      recipientName: params.recipientName,
      childName: params.childName,
      bookUrl: params.bookUrl,
      pdfUrl: params.pdfUrl,
    }),
  });
}

/**
 * Preview-ready email (used by the book pipeline after preview generation).
 * Returns the provider SendResult.
 */
export async function sendPreviewReadyEmail({
  email,
  childName,
  bookId,
}: PreviewEmailParams): Promise<SendResult> {
  const appUrl = getAppUrl();
  const previewUrl = `${appUrl}/preview/${bookId}`;

  return sendEmail({
    to: email,
    subject: `✨ ${childName}'s storybook preview is ready!`,
    html: previewEmailHtml({ childName, previewUrl }),
  });
}

/**
 * Book-ready email (used by the book pipeline after full generation).
 * Returns the provider SendResult.
 */
export async function sendBookReadyEmail({
  email,
  childName,
  bookId,
  pdfUrl,
}: BookReadyEmailParams): Promise<SendResult> {
  const appUrl = getAppUrl();
  const bookUrl = `${appUrl}/preview/${bookId}`;

  return sendEmail({
    to: email,
    subject: `🎉 ${childName}'s complete storybook is ready to read!`,
    html: bookReadyEmailHtml({ childName, bookUrl, pdfUrl }),
  });
}

// ---------------------------------------------------------------------------
// HTML templates
// ---------------------------------------------------------------------------

function purchaseConfirmationHtml(data: {
  buyerName: string;
  childName: string;
  dashboardUrl: string;
  appUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFFBF5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF5;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10)">

        <tr><td style="background:linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);padding:44px 40px 36px;text-align:center">
          <p style="margin:0 0 10px;color:rgba(255,255,255,0.80);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif">Starmee Stories</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;line-height:1.25">Your book is purchased! 🎉</h1>
        </td></tr>

        <tr><td style="padding:36px 40px 32px">
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">Hi ${data.buyerName}!</p>
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">
            Thank you for your purchase — <strong>${data.childName}'s</strong> personalised storybook is now purchased and unlocked for your account!
          </p>
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">
            We're putting the finishing touches on the full book now. You'll receive another email the moment it's ready to download — usually within a few minutes.
          </p>

          <div style="background:#F5F3FF;border-left:4px solid #7C3AED;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0">
            <p style="margin:0;font-size:14px;color:#4B5563;line-height:1.6">
              💜 You can preview the first pages of <strong>${data.childName}'s</strong> story in your dashboard right now.
            </p>
          </div>

          <div style="text-align:center;margin:24px 0;">
            <a href="${data.dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:600;font-family:Arial,sans-serif">
              Go to My Dashboard →
            </a>
          </div>
        </td></tr>

        <tr><td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #F3F4F6">
          <p style="margin:0;font-size:12px;color:#9CA3AF;font-family:Arial,sans-serif;line-height:1.6">
            Starmee Stories · Personalised storybooks for every child<br>
            Questions? Reply to this email or contact us at hello@starmeestories.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function invitationEmailHtml(data: {
  buyerName: string;
  childName: string;
  previewUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${data.childName}'s storybook preview</title>
</head>
<body style="margin:0;padding:0;background:#FFFBF5;font-family:Georgia,'Times New Roman',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF5;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10)">

        <tr><td style="background:linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);padding:44px 40px 36px;text-align:center">
          <p style="margin:0 0 10px;color:rgba(255,255,255,0.80);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif">Starmee</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;line-height:1.25">${data.childName}'s story is ready! ✨</h1>
        </td></tr>

        <tr><td style="padding:36px 40px 32px">
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">Hi ${data.buyerName}!</p>
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">
            We've finished creating <strong>${data.childName}'s</strong> personalised storybook — a unique story written just for them, with custom illustrations where they're the star.
          </p>
          <p style="margin:0 0 28px;font-size:16px;color:#374151;line-height:1.65">
            Click below to view your preview and confirm you're happy before we complete the full book:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${data.previewUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#ffffff;text-decoration:none;font-size:17px;font-weight:bold;padding:17px 44px;border-radius:12px;font-family:Arial,sans-serif;letter-spacing:0.3px">
                Preview and Complete Your Purchase
              </a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;text-align:center;font-family:Arial,sans-serif">
            Or paste this link in your browser:<br>
            <a href="${data.previewUrl}" style="color:#7C3AED;word-break:break-all">${data.previewUrl}</a>
          </p>
        </td></tr>

        <tr><td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #F3F4F6">
          <p style="margin:0;font-size:12px;color:#9CA3AF;font-family:Arial,sans-serif;line-height:1.6">
            Starmee · Personalised storybooks for every child<br>
            You received this because you purchased a story at starmeestories.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function deliveryEmailHtml(data: {
  recipientName: string;
  childName: string;
  bookUrl: string;
  pdfUrl?: string | null;
}): string {
  const pdfButton = data.pdfUrl
    ? `<p style="margin:16px 0 0;text-align:center">
        <a href="${data.pdfUrl}" style="font-size:15px;color:#7C3AED;font-family:Arial,sans-serif;font-weight:600;text-decoration:underline">
          Download PDF &rarr;
        </a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${data.childName}'s complete storybook</title>
</head>
<body style="margin:0;padding:0;background:#FFFBF5;font-family:Georgia,'Times New Roman',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF5;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10)">

        <tr><td style="background:linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);padding:44px 40px 36px;text-align:center">
          <p style="margin:0 0 10px;color:rgba(255,255,255,0.80);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif">Starmee</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;line-height:1.25">🎉 ${data.childName}'s book is complete!</h1>
        </td></tr>

        <tr><td style="padding:36px 40px 32px">
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">Hi ${data.recipientName}!</p>
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">
            Great news — <strong>${data.childName}'s</strong> personalised storybook is fully illustrated and ready to enjoy! Every page has been brought to life with beautiful artwork.
          </p>
          <p style="margin:0 0 28px;font-size:16px;color:#374151;line-height:1.65">
            Read it online or download the PDF to print and keep forever:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${data.bookUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#ffffff;text-decoration:none;font-size:17px;font-weight:bold;padding:17px 44px;border-radius:12px;font-family:Arial,sans-serif;letter-spacing:0.3px">
                Read the Full Book &rarr;
              </a>
            </td></tr>
          </table>

          ${pdfButton}
        </td></tr>

        <tr><td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #F3F4F6">
          <p style="margin:0;font-size:12px;color:#9CA3AF;font-family:Arial,sans-serif;line-height:1.6">
            Starmee · Personalised storybooks for every child<br>
            You received this because you purchased a story at starmeestories.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function previewEmailHtml({
  childName,
  previewUrl,
}: {
  childName: string;
  previewUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${childName}'s storybook preview</title>
</head>
<body style="margin:0;padding:0;background:#FFFBF5;font-family:Georgia,'Times New Roman',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF5;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10)">

        <tr><td style="background:linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);padding:44px 40px 36px;text-align:center">
          <p style="margin:0 0 10px;color:rgba(255,255,255,0.80);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif">Starmee</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;line-height:1.25">${childName}'s story preview is ready! ✨</h1>
        </td></tr>

        <tr><td style="padding:36px 40px 32px">
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">Hi there!</p>
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">
            We've finished creating <strong>${childName}'s</strong> personalised storybook preview — a unique story written just for them, with custom illustrations where they're the star.
          </p>
          <p style="margin:0 0 28px;font-size:16px;color:#374151;line-height:1.65">
            Click below to read the first 3 illustrated pages for free:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${previewUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#ffffff;text-decoration:none;font-size:17px;font-weight:bold;padding:17px 44px;border-radius:12px;font-family:Arial,sans-serif;letter-spacing:0.3px">
                Read the Preview &rarr;
              </a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;text-align:center;font-family:Arial,sans-serif">
            Or paste this link in your browser:<br>
            <a href="${previewUrl}" style="color:#7C3AED;word-break:break-all">${previewUrl}</a>
          </p>
        </td></tr>

        <tr><td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #F3F4F6">
          <p style="margin:0;font-size:12px;color:#9CA3AF;font-family:Arial,sans-serif;line-height:1.6">
            Starmee · Personalised storybooks for every child<br>
            You received this because you created a story at starmeestories.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function bookReadyEmailHtml({
  childName,
  bookUrl,
  pdfUrl,
}: {
  childName: string;
  bookUrl: string;
  pdfUrl?: string | null;
}): string {
  const pdfButton = pdfUrl
    ? `<p style="margin:16px 0 0;text-align:center">
        <a href="${pdfUrl}" style="font-size:15px;color:#7C3AED;font-family:Arial,sans-serif;font-weight:600;text-decoration:underline">
          Download PDF &rarr;
        </a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${childName}'s complete storybook</title>
</head>
<body style="margin:0;padding:0;background:#FFFBF5;font-family:Georgia,'Times New Roman',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF5;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10)">

        <tr><td style="background:linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);padding:44px 40px 36px;text-align:center">
          <p style="margin:0 0 10px;color:rgba(255,255,255,0.80);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif">Starmee</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;line-height:1.25">🎉 ${childName}'s book is complete!</h1>
        </td></tr>

        <tr><td style="padding:36px 40px 32px">
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">Hi there!</p>
          <p style="margin:0 0 18px;font-size:16px;color:#374151;line-height:1.65">
            Great news — <strong>${childName}'s</strong> personalised storybook is fully illustrated and ready to enjoy! Every page has been brought to life with beautiful artwork.
          </p>
          <p style="margin:0 0 28px;font-size:16px;color:#374151;line-height:1.65">
            Read it online or download the PDF to print and keep forever:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${bookUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#ffffff;text-decoration:none;font-size:17px;font-weight:bold;padding:17px 44px;border-radius:12px;font-family:Arial,sans-serif;letter-spacing:0.3px">
                Read the Full Book &rarr;
              </a>
            </td></tr>
          </table>

          ${pdfButton}
        </td></tr>

        <tr><td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #F3F4F6">
          <p style="margin:0;font-size:12px;color:#9CA3AF;font-family:Arial,sans-serif;line-height:1.6">
            Starmee · Personalised storybooks for every child<br>
            You received this because you purchased a story at starmeestories.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
