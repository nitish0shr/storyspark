import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  canExposeDeliveredArtefacts,
  canIssueFinalBookSignedLink,
  isExactVerifiedPayment,
} from "@/lib/book-access";
import {
  createFinalBookSignedUrl,
} from "@/lib/storage-urls";

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
  let accessAuthorised = authorised;
  let authorisedOrderId: string | null = null;
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
    authorisedOrderId = hasExactVerifiedPayment ? order?.id ?? null : null;
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
    authorisedOrderId = hasExactVerifiedPayment ? paidOrder?.id ?? null : null;
    accessAuthorised = hasExactVerifiedPayment;
  }
  if (!accessAuthorised && authorisedOrderId && book.approved_version_id) {
    const { data: grant } = await supabaseAdmin
      .from("access_grants")
      .select("id, expires_at")
      .eq("order_id", authorisedOrderId)
      .eq("book_id", bookId)
      .eq("version_id", book.approved_version_id)
      .in("access_kind", ["full_book", "download", "gift"])
      .is("revoked_at", null)
      .not("verified_at", "is", null)
      .limit(1)
      .maybeSingle();
    accessAuthorised = Boolean(
      grant &&
        (!grant.expires_at || Date.parse(grant.expires_at) > Date.now()),
    );
  }

  const canExposeDeliveryLinks = canExposeDeliveredArtefacts({
    stage: book.lifecycle_stage,
    approvedVersionId: book.approved_version_id,
    hasExactVerifiedPayment,
  }) && accessAuthorised;
  const { data: artefacts } = canExposeDeliveryLinks
    ? await supabaseAdmin
        .from("product_artefacts")
        .select("kind, version_id, storage_path, metadata")
        .eq("book_id", bookId)
        .eq("version_id", book.approved_version_id)
        .not("durable_verified_at", "is", null)
        .not("access_verified_at", "is", null)
        .in("kind", ["pdf_digital", "epub"])
    : { data: [] };
  const durableLinks = (
    await Promise.all(
      (artefacts ?? []).map(async (item) => {
        const metadata =
          (item.metadata as Record<string, unknown> | null) ?? null;
        if (!canIssueFinalBookSignedLink({
          stage: book.lifecycle_stage,
          bookId,
          approvedVersionId: book.approved_version_id,
          artefactVersionId: item.version_id,
          storagePath: item.storage_path,
          storageBucket:
            typeof metadata?.storage_bucket === "string"
              ? metadata.storage_bucket
              : null,
          hasExactVerifiedPayment,
          hasAccessAuthorisation: accessAuthorised,
        })) {
          return null;
        }
        const signedUrl = await createFinalBookSignedUrl(item.storage_path);
        return signedUrl
          ? {
              label:
                item.kind === "epub"
                  ? "Download the ePub"
                  : "Download the book",
              url: signedUrl,
            }
          : null;
      }),
    )
  ).filter(
    (item): item is { label: string; url: string } => item !== null,
  );

  return NextResponse.json({
    // Prefer the canonical title-cased lifecycle_stage; fall back to legacy status.
    lifecycleStage: (book as Record<string, unknown>).lifecycle_stage ?? null,
    status: book.status,
    pdfUrl:
      durableLinks.find((item) => item.label === "Download the book")?.url ??
      null,
    deliveredAt:
      (book as Record<string, unknown>).stage_delivered_at ?? null,
    durableLinks,
  });
}
