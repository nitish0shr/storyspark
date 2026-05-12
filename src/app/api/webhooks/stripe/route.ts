import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend, RESEND_FROM_EMAIL, isResendConfigured } from "@/lib/resend";
import { generateFullBook } from "@/services/book-pipeline";
import { getAppUrl } from "@/lib/utils";
import { logServerError } from "@/lib/monitor";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 }
    );
  }

  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
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
    await logServerError("stripe-webhook", error, { eventType: event.type });
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

  // Route to the correct handler based on checkout flow
  if (metadata.flow === "from_preview") {
    await handleFromPreviewCheckout(session, metadata);
    return;
  }

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

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

  // 1. Update order status to paid
  const { data: updatedOrder, error: orderError } = await supabaseAdmin
    .from("orders")
    .update({
      status: "paid",
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("stripe_checkout_session_id", session.id)
    .select("id")
    .maybeSingle();

  if (orderError) {
    console.error("Failed to update order to paid:", orderError);
  }

  if (!updatedOrder) {
    const { error: insertOrderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        book_id: bookId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        status: "paid",
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        tier: "base",
        is_gift: isGift,
        gift_recipient_name: giftRecipientName,
        gift_recipient_email: giftRecipientEmail,
        gift_access_token: metadata.gift_access_token || null,
      });

    if (insertOrderError) {
      console.error("Failed to insert paid order from webhook:", insertOrderError);
    }
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

  const [{ data: profile }, { data: authUser }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single(),
    supabaseAdmin.auth.admin.getUserById(userId),
  ]);

  const buyerEmail = session.customer_email || authUser?.user?.email;
  const buyerName = profile?.full_name || "there";
  const childName = book?.child_name || "your child";
  const appUrl = getAppUrl();

  // 4. Send admin notification email
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail && isResendConfigured()) {
    try {
      const amount = session.amount_total
        ? `$${(session.amount_total / 100).toFixed(2)}`
        : "unknown";
      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: adminEmail,
        subject: `New Starmee Order — ${childName} (${amount})`,
        html: `<div style="font-family:sans-serif;padding:20px;">
          <h2 style="color:#E8417A;">New Order Received</h2>
          <p><strong>Child:</strong> ${childName}</p>
          <p><strong>Buyer:</strong> ${buyerName} (${buyerEmail || "no email"})</p>
          <p><strong>Tier:</strong> ${tier || "base"}</p>
          <p><strong>Amount:</strong> ${amount}</p>
          <p><strong>Book ID:</strong> ${bookId}</p>
          <p><strong>Gift:</strong> ${isGift ? `Yes — to ${giftRecipientName} (${giftRecipientEmail})` : "No"}</p>
          <p style="margin-top:20px;">The book is generating now. Once ready, it will appear in the <a href="${appUrl}/admin/review" style="color:#E8417A;">Review Queue</a> for approval before delivery.</p>
        </div>`,
      });
    } catch (adminEmailErr) {
      console.error("Failed to send admin notification:", adminEmailErr);
    }
  }

  // 5. Trigger full book generation once. Railway runs this as a long-lived
  // Node process, so the background promise can continue after the webhook
  // response; the status checks below keep Stripe retries idempotent.
  if (book?.status === "preview_ready") {
    generateFullBook(bookId).catch((err) => {
      console.error(`Background full-book generation failed for ${bookId}:`, err);
    });
  }

  // 6. Send order confirmation email to buyer
  if (buyerEmail && isResendConfigured()) {
    try {
      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: buyerEmail,
        subject: `${childName}'s Starmee book is on its way!`,
        html: buildOrderConfirmationEmail({
          buyerName,
          childName,
          tier: tier || "base",
          bookUrl: `${appUrl}/checkout/success?session_id=${session.id}`,
          appUrl,
        }),
      });

    } catch (emailErr) {
      console.error("Failed to send order confirmation email:", emailErr);
    }
  }

  // 7. Gift recipient delivery happens only after admin approval, when the
  // reviewed book and PDF are complete.
}

// ---------------------------------------------------------------------------
// from_preview checkout flow — creates user + book + order after payment
// ---------------------------------------------------------------------------

async function handleFromPreviewCheckout(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  const previewRequestId = metadata.preview_request_id;
  const buyerEmail = session.customer_email || metadata.buyer_email;

  if (!previewRequestId || !buyerEmail) {
    console.error("from_preview webhook missing preview_request_id or buyer_email");
    return;
  }

  // Idempotency: if preview_request already has a converted_book_id, skip
  const { data: previewReq } = await supabaseAdmin
    .from("preview_requests")
    .select("id, email, child_name, child_age, theme_id, photo_url, preferences, preview_image_url, converted_book_id")
    .eq("id", previewRequestId)
    .single();

  if (!previewReq) {
    console.error("Preview request not found:", previewRequestId);
    return;
  }

  let bookId = previewReq.converted_book_id as string | null;

  if (!bookId) {
    // Step 1: Find or create Supabase user for this email
    let userId: string;

    const { data: created } = await supabaseAdmin.auth.admin.createUser({
      email: buyerEmail.toLowerCase(),
      email_confirm: true,
      user_metadata: { source: "starmee_preview_checkout" },
    });

    if (created?.user) {
      userId = created.user.id;
    } else {
      // User already exists — find them
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const existing = list?.users?.find(
        (u) => u.email?.toLowerCase() === buyerEmail.toLowerCase()
      );
      if (!existing) {
        console.error("Could not find or create user for:", buyerEmail);
        return;
      }
      userId = existing.id;
    }

    // Track user_id on preview_request
    await supabaseAdmin
      .from("preview_requests")
      .update({ supabase_user_id: userId })
      .eq("id", previewRequestId);

    // Step 2: Create child_profile from preview data
    const prefs = (previewReq.preferences as Record<string, string>) || {};
    const gender = prefs.gender || "neutral";

    const { data: childProfile } = await supabaseAdmin
      .from("child_profiles")
      .insert({
        user_id: userId,
        name: previewReq.child_name || "Child",
        age: previewReq.child_age || 5,
        gender: ["boy", "girl", "neutral"].includes(gender) ? gender : "neutral",
        photo_url: previewReq.photo_url || null,
      })
      .select("id")
      .single();

    if (!childProfile) {
      console.error("Failed to create child profile for user:", userId);
      return;
    }

    // Step 3: Create book record — mark preview_ready so generation can start
    const { data: newBook } = await supabaseAdmin
      .from("books")
      .insert({
        user_id: userId,
        child_profile_id: childProfile.id,
        child_name: previewReq.child_name || "Child",
        theme_id: previewReq.theme_id || "royal-quest",
        status: "preview_ready",
        is_purchased: true,
        preview_image_url: previewReq.preview_image_url || null,
      })
      .select("id")
      .single();

    if (!newBook) {
      console.error("Failed to create book for user:", userId);
      return;
    }

    bookId = newBook.id;

    // Link preview_request → book
    await supabaseAdmin
      .from("preview_requests")
      .update({ converted_book_id: bookId })
      .eq("id", previewRequestId);
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

  // Step 4: Create order record
  const { data: book } = await supabaseAdmin
    .from("books")
    .select("user_id, child_name, theme_id")
    .eq("id", bookId)
    .single();

  if (!book) return;

  await supabaseAdmin.from("orders").insert({
    user_id: book.user_id,
    book_id: bookId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    status: "paid",
    amount_cents: session.amount_total ?? PRICE_BASE,
    currency: session.currency ?? "usd",
    tier: "base",
    is_gift: false,
  });

  // Step 5: Trigger full book generation
  generateFullBook(bookId).catch((err) => {
    console.error(`from_preview full-book generation failed for ${bookId}:`, err);
  });

  // Step 6: Send confirmation email
  const appUrl = getAppUrl();
  const childName = book.child_name || previewReq.child_name || "your child";
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (isResendConfigured()) {
    // Buyer confirmation
    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: buyerEmail,
      subject: `✨ ${childName}'s Starmee book is being created!`,
      html: buildOrderConfirmationEmail({
        buyerName: "there",
        childName,
        tier: "base",
        bookUrl: `${appUrl}/checkout/success?session_id=${session.id}`,
        appUrl,
      }),
    }).catch((e) => console.error("Confirmation email failed:", e));

    // Admin notification
    if (adminEmail) {
      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: adminEmail,
        subject: `New Starmee Order (from preview) — ${childName}`,
        html: `<div style="font-family:sans-serif;padding:20px;">
          <h2 style="color:#E8417A;">New Order (Preview Flow)</h2>
          <p><strong>Child:</strong> ${childName}</p>
          <p><strong>Buyer:</strong> ${buyerEmail}</p>
          <p><strong>Amount:</strong> $${((session.amount_total ?? PRICE_BASE) / 100).toFixed(2)}</p>
          <p><strong>Book ID:</strong> ${bookId}</p>
          <p><strong>Preview Request:</strong> ${previewRequestId}</p>
          <p style="margin-top:20px;">Book is generating. It will appear in the
            <a href="${appUrl}/admin/review" style="color:#E8417A;">Review Queue</a> when ready.</p>
        </div>`,
      }).catch((e) => console.error("Admin notification failed:", e));
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
    <div style="background:linear-gradient(135deg,#E8417A,#FF9BBD);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Starmee</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">A magical story, just for ${data.childName}</p>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #f0e6d6;border-top:none;">
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Hi ${data.buyerName}!</h2>
      <p style="margin:0 0 16px;color:#4a4a5a;font-size:15px;line-height:1.6;">
        Thank you for your order! ${data.childName}'s personalized storybook is being created right now. Our team is carefully reviewing each page to make sure everything is perfect.
      </p>
      <p style="margin:0 0 24px;color:#4a4a5a;font-size:15px;line-height:1.6;">
        You'll receive another email when your book is ready to download — usually within 24 hours.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${data.bookUrl}" style="display:inline-block;background:linear-gradient(135deg,#E8417A,#FF9BBD);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:600;">
          View Your Book
        </a>
      </div>

      <p style="margin:24px 0 0;color:#9a9aaa;font-size:13px;text-align:center;">
        Your book is saved to your account and available anytime at
        <a href="${data.appUrl}/dashboard" style="color:#E8417A;">your dashboard</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;color:#9a9aaa;font-size:12px;">
      <p style="margin:0;">Made with love by Starmee</p>
    </div>
  </div>
</body>
</html>`;
}
