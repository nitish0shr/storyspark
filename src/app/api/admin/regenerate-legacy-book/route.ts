import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { isOpenAIConfigured } from "@/lib/openai";
import { revokeReviewTokens } from "@/lib/review-tokens";
import {
  CANONICAL_RECOVERY_PAGE_COUNT,
  evaluateLegacyRecoveryEligibility,
  legacyRecoveryConfirmation,
} from "@/lib/legacy-recovery";
import { storySkeletons } from "@/data/story-skeletons";
import { generatePreview } from "@/services/book-pipeline";

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
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isOpenAIConfigured()) {
    return adminBooksRedirect(
      request,
      "error",
      "AI generation is not configured; no recovery work was started.",
    );
  }

  const form = await request.formData();
  const bookId = String(form.get("bookId") || "").trim();
  const confirmation = String(form.get("confirmation") || "").trim();
  const acknowledgesCost = form.get("acknowledgeCost") === "yes";
  if (!bookId) {
    return adminBooksRedirect(request, "error", "Missing book id.");
  }
  if (
    confirmation !== legacyRecoveryConfirmation(bookId) ||
    !acknowledgesCost
  ) {
    return adminBooksRedirect(
      request,
      "error",
      "Recovery requires the exact confirmation phrase and 12-page cost acknowledgement.",
    );
  }

  const { data: book, error: bookError } = await supabaseAdmin
    .from("books")
    .select(
      "id, status, lifecycle_stage, is_purchased, theme_id, operational_state, updated_at",
    )
    .eq("id", bookId)
    .maybeSingle();
  if (bookError || !book) {
    return adminBooksRedirect(request, "error", "Book not found.");
  }

  const [{ data: versions, error: versionsError }, { data: orders, error: ordersError }] =
    await Promise.all([
      supabaseAdmin
        .from("book_versions")
        .select("id, is_complete")
        .eq("book_id", bookId),
      supabaseAdmin
        .from("orders")
        .select("id, status")
        .eq("book_id", bookId)
        .in("status", ["paid", "fulfilled"]),
    ]);
  if (versionsError || ordersError) {
    return adminBooksRedirect(
      request,
      "error",
      "Could not verify recovery evidence; no generation was started.",
    );
  }

  const skeletonPageNumbers = (storySkeletons[book.theme_id] ?? []).map(
    (page) => page.pageNumber,
  );
  const eligibility = evaluateLegacyRecoveryEligibility({
    lifecycleStage: book.lifecycle_stage,
    legacyStatus: book.status,
    isPurchased: Boolean(book.is_purchased),
    paidOrderCount: orders?.length ?? 0,
    completeVersionCount:
      versions?.filter((version) => version.is_complete).length ?? 0,
    operationalState: book.operational_state,
    skeletonPageNumbers,
  });
  if (!eligibility.allowed) {
    return adminBooksRedirect(request, "error", eligibility.reason);
  }

  const queuedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("books")
    .update({
      operational_state: "legacy_recovery_queued",
      operational_error: null,
      updated_at: queuedAt,
    })
    .eq("id", bookId)
    .eq("updated_at", book.updated_at)
    .is("lifecycle_stage", null)
    .select("id")
    .maybeSingle();
  if (claimError || !claimed) {
    return adminBooksRedirect(
      request,
      "error",
      "Another operation changed this book; recovery was not started.",
    );
  }

  await revokeReviewTokens(bookId);
  try {
    await generatePreview(bookId, false, {
      expectedPageCount: CANONICAL_RECOVERY_PAGE_COUNT,
      allowAutomaticRegeneration: false,
      actor: `admin:${user.email || user.id}`,
      controlledLegacyRecovery: true,
    });
  } catch (error) {
    console.error(
      `[legacy-recovery] controlled generation failed for ${bookId}:`,
      error,
    );
    return adminBooksRedirect(
      request,
      "error",
      `Controlled recovery attempt failed for ${bookId.slice(0, 8)}. It was not retried automatically; inspect the recorded failure before confirming another attempt.`,
    );
  }

  return adminBooksRedirect(
    request,
    "notice",
    `Controlled 12-page recovery attempt finished for ${bookId.slice(0, 8)}. Refresh to see its canonical stage.`,
  );
}