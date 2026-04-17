import { NextRequest, NextResponse } from "next/server";
import { resend, RESEND_FROM_EMAIL, isResendConfigured } from "@/lib/resend";
import { getAppUrl } from "@/lib/utils";

type EmailType = "order_confirmation" | "gift_notification" | "preview_reminder";

interface OrderConfirmationData {
  buyerEmail: string;
  buyerName: string;
  childName: string;
  tier: string;
  bookId: string;
  pdfUrl?: string;
}

interface GiftNotificationData {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  childName: string;
  giftMessage?: string;
  bookId: string;
}

interface PreviewReminderData {
  email: string;
  childName: string;
  bookId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Simple auth check — only allow internal calls via a shared secret
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.INTERNAL_API_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body as { type: EmailType; data: Record<string, unknown> };

    if (!type || !data) {
      return NextResponse.json(
        { error: "type and data are required" },
        { status: 400 }
      );
    }

    if (!isResendConfigured()) {
      return NextResponse.json(
        { error: "Email service not configured. Set RESEND_API_KEY to enable emails." },
        { status: 503 }
      );
    }

    const appUrl = getAppUrl();

    switch (type) {
      case "order_confirmation": {
        const d = data as unknown as OrderConfirmationData;
        if (!d.buyerEmail) {
          return NextResponse.json(
            { error: "buyerEmail is required" },
            { status: 400 }
          );
        }

        const bookUrl = d.pdfUrl || `${appUrl}/checkout/success?book_id=${d.bookId}`;

        await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: d.buyerEmail,
          subject: `${d.childName}'s Starmee book is ready!`,
          html: buildOrderConfirmation({
            buyerName: d.buyerName || "there",
            childName: d.childName,
            tier: d.tier || "base",
            bookUrl,
            pdfUrl: d.pdfUrl || null,
            dashboardUrl: `${appUrl}/dashboard`,
          }),
        });

        return NextResponse.json({ sent: true });
      }

      case "gift_notification": {
        const d = data as unknown as GiftNotificationData;
        if (!d.recipientEmail) {
          return NextResponse.json(
            { error: "recipientEmail is required" },
            { status: 400 }
          );
        }

        await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: d.recipientEmail,
          subject: `You've received a Starmee book!`,
          html: buildGiftNotification({
            recipientName: d.recipientName || "Friend",
            senderName: d.senderName || "Someone special",
            childName: d.childName,
            giftMessage: d.giftMessage || null,
            bookUrl: `${appUrl}/gift/${d.bookId}`,
            appUrl,
          }),
        });

        return NextResponse.json({ sent: true });
      }

      case "preview_reminder": {
        const d = data as unknown as PreviewReminderData;
        if (!d.email) {
          return NextResponse.json(
            { error: "email is required" },
            { status: 400 }
          );
        }

        await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: d.email,
          subject: `${d.childName}'s adventure is waiting!`,
          html: buildPreviewReminder({
            childName: d.childName,
            previewUrl: `${appUrl}/preview/${d.bookId}`,
            appUrl,
          }),
        });

        return NextResponse.json({ sent: true });
      }

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Email route error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Email template helpers
// ---------------------------------------------------------------------------

function emailWrapper(headerTitle: string, headerSubtitle: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFFBF5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7C3AED,#EC4899);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">${headerTitle}</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">${headerSubtitle}</p>
    </div>
    <!-- Body -->
    <div style="background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #f0e6d6;border-top:none;">
      ${bodyHtml}
    </div>
    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;color:#9a9aaa;font-size:12px;">
      <p style="margin:0;">Made with love by Starmee</p>
    </div>
  </div>
</body>
</html>`;
}

function ctaButton(url: string, label: string): string {
  return `
    <div style="text-align:center;margin:24px 0;">
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:600;">
        ${label}
      </a>
    </div>`;
}

function buildOrderConfirmation(data: {
  buyerName: string;
  childName: string;
  tier: string;
  bookUrl: string;
  pdfUrl: string | null;
  dashboardUrl: string;
}): string {
  const pdfBlock = data.pdfUrl
    ? `<div style="text-align:center;margin:8px 0 24px;">
        <a href="${data.pdfUrl}" style="color:#7C3AED;font-size:14px;font-weight:600;text-decoration:underline;">
          Download PDF
        </a>
      </div>`
    : "";

  return emailWrapper(
    "Starmee",
    `${data.childName}'s book is ready!`,
    `
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Hi ${data.buyerName}!</h2>
      <p style="margin:0 0 16px;color:#4a4a5a;font-size:15px;line-height:1.6;">
        Great news! ${data.childName}'s personalized storybook has been created. You can view it in your browser or download the PDF to print at home.
      </p>
      ${ctaButton(data.bookUrl, "View Your Book")}
      ${pdfBlock}
      <p style="margin:24px 0 0;color:#9a9aaa;font-size:13px;text-align:center;">
        Your book is saved to your account at
        <a href="${data.dashboardUrl}" style="color:#7C3AED;">your dashboard</a>.
      </p>
    `
  );
}

function buildGiftNotification(data: {
  recipientName: string;
  senderName: string;
  childName: string;
  giftMessage: string | null;
  bookUrl: string;
  appUrl: string;
}): string {
  const giftBlock = data.giftMessage
    ? `<div style="background:#f8f0ff;border-left:4px solid #7C3AED;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p style="margin:0;color:#4a4a5a;font-size:14px;font-style:italic;line-height:1.6;">"${data.giftMessage}"</p>
        <p style="margin:8px 0 0;color:#7C3AED;font-size:13px;font-weight:600;">&mdash; ${data.senderName}</p>
      </div>`
    : "";

  return emailWrapper(
    "Starmee",
    "You've received a magical gift!",
    `
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Hi ${data.recipientName}!</h2>
      <p style="margin:0 0 16px;color:#4a4a5a;font-size:15px;line-height:1.6;">
        ${data.senderName} has gifted ${data.childName} a personalized storybook from Starmee!
        It's a beautifully illustrated story where ${data.childName} is the hero of their very own adventure.
      </p>
      ${giftBlock}
      ${ctaButton(data.bookUrl, "View the Book")}
      <p style="margin:24px 0 0;color:#9a9aaa;font-size:13px;text-align:center;">
        Want to create your own? <a href="${data.appUrl}" style="color:#7C3AED;">Get started here</a>.
      </p>
    `
  );
}

function buildPreviewReminder(data: {
  childName: string;
  previewUrl: string;
  appUrl: string;
}): string {
  return emailWrapper(
    "Starmee",
    `${data.childName}'s adventure awaits!`,
    `
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Don't forget about ${data.childName}'s story!</h2>
      <p style="margin:0 0 16px;color:#4a4a5a;font-size:15px;line-height:1.6;">
        We created a free preview of ${data.childName}'s personalized storybook and it's waiting for you.
        Come see ${data.childName} as the hero of an incredible adventure!
      </p>
      <p style="margin:0 0 24px;color:#4a4a5a;font-size:15px;line-height:1.6;">
        The full book includes all the pages, high-quality illustrations, and a downloadable PDF you can print or share.
      </p>
      ${ctaButton(data.previewUrl, "See the Preview")}
      <p style="margin:24px 0 0;color:#9a9aaa;font-size:13px;text-align:center;">
        Questions? Just reply to this email.
      </p>
    `
  );
}
