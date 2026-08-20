import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { approveBook } from "@/lib/review-workflow";

function adminBooksRedirect(
  request: NextRequest,
  key: "notice" | "error",
  message: string,
): NextResponse {
  const url = new URL("/admin/books", request.url);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const bookId = String(form.get("bookId") || "").trim();
  if (!bookId) {
    return adminBooksRedirect(request, "error", "Missing book id.");
  }

  const { data: book, error } = await supabaseAdmin
    .from("books")
    .select("lifecycle_stage, approved_version_id")
    .eq("id", bookId)
    .maybeSingle();
  if (error || !book) {
    return adminBooksRedirect(request, "error", "Book not found.");
  }
  if (book.lifecycle_stage !== "Approved" || !book.approved_version_id) {
    return adminBooksRedirect(
      request,
      "error",
      "Only an Approved book with an exact approved version can retry its invitation.",
    );
  }

  const result = await approveBook({
    bookId,
    versionId: book.approved_version_id as string,
    reviewer: user.email || "admin",
    notes: "Operator retried the approval invitation.",
  });
  return adminBooksRedirect(
    request,
    result.status === "Ready for Purchase" ? "notice" : "error",
    result.message,
  );
}