import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { assemblePdf } from "@/services/pdf-assembly";
import { requireAdmin, statusForAuthError } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured." },
        { status: 503 }
      );
    }
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: "Server database admin access is not configured." },
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
      .select("id, status, story_text")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Must have story text to assemble PDF
    if (
      !book.story_text ||
      !Array.isArray(book.story_text) ||
      book.story_text.length === 0
    ) {
      return NextResponse.json(
        { error: "Book has no story content to assemble into a PDF" },
        { status: 409 }
      );
    }

    // Assemble the PDF (synchronous -- waits for result)
    const { pdfUrl, pdfPrintUrl } = await assemblePdf(bookId);

    // Update the book record with PDF URLs
    await supabaseAdmin
      .from("books")
      .update({
        pdf_url: pdfUrl,
        pdf_print_url: pdfPrintUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookId);

    return NextResponse.json({ pdfUrl, pdfPrintUrl }, { status: 200 });
  } catch (error) {
    console.error("Generate PDF error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
