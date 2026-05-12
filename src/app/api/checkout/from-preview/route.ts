import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { stripe, isStripeConfigured, PRICE_BASE } from "@/lib/stripe";
import { getAppUrl } from "@/lib/utils";

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments not configured." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const previewRequestId = typeof body.previewRequestId === "string" ? body.previewRequestId : null;
  if (!previewRequestId) {
    return NextResponse.json({ error: "previewRequestId is required." }, { status: 400 });
  }

  // Fetch preview request
  const { data: req, error } = await supabaseAdmin
    .from("preview_requests")
    .select("id, email, child_name, child_age, theme_id, preferences, preview_image_url, status")
    .eq("id", previewRequestId)
    .single();

  if (error || !req) {
    return NextResponse.json({ error: "Preview not found." }, { status: 404 });
  }

  if (req.status !== "ready") {
    return NextResponse.json({ error: "Preview must be ready before checkout." }, { status: 409 });
  }

  const appUrl = getAppUrl();
  const childName = req.child_name || "your child";

  // Create Stripe checkout session — user account created AFTER payment in webhook
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: req.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Starmee Storybook — ${childName}`,
            description: `A 12-page illustrated storybook where ${childName} is the hero`,
          },
          unit_amount: PRICE_BASE,
        },
        quantity: 1,
      },
    ],
    metadata: {
      flow: "from_preview",
      preview_request_id: previewRequestId,
      child_name: childName,
      theme_id: req.theme_id || "royal-quest",
      buyer_email: req.email,
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/preview/result/${previewRequestId}`,
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
