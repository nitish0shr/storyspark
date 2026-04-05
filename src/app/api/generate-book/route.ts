import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateFullBook } from "@/services/book-pipeline";

export async function POST(request: NextRequest) {
  try {
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
      .select("id, user_id, status")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Must have preview_ready status before generating full book
    if (book.status !== "preview_ready") {
      return NextResponse.json(
        {
          error: `Cannot generate full book from status "${book.status}". Expected "preview_ready".`,
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
