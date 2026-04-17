import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend, RESEND_FROM_EMAIL, isResendConfigured } from "@/lib/resend";
import { getAppUrl } from "@/lib/utils";

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ??
    [];
  if (adminEmails.length === 0) return true; // dev mode
  return adminEmails.includes(email.toLowerCase());
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { bookId, action } = body as {
    bookId?: string;
    action?: "approve" | "reject";
  };

  if (!bookId || !action || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "Missing bookId or invalid action" },
      { status: 400 }
    );
  }

  // Fetch the book
  const { data: book, error: bookError } = await supabaseAdmin
    .from("books")
    .select("id, user_id, child_name, theme_title, status, pdf_url")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (book.status !== "pending_review") {
    return NextResponse.json(
      { error: `Book is not pending review (status: ${book.status})` },
      { status: 400 }
    );
  }

  if (action === "approve") {
    // Mark as complete
    await supabaseAdmin
      .from("books")
      .update({ status: "complete", updated_at: new Date().toISOString() })
      .eq("id", bookId);

    // Update order status to fulfilled
    await supabaseAdmin
      .from("orders")
      .update({ status: "fulfilled" })
      .eq("book_id", bookId)
      .eq("status", "paid");

    // Send delivery email to buyer
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", book.user_id)
      .single();

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "is_gift, gift_recipient_name, gift_recipient_email, gift_message"
      )
      .eq("book_id", bookId)
      .limit(1)
      .single();

    const buyerEmail = profile?.email;
    const buyerName = profile?.full_name || "there";
    const childName = book.child_name || "your child";
    const appUrl = getAppUrl();

    if (buyerEmail && isResendConfigured()) {
      try {
        await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: buyerEmail,
          subject: `${childName}'s Starmee book is ready!`,
          html: buildBookReadyEmail({
            buyerName,
            childName,
            bookUrl: `${appUrl}/preview/${bookId}`,
            pdfUrl: book.pdf_url,
            appUrl,
          }),
        });

        await supabaseAdmin
          .from("orders")
          .update({ email_delivered: true })
          .eq("book_id", bookId);
      } catch (emailErr) {
        console.error("Failed to send book-ready email:", emailErr);
      }
    }

    // If gift, send to recipient too
    if (order?.is_gift && order.gift_recipient_email && isResendConfigured()) {
      try {
        await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: order.gift_recipient_email,
          subject: `You've received a Starmee book!`,
          html: `<div style="font-family:sans-serif;padding:20px;">
            <h2 style="color:#7C3AED;">A magical book is waiting for you!</h2>
            <p>${buyerName} gifted ${childName} a personalized storybook.</p>
            ${order.gift_message ? `<blockquote style="border-left:4px solid #7C3AED;padding:12px 16px;margin:16px 0;color:#555;">"${order.gift_message}"<br><strong>— ${buyerName}</strong></blockquote>` : ""}
            <p><a href="${appUrl}/gift/${bookId}" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View the Book</a></p>
          </div>`,
        });
      } catch (giftEmailErr) {
        console.error("Failed to send gift notification:", giftEmailErr);
      }
    }

    return NextResponse.json({ success: true, action: "approved" });
  }

  if (action === "reject") {
    // Mark as failed so it shows up in failed jobs for re-generation
    await supabaseAdmin
      .from("books")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", bookId);

    return NextResponse.json({ success: true, action: "rejected" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// ---------------------------------------------------------------------------
// Email template for book-ready notification (sent after admin approval)
// ---------------------------------------------------------------------------

function buildBookReadyEmail(data: {
  buyerName: string;
  childName: string;
  bookUrl: string;
  pdfUrl: string | null;
  appUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFFBF5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:linear-gradient(135deg,#7C3AED,#EC4899);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Starmee</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">${data.childName}'s book is ready!</p>
    </div>

    <div style="background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;border:1px solid #f0e6d6;border-top:none;">
      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Great news, ${data.buyerName}!</h2>
      <p style="margin:0 0 16px;color:#4a4a5a;font-size:15px;line-height:1.6;">
        ${data.childName}'s personalized storybook has been reviewed and is ready for you. Every page has been carefully checked to make sure it's perfect.
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="${data.bookUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:600;">
          Read the Book Online
        </a>
      </div>

      ${
        data.pdfUrl
          ? `<div style="text-align:center;margin:16px 0;">
        <a href="${data.pdfUrl}" style="color:#7C3AED;font-size:14px;text-decoration:underline;">
          Download as PDF
        </a>
      </div>`
          : ""
      }

      <p style="margin:24px 0 0;color:#9a9aaa;font-size:13px;text-align:center;">
        Your book is saved to your account at
        <a href="${data.appUrl}/dashboard" style="color:#7C3AED;">your dashboard</a>.
      </p>
    </div>


    <div style="text-align:center;padding:24px 0;color:#9a9aaa;font-size:12px;">
      <p style="margin:0;">Made with love by Starmee</p>
    </div>
  </div>
</body>
</html>`;
}
