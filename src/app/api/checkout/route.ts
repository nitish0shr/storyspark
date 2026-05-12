import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { stripe, isStripeConfigured, PRICE_BASE } from "@/lib/stripe";
import { PricingTier } from "@/types/order";
import { getAppUrl } from "@/lib/utils";
import { randomUUID } from "crypto";

const TIER_CONFIG: Record<PricingTier, { price: number; name: string }> = {
  base: { price: PRICE_BASE, name: "Base" },
};

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please add Supabase environment variables." },
        { status: 503 }
      );
    }
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: "Server database admin access is not configured." },
        { status: 503 }
      );
    }
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Payments not configured. Please add STRIPE_SECRET_KEY." },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      tier?: string;
      isGift?: boolean;
      giftRecipientName?: string;
      giftRecipientEmail?: string;
      giftMessage?: string;
    };
    const trimmedGiftRecipientEmail = giftRecipientEmail?.trim() ?? "";
    const trimmedGiftRecipientName = giftRecipientName?.trim() ?? "";

    if (!bookId || typeof bookId !== "string") {
      return NextResponse.json({ error: "bookId is required" }, { status: 400 });
    }

    if (tier !== "base") {
      return NextResponse.json(
        { error: "Only the Digital PDF tier is available at launch." },
        { status: 400 }
      );
    }

    if (isGift && (!trimmedGiftRecipientEmail || !trimmedGiftRecipientName)) {
      return NextResponse.json(
        { error: "Gift recipient name and email are required for gifts." },
        { status: 400 }
      );
    }

    if (
      isGift &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedGiftRecipientEmail)
    ) {
      return NextResponse.json(
        { error: "Please enter a valid gift recipient email." },
        { status: 400 }
      );
    }

    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .select("id, user_id, child_name, status, is_purchased")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      book.is_purchased ||
      book.status === "generating" ||
      book.status === "pending_review" ||
      book.status === "complete"
    ) {
      return NextResponse.json(
        { error: "This book has already been purchased." },
        { status: 409 }
      );
    }

    if (book.status !== "preview_ready") {
      return NextResponse.json(
        { error: "Please wait until the preview is ready before checkout." },
        { status: 409 }
      );
    }

    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select("id, status, stripe_checkout_session_id")
      .eq("book_id", bookId)
      .in("status", ["pending", "paid", "fulfilled"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingOrder?.status === "paid" || existingOrder?.status === "fulfilled") {
      return NextResponse.json(
        { error: "This book has already been purchased." },
        { status: 409 }
      );
    }

    if (existingOrder?.status === "pending" && existingOrder.stripe_checkout_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(
          existingOrder.stripe_checkout_session_id
        );
        if (existingSession.status === "open" && existingSession.url) {
          return NextResponse.json({ checkoutUrl: existingSession.url });
        }
      } catch {
        // Create a replacement checkout session below.
      }

      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", existingOrder.id);
    }

    const launchTier: PricingTier = "base";
    const tierConfig = TIER_CONFIG[launchTier];
    const appUrl = getAppUrl();
    const giftAccessToken = isGift ? randomUUID() : null;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Starmee Book - ${tierConfig.name}`,
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
        tier: launchTier,
        is_gift: isGift ? "true" : "false",
        gift_recipient_email: trimmedGiftRecipientEmail || "",
        gift_recipient_name: trimmedGiftRecipientName || "",
        gift_access_token: giftAccessToken || "",
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/preview/${bookId}`,
    });

    const { error: orderError } = await supabaseAdmin.from("orders").insert({
      user_id: user.id,
      book_id: bookId,
      stripe_checkout_session_id: session.id,
      status: "pending",
      amount_cents: tierConfig.price,
      currency: "usd",
      tier: launchTier,
      is_gift: isGift,
      gift_recipient_name: trimmedGiftRecipientName || null,
      gift_recipient_email: trimmedGiftRecipientEmail || null,
      gift_message: giftMessage || null,
      gift_access_token: giftAccessToken,
    });

    if (orderError) {
      console.error("Failed to create order record:", orderError);
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        console.error("Failed to expire orphaned checkout session:", expireError);
      }
      return NextResponse.json(
        { error: "Failed to prepare checkout. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
