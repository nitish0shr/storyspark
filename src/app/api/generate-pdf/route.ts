import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assemblePdf } from "@/services/pdf-assembly";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured." },
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
      .select("id, user_id, status, story_text, lifecycle_stage")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (book.lifecycle_stage) {
      return NextResponse.json(
        {
          error:
            "Canonical final PDFs are created only by the paid fulfilment workflow.",
        },
        { status: 409 },
      );
    }

    // Must have story text to assemble PDF
    if (!book.story_text || !Array.isArray(book.story_text) || book.story_text.length === 0) {
      return NextResponse.json(
        { error: "Book has no story content to assemble into a PDF" },
        { status: 409 }
      );
    }

    // Assemble the PDF (synchronous -- waits for result)
    const { pdfUrl, pdfPrintUrl } = await assemblePdf(bookId);

    // These are bounded private links. Never persist an expiring signed URL as
    // a durable book or artefact location.
    return NextResponse.json({ pdfUrl, pdfPrintUrl }, { status: 200 });
  } catch (error) {
    console.error("Generate PDF error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
