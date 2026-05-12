import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { generateFullBook } from "@/services/book-pipeline";
import { isOpenAIConfigured } from "@/lib/openai";
import { isReplicateConfigured } from "@/lib/replicate";
import { requireAdmin, statusForAuthError } from "@/lib/auth";

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
    if (!isOpenAIConfigured() || !isReplicateConfigured()) {
      return NextResponse.json(
        { error: "AI services not configured. Please add OPENAI_API_KEY and REPLICATE_API_TOKEN." },
        { status: 503 }
      );
    }
    try {
      await requireAdmin();
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unauthorized" },
        { status: statusForAuthError(error) }
      );
    }

    // Parse request body
    const body = await request.json();
    const { bookId } = body;

    if (!bookId || typeof bookId !== "string") {
      return NextResponse.json(
        { error: "bookId is required" },
        { status: 400 }
      );
    }

    // Verify the user owns this book
    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .select("id, status, is_purchased")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Must have preview_ready status before generating full book
    if (!book.is_purchased || book.status !== "preview_ready") {
      return NextResponse.json(
        {
          error: "Full generation requires a purchased book in preview_ready status.",
        },
        { status: 409 }
      );
    }

    // Start full book generation (fire-and-forget)
    generateFullBook(bookId).catch((err) => {
      console.error(
        `Background full book generation failed for ${bookId}:`,
        err
      );
    });

    return NextResponse.json(
      { status: "generating", bookId },
      { status: 202 }
    );
  } catch (error) {
    console.error("Generate book error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
