import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { recordOperationalError } from "@/lib/lifecycle-service";
import { attemptPurchaseConfirmation } from "@/services/purchase-confirmation";

function redirectWith(
  request: NextRequest,
  key: "notice" | "error",
  message: string,
) {
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
  if (!bookId) return redirectWith(request, "error", "Missing book id.");

  const { data: book } = await supabaseAdmin
    .from("books")
    .select("id, child_name, lifecycle_stage")
    .eq("id", bookId)
    .maybeSingle();
  if (
    !book ||
    (book.lifecycle_stage !== "Purchased" &&
      book.lifecycle_stage !== "Delivered")
  ) {
    return redirectWith(
      request,
      "error",
      "Purchase confirmation can only be retried for a purchased book.",
    );
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      "id, purchaser_email, status, payment_verified_at, purchase_confirmation_sent_at",
    )
    .eq("book_id", bookId)
    .in("status", ["paid", "fulfilled"])
    .not("payment_verified_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!order?.purchaser_email) {
    return redirectWith(
      request,
      "error",
      "No verified paid order with a purchaser email was found.",
    );
  }

  try {
    const result = await attemptPurchaseConfirmation({
      orderId: order.id,
      email: order.purchaser_email,
      buyerName: "there",
      childName: book.child_name || "your child",
      bookId,
      dashboardUrl: new URL("/dashboard", request.url).toString(),
    });
    return redirectWith(
      request,
      "notice",
      result.alreadySent
        ? "Purchase confirmation was already sent."
        : "Purchase confirmation sent.",
    );
  } catch (error) {
    await recordOperationalError(bookId, "purchase_confirmation", error);
    return redirectWith(
      request,
      "error",
      "Purchase confirmation retry failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}