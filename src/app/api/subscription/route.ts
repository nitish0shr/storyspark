import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe, isStripeConfigured } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ subscription: null });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "paused", "past_due", "canceled"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ subscription: sub });
  } catch (error) {
    console.error("Fetch subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isSupabaseConfigured() || !isStripeConfigured()) {
      return NextResponse.json(
        { error: "Not configured" },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body as { action: "cancel" | "resume" | "pause" };

    const { data: sub, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "paused", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subError || !sub) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    if (!sub.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Subscription has no Stripe ID" },
        { status: 400 }
      );
    }

    switch (action) {
      case "cancel": {
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          cancel_at_period_end: true,
        });

        await supabaseAdmin
          .from("subscriptions")
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);

        return NextResponse.json({ success: true, message: "Subscription will cancel at end of billing period." });
      }

      case "resume": {
        const updateParams: Record<string, unknown> = {
          cancel_at_period_end: false,
        };
        if (sub.status === "paused") {
          updateParams.pause_collection = "";
        }
        await stripe.subscriptions.update(sub.stripe_subscription_id, updateParams);

        await supabaseAdmin
          .from("subscriptions")
          .update({
            cancel_at_period_end: false,
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);

        return NextResponse.json({ success: true, message: "Subscription resumed." });
      }

      case "pause": {
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          pause_collection: { behavior: "void" },
        });

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "paused",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);

        return NextResponse.json({ success: true, message: "Subscription paused. You won't be billed until you resume." });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Must be cancel, resume, or pause." },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Subscription management error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
