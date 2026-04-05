import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend, RESEND_FROM_EMAIL } from "@/lib/resend";
import { generateFullBook } from "@/services/book-pipeline";
import { getAppUrl } from "@/lib/utils";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }

      case "checkout.session.expired": {
        await handleCheckoutExpired(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    // Return 200 so Stripe doesn't keep retrying
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 200 }
    );
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// checkout.session.completed
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const bookId = metadata.book_id;
  const userId = metadata.user_id;
  const tier = metadata.tier;
  const isGift = metadata.is_gift === "true";
  const giftRecipientEmail = metadata.gift_recipient_email || null;
  const giftRecipientName = metadata.gift_recipient_name || null;

  if (!bookId || !userId) {
    console.error("Missing book_id or user_id in session metadata");
    return;
  }

  // 1. Update order status to paid
  const { error: orderError } = await supabaseAdmin
    .from("orders")
    .update({
      status: "paid",
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null,
    })
    .eq("stripe_checkout_session_id", session.id);

  if (orderError) {
    console.error("Failed to update order to paid:", orderError);
  }

  // 2. Mark book as purchased
  await supabaseAdmin
    .from("books")
    .update({ is_purchased: true, updated_at: new Date().toISOString() })
    .eq("id", bookId);

  // 3. Fetch book + user info for emails
  const { data: book } = await supabaseAdmin
    .from("books")
    .select("id, child_name, theme_title, status, pdf_url")
    .eq("id", bookId)
    .single();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  const buyerEmail = session.customer_email || profile?.email;
  const buyerName = profile?.full_name || "there";
  const childName = book?.child_name || "your child";
  const appUrl = getAppUrl();

  // 4. Trigger full book generation in background (don't await)
  generateFullBook(bookId).catch((err) => {
    console.error(`Background full-book generation failed for ${bookId}:`, err);
  });

  // 5. Send order confirmation email to buyer
  if (buyerEmail) {
    try {
      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: buyerEmail,
        subject: `${childName}'s StorySpark book is on its way!`,
        html: buildOrderConfirmationEmail({
          buyerName,
          childName,
          tier: tier || "base",
          bookUrl: `${appUrl}/checkout/success?session_id=${session.id}`,
          appUrl,
        }),
      });

      // Mark email delivered on order
      await supabaseAdmin
        .from("orders")
        .update({ email_delivered: true })
        .eq("stripe_checkout_session_id", session.id);
    } catch (emailErr) {
      console.error("Failed to send order confirmation email:", emailErr);
    }
  }

  // 6. If gift, send notification to recipient
  if (isGift && giftRecipientEmail) {
    try {
      // Fetch gift message from order
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("gift_message")
        .eq("stripe_checkout_session_id", session.id)
        .single();

      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: giftRecipientEmail,
        subject: `You've received a StorySpark book!`,
        html: buildGiftNotificationEmail({
          recipientName: giftRecipientName || "Friend",
          senderName: buyerName,
          childName,
          giftMessage: order?.gift_message || null,
          bookUrl: `${appUrl}/gift/${bookId}`,
          appUrl,
        }),
      });
    } catch (emailErr) {
      console.error("Failed to send gift notification email:", emailErr);
    }
  }
}

// ---------------------------------------------------------------------------
// checkout.session.expired
// ---------------------------------------------------------------------------

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "failed" })
    .eq("stripe_checkout_session_id", session.id);

  if (error) {
    console.error("Failed to update order to failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

function buildOrderConfirmationEmail(data: {
  buyerName: string;
  childName: string;
  tier: string;
  bookUrl: string;
  appUrl: string;
}): string {
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
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">StorySpark</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">A magical story, just for ${data.childName}</p>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #f0e6d6;border-top:none;">
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Hi ${data.buyerName}!</h2>
      <p style="margin:0 0 16px;color:#4a4a5a;font-size:15px;line-height:1.6;">
        Thank you for your order! ${data.childName}'s personalized storybook is being created right now. Our AI illustrators are hard at work bringing the story to life.
      </p>
      <p style="margin:0 0 24px;color:#4a4a5a;font-size:15px;line-height:1.6;">
        You'll be able to download your book as a PDF and view it in your browser once it's ready (usually under 2 minutes).
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${data.bookUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:600;">
          View Your Book
        </a>
      </div>

      <p style="margin:24px 0 0;color:#9a9aaa;font-size:13px;text-align:center;">
        Your book is saved to your account and available anytime at
        <a href="${data.appUrl}/dashboard" style="color:#7C3AED;">your dashboard</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;color:#9a9aaa;font-size:12px;">
      <p style="margin:0;">Made with love by StorySpark</p>
    </div>
  </div>
</body>
</html>`;
}

function buildGiftNotificationEmail(data: {
  recipientName: string;
  senderName: string;
  childName: string;
  giftMessage: string | null;
  bookUrl: string;
  appUrl: string;
}): string {
  const giftMessageBlock = data.giftMessage
    ? `
      <div style="background:#f8f0ff;border-left:4px solid #7C3AED;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p style="margin:0;color:#4a4a5a;font-size:14px;font-style:italic;line-height:1.6;">"${data.giftMessage}"</p>
        <p style="margin:8px 0 0;color:#7C3AED;font-size:13px;font-weight:600;">— ${data.senderName}</p>
      </div>`
    : "";

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
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">StorySpark</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">You've received a magical gift!</p>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #f0e6d6;border-top:none;">
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Hi ${data.recipientName}!</h2>
      <p style="margin:0 0 16px;color:#4a4a5a;font-size:15px;line-height:1.6;">
        ${data.senderName} has gifted ${data.childName} a personalized storybook from StorySpark!
        It's a beautifully illustrated story where ${data.childName} is the hero.
      </p>

      ${giftMessageBlock}

      <!-- CTA Button -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${data.bookUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:600;">
          View the Book
        </a>
      </div>

      <p style="margin:24px 0 0;color:#9a9aaa;font-size:13px;text-align:center;">
        Want to create a StorySpark book of your own?
        <a href="${data.appUrl}" style="color:#7C3AED;">Get started here</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;color:#9a9aaa;font-size:12px;">
      <p style="margin:0;">Made with love by StorySpark</p>
    </div>
  </div>
</body>
</html>`;
}
