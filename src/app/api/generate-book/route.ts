import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateFullBook } from "@/services/book-pipeline";
import { isOpenAIConfigured } from "@/lib/openai";
import { canInvokeCanonicalFullBook } from "@/lib/legacy-recovery";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please add Supabase environment variables." },
        { status: 503 }
      );
    }
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: "AI services not configured. Please add OPENAI_API_KEY." },
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
      .select("id, user_id, status, lifecycle_stage")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Legacy lifecycle-null rows must use the privileged, confirmed recovery
    // flow. This endpoint can only replay canonical paid-book finalisation.
    if (!canInvokeCanonicalFullBook(book.lifecycle_stage)) {
      return NextResponse.json(
        {
          error:
            "Full-book generation is available only for a canonical Purchased book. Legacy recovery requires an administrator.",
        },
        { status: 409 }
      );
    }

    await generateFullBook(bookId);

    return NextResponse.json(
      { status: "finalised", bookId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Generate book error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
