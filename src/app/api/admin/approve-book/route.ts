/**
 * Legacy approve-book GET endpoint — READ ONLY.
 *
 * This route no longer mutates any data. The canonical human-review workflow
 * is the signed review page (/review/<token>), which requires the reviewer to
 * read the story and submit a form. A GET request — which may come from an
 * email security scanner, a link preview bot, or an accidental click — must
 * never approve anything.
 *
 * Returns an HTML explanation page directing the user to the canonical review
 * page or the admin queue.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/utils";

function html(body: string, title: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #F3F4F6; display: flex; align-items: center;
           justify-content: center; min-height: 100vh; }
    .card { background: #fff; border-radius: 16px; padding: 48px 40px;
            max-width: 520px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,.08);
            text-align: center; }
    h1 { margin: 0 0 12px; font-size: 24px; }
    p { color: #6B7280; font-size: 15px; line-height: 1.6; margin: 0 0 12px; }
    a { color: #7C3AED; font-weight: 600; text-decoration: none; }
    .note { font-size: 13px; color: #9CA3AF; margin-top: 20px;
            border-top: 1px solid #E5E7EB; padding-top: 16px; }
  </style>
</head>
<body><div class="card">${body}</div></body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  const adminBooksUrl = getAppUrl() + "/admin/books";

  if (!bookId) {
    return html(
      `<h1>Approval links have moved</h1>
       <p>Book approvals now happen on the secure review page, which the reviewer
       reaches via the signed link in the notification email.</p>
       <p><a href="${adminBooksUrl}">Go to the admin book list</a></p>
       <p class="note">This endpoint is read-only. No changes were made.</p>`,
      "Approval links have moved"
    );
  }

  if (!isAdminConfigured()) {
    return html(
      `<h1>Not configured</h1>
       <p>Supabase admin is not configured on this server.</p>`,
      "Error"
    );
  }

  const { data: book } = await supabaseAdmin
    .from("books")
    .select("id, child_name, status, lifecycle_stage")
    .eq("id", bookId)
    .maybeSingle();

  if (!book) {
    return html(
      `<h1>Book not found</h1>
       <p>No book with ID <code>${bookId}</code> exists.</p>`,
      "Not found"
    );
  }

  const stage =
    (book as Record<string, unknown>).lifecycle_stage as string | null ?? null;
  const displayStage = stage || book.status;

  return html(
    `<h1>Action required on the review page</h1>
     <p><strong>${book.child_name || "This book"}</strong> is currently
     <strong>${displayStage}</strong>.</p>
     <p>To approve or reject it, open the secure review link that was sent in
     the notification email. That page lets you read the story and submit
     your decision.</p>
     <p><a href="${adminBooksUrl}">Go to the admin book list</a></p>
     <p class="note">This link is read-only. No changes were made.</p>`,
    "Review required"
  );
}
