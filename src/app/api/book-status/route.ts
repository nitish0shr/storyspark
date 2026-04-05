import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const bookId = request.nextUrl.searchParams.get("bookId");

  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  const { data: book, error } = await supabaseAdmin
    .from("books")
    .select("id, status, pdf_url")
    .eq("id", bookId)
    .single();

  if (error || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: book.status,
    pdfUrl: book.pdf_url || null,
  });
}
