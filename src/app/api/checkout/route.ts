import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe, isStripeConfigured, PRICE_BASE, PRICE_MID, PRICE_PREMIUM } from "@/lib/stripe";
import { PricingTier } from "@/types/order";
import { getAppUrl } from "@/lib/utils";

const TIER_CONFIG: Record<PricingTier, { price: number; name: string }> = {
  base: { price: PRICE_BASE, name: "Base" },
  mid: { price: PRICE_MID, name: "Mid" },
  premium: { price: PRICE_PREMIUM, name: "Premium" },
};

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please add Supabase environment variables." },
        { status: 503 }
      );
    }
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Payments not configured. Please add STRIPE_SECRET_KEY." },
        { status: 503 }
      );
    }
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse & validate body
    const body = await request.json();
    const {
      bookId,
      tier,
      isGift = false,
      giftRecipientName,
      giftRecipientEmail,
      giftMessage,
    } = body as {
      bookId: string;
      tier: PricingTier;
      isGift?: boolean;
      giftRecipientName?: string;
      giftRecipientEmail?: string;
      giftMessage?: string;
    };

    if (!bookId || typeof bookId !== "string") {
      return NextResponse.json(
        { error: "bookId is required" },
        { status: 400 }
      );
    }

    if (!tier || !TIER_CONFIG[tier]) {
      return NextResponse.json(
        { error: "Invalid tier. Must be base, mid, or premium." },
        { status: 400 }
      );
    }

    if (isGift && (!giftRecipientEmail || !giftRecipientName)) {
      return NextResponse.json(
        { error: "Gift recipient name and email are required for gifts." },
        { status: 400 }
      );
    }

    // Verify book exists and user owns it
    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .select("id, user_id, child_name, status")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Don't allow checkout for books that are already purchased or in generation
    if (book.status === "generating" || book.status === "complete") {
      return NextResponse.json(
        { error: "This book has already been purchased." },
        { status: 409 }
      );
    }

    const tierConfig = TIER_CONFIG[tier];
    const appUrl = getAppUrl();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `StorySpark Book - ${tierConfig.name}`,
              description: `${book.child_name}'s personalized storybook`,
            },
            unit_amount: tierConfig.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        book_id: bookId,
        user_id: user.id,
        tier,
        is_gift: isGift ? "true" : "false",
        gift_recipient_email: giftRecipientEmail || "",
        gift_recipient_name: giftRecipientName || "",
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/preview/${bookId}`,
    });

    // Create pending order in DB
    const { error: orderError } = await supabaseAdmin.from("orders").insert({
      user_id: user.id,
      book_id: bookId,
      stripe_checkout_session_id: session.id,
      status: "pending",
      amount_cents: tierConfig.price,
      currency: "usd",
      tier,
      is_gift: isGift,
      gift_recipient_name: giftRecipientName || null,
      gift_recipient_email: giftRecipientEmail || null,
      gift_message: giftMessage || null,
    });

    if (orderError) {
      console.error("Failed to create order record:", orderError);
      // Don't block checkout — the webhook will reconcile
    }

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
