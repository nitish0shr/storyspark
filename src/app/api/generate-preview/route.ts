import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generatePreview } from "@/services/book-pipeline";
import { isOpenAIConfigured } from "@/lib/openai";
import { isReplicateConfigured } from "@/lib/replicate";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured. Please add Supabase environment variables." },
        { status: 503 }
      );
    }
    if (!isOpenAIConfigured() || !isReplicateConfigured()) {
      return NextResponse.json(
        { error: "AI services not configured. Please add OPENAI_API_KEY and REPLICATE_API_TOKEN." },
        { status: 503 }
      );
    }

    // Try to get the authenticated user — anonymous visitors are allowed for free preview
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // No session — fine for free preview
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

    // Fetch the book using admin client (bypasses RLS for anonymous books)
    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .select("id, user_id, status")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Ownership check:
    // - If the book belongs to a specific user, only that user may trigger generation.
    // - If the book has no user_id (anonymous), allow anyone who knows the bookId.
    if (book.user_id !== null && book.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent re-generating if already in progress
    if (book.status === "preview_generating" || book.status === "generating") {
      return NextResponse.json(
        { error: "Book generation already in progress" },
        { status: 409 }
      );
    }

    // Start preview generation (fire-and-forget for long operations)
    generatePreview(bookId).catch((err) => {
      console.error(`Background preview generation failed for ${bookId}:`, err);
    });

    return NextResponse.json(
      { status: "preview_generating", bookId },
      { status: 202 }
    );
  } catch (error) {
    console.error("Generate preview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
