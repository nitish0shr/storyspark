import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { getOptionalUser, isAdminEmail } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }
  const bookId = request.nextUrl.searchParams.get("bookId");
  const token = request.nextUrl.searchParams.get("token");

  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  const { data: book, error } = await supabaseAdmin
    .from("books")
    .select("id, user_id, status, pdf_url")
    .eq("id", bookId)
    .single();

  if (error || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const auth = await getOptionalUser();
  const isOwner = auth?.user.id === book.user_id;
  const isAdmin = isAdminEmail(auth?.user.email);
  let isGiftRecipient = false;

  if (token) {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("book_id", bookId)
      .eq("is_gift", true)
      .eq("gift_access_token", token)
      .in("status", ["paid", "fulfilled"])
      .maybeSingle();
    isGiftRecipient = !!order;
  }

  if (!isOwner && !isAdmin && !isGiftRecipient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canSeePdf = isAdmin || book.status === "complete";

  return NextResponse.json({
    status: book.status,
    pdfUrl: canSeePdf ? book.pdf_url || null : null,
  });
}
