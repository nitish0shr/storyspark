import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { verifyApprovalToken } from "@/lib/admin-approval";
import { generateFullBook } from "@/services/book-pipeline";

function html(body: string, title: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title}</title>
    <style>
      body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F3F4F6;display:flex;align-items:center;justify-content:center;min-height:100vh}
      .card{background:#fff;border-radius:16px;padding:48px 40px;max-width:480px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.08);text-align:center}
      h1{margin:0 0 12px;font-size:28px}
      p{color:#6B7280;font-size:15px;line-height:1.6;margin:0}
    </style>
    </head><body><div class="card">${body}</div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  const token = searchParams.get("token");

  if (!bookId || !token) {
    return html(
      `<h1>❌ Missing Parameters</h1><p>bookId and token are required.</p>`,
      "Error"
    );
  }

  if (!verifyApprovalToken(bookId, token)) {
    return html(
      `<h1>🔒 Invalid Token</h1><p>This approval link is invalid or has been tampered with.</p>`,
      "Invalid Token"
    );
  }

  if (!isAdminConfigured()) {
    return html(
      `<h1>⚙️ Not Configured</h1><p>Supabase admin is not configured on this server.</p>`,
      "Error"
    );
  }

  const { data: book, error } = await supabaseAdmin
    .from("books")
    .select("id, child_name, status")
    .eq("id", bookId)
    .single();

  if (error || !book) {
    return html(
      `<h1>📚 Book Not Found</h1><p>No book with ID <code>${bookId}</code> exists.</p>`,
      "Not Found"
    );
  }

  if (book.status !== "pending_approval") {
    return html(
      `<h1>ℹ️ Already Processed</h1>
       <p><strong>${book.child_name}'s</strong> book is currently in status <strong>${book.status}</strong>. No action was taken.</p>`,
      "Already Processed"
    );
  }

  // Immediately flip the status to prevent double-approval
  await supabaseAdmin
    .from("books")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", bookId);

  // Trigger full book generation in background
  generateFullBook(bookId).catch((err) => {
    console.error(`Admin-approved full-book generation failed for ${bookId}:`, err);
    supabaseAdmin
      .from("books")
      .update({ status: "failed" })
      .eq("id", bookId);
  });

  console.log(`[admin] Book ${bookId} (${book.child_name}) APPROVED — generation started`);

  return html(
    `<h1>✅ Book Approved!</h1>
     <p><strong>${book.child_name}'s</strong> book has been approved. Full illustration and PDF generation is running in the background.</p>
     <p style="margin-top:12px">The customer will receive a delivery email automatically when the book is complete.</p>`,
    "Book Approved"
  );
}
