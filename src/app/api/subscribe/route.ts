import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe, isStripeConfigured, PRICING } from "@/lib/stripe";
import { getAppUrl } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured." },
        { status: 503 }
      );
    }
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Payments not configured." },
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
    const { childProfileId } = body as { childProfileId: string };

    if (!childProfileId) {
      return NextResponse.json(
        { error: "childProfileId is required" },
        { status: 400 }
      );
    }

    const { data: child, error: childError } = await supabaseAdmin
      .from("child_profiles")
      .select("id, user_id, name")
      .eq("id", childProfileId)
      .single();

    if (childError || !child) {
      return NextResponse.json(
        { error: "Child profile not found" },
        { status: 404 }
      );
    }

    if (child.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["active", "paused", "past_due", "incomplete"])
      .maybeSingle();

    if (existingSub) {
      return NextResponse.json(
        { error: "You already have an active subscription." },
        { status: 409 }
      );
    }

    const appUrl = getAppUrl();

    const minMonths = PRICING.subscription.minCommitmentMonths;
    const minCommitmentEnd = new Date();
    minCommitmentEnd.setMonth(minCommitmentEnd.getMonth() + minMonths);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: PRICING.subscription.name,
              description: `Monthly personalised storybook for ${child.name} (${minMonths}-month minimum)`,
            },
            unit_amount: PRICING.subscription.cents,
            recurring: {
              interval: PRICING.subscription.interval,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        child_profile_id: childProfileId,
        type: "subscription",
        min_commitment_end: minCommitmentEnd.toISOString(),
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          child_profile_id: childProfileId,
          min_commitment_end: minCommitmentEnd.toISOString(),
        },
      },
      success_url: `${appUrl}/dashboard?subscription=success`,
      cancel_url: `${appUrl}/#pricing`,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Subscription checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
