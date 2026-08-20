import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  canExposeDeliveredArtefacts,
  isExactVerifiedPayment,
} from "@/lib/book-access";

export async function GET(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }
  const bookId = request.nextUrl.searchParams.get("bookId");
  const checkoutSessionId = request.nextUrl.searchParams.get("sessionId");

  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  const { data: book, error } = await supabaseAdmin
    .from("books")
    .select(
      "id, user_id, status, lifecycle_stage, approved_version_id, pdf_url, stage_delivered_at",
    )
    .eq("id", bookId)
    .single();

  if (error || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let authorised = Boolean(user && user.id === book.user_id);
  let hasExactVerifiedPayment = false;
  if (!authorised && checkoutSessionId) {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status, version_id, payment_verified_at")
      .eq("book_id", bookId)
      .eq("stripe_checkout_session_id", checkoutSessionId)
      .maybeSingle();
    authorised = Boolean(order);
    hasExactVerifiedPayment = order
      ? isExactVerifiedPayment({
          approvedVersionId: book.approved_version_id,
          orderVersionId: order.version_id,
          orderStatus: order.status,
          paymentVerifiedAt: order.payment_verified_at,
        })
      : false;
  }
  if (!authorised) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }
  if (user && user.id === book.user_id && book.approved_version_id) {
    const { data: paidOrder } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("book_id", bookId)
      .eq("version_id", book.approved_version_id)
      .in("status", ["paid", "fulfilled"])
      .not("payment_verified_at", "is", null)
      .limit(1)
      .maybeSingle();
    hasExactVerifiedPayment = Boolean(paidOrder);
  }

  const canExposeDeliveryLinks = canExposeDeliveredArtefacts({
    stage: book.lifecycle_stage,
    approvedVersionId: book.approved_version_id,
    hasExactVerifiedPayment,
  });
  const { data: artefacts } = canExposeDeliveryLinks
    ? await supabaseAdmin
        .from("product_artefacts")
        .select("kind, url, access_url")
        .eq("book_id", bookId)
        .eq("version_id", book.approved_version_id)
        .not("durable_verified_at", "is", null)
        .not("access_verified_at", "is", null)
        .in("kind", ["pdf_digital", "epub"])
    : { data: [] };
  const durableLinks = (artefacts ?? [])
    .map((item) => ({
      label: item.kind === "epub" ? "Download the ePub" : "Download the book",
      url: item.access_url || item.url,
    }))
    .filter((item) => Boolean(item.url));

  return NextResponse.json({
    // Prefer the canonical title-cased lifecycle_stage; fall back to legacy status.
    lifecycleStage: (book as Record<string, unknown>).lifecycle_stage ?? null,
    status: book.status,
    pdfUrl: canExposeDeliveryLinks
      ? ((book as Record<string, unknown>).pdf_url ?? null)
      : null,
    deliveredAt:
      (book as Record<string, unknown>).stage_delivered_at ?? null,
    durableLinks,
  });
}
