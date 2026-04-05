import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getNextThemeForSubscriber } from "@/services/theme-rotation";
import { generatePreview, generateFullBook } from "@/services/book-pipeline";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId } = body as { subscriptionId: string };

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      );
    }

    const { data: sub, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single();

    if (subError || !sub) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (sub.status !== "active") {
      return NextResponse.json(
        { error: "Subscription is not active" },
        { status: 400 }
      );
    }

    const nextTheme = getNextThemeForSubscriber(sub.used_theme_ids || []);
    if (!nextTheme) {
      return NextResponse.json(
        { error: "No available themes" },
        { status: 400 }
      );
    }

    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .insert({
        user_id: sub.user_id,
        child_profile_id: sub.child_profile_id,
        theme_id: nextTheme,
        status: "draft",
        language: "en",
        subscription_id: sub.id,
        contextual_answers: {},
      })
      .select("id")
      .single();

    if (bookError || !book) {
      console.error("Failed to create subscription book:", bookError);
      return NextResponse.json(
        { error: "Failed to create book" },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("subscriptions")
      .update({
        used_theme_ids: [...(sub.used_theme_ids || []), nextTheme],
        books_generated: (sub.books_generated || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);

    generatePreview(book.id).then(() => {
      return generateFullBook(book.id);
    }).catch((err: Error) => {
      console.error(`Subscription book generation failed for ${book.id}:`, err);
      supabaseAdmin
        .from("books")
        .update({ status: "failed" })
        .eq("id", book.id);
    });

    return NextResponse.json({
      success: true,
      bookId: book.id,
      themeId: nextTheme,
    });
  } catch (error) {
    console.error("Subscription generate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
