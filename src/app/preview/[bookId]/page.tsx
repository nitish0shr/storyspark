import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/utils";
import { toViewableUrls } from "@/lib/storage-urls";
import BookViewer from "@/components/preview/BookViewer";
import ConversionTracker from "@/components/shared/ConversionTracker";
import Navbar from "@/components/shared/Navbar";
import { ChevronLeft, Sparkles } from "lucide-react";
import { decideBookAccess } from "@/lib/book-access";
import { isCreatorOwner } from "@/lib/creator-session";

interface PreviewPageProps {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Canonical lifecycle stage values (title-cased, as stored in the DB)
// ---------------------------------------------------------------------------
const LIFECYCLE = {
  READY_FOR_PURCHASE: "Ready for Purchase",
  PURCHASED: "Purchased",
  DELIVERED: "Delivered",
} as const;

// ---------------------------------------------------------------------------
// Token helpers — access_grants table
// ---------------------------------------------------------------------------

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

interface GrantResult {
  versionId: string;
  accessKind: string;
  permitsPreview: boolean;
  permitsFullBook: boolean;
}

/**
 * Validate an opaque access token against access_grants.
 * The grant must:
 *   - have a matching token_hash for this bookId
 *   - not be revoked (revoked_at IS NULL)
 *   - not be expired (expires_at IS NULL or in the future)
 *   - point to exactly the supplied approvedVersionId
 */
async function resolveAccessGrant(
  rawToken: string,
  bookId: string,
  approvedVersionId: string,
): Promise<GrantResult | null> {
  if (!rawToken || typeof rawToken !== "string") return null;

  const { data, error } = await supabaseAdmin
    .from("access_grants")
    .select("version_id, access_kind, expires_at, revoked_at, order_id")
    .eq("token_hash", hashToken(rawToken))
    .eq("book_id", bookId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.revoked_at) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return null;

  // Token must be scoped to the exact approved version — reject mismatches
  if (data.version_id !== approvedVersionId) return null;

  if (data.access_kind === "preview") {
    return {
      versionId: data.version_id,
      accessKind: data.access_kind,
      permitsPreview: true,
      permitsFullBook: false,
    };
  }

  if (
    !["full_book", "download", "gift"].includes(data.access_kind) ||
    !data.order_id
  ) {
    return null;
  }

  // A full-book token is only a capability for the exact verified paid order.
  // A preview token can never be promoted merely because the book later moves
  // to Purchased or Delivered.
  const { data: paidOrder, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("id", data.order_id)
    .eq("book_id", bookId)
    .eq("version_id", approvedVersionId)
    .in("status", ["paid", "fulfilled"])
    .not("stripe_payment_intent_id", "is", null)
    .not("payment_verified_at", "is", null)
    .maybeSingle();
  if (orderError || !paidOrder) return null;

  return {
    versionId: data.version_id,
    accessKind: data.access_kind,
    permitsPreview: false,
    permitsFullBook: true,
  };
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getBookCore(bookId: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return null;

  const { data: book, error } = await supabaseAdmin
    .from("books")
    .select(
      "id, child_name, theme_id, theme_title, status, user_id, is_purchased, dedication, lifecycle_stage, approved_version_id"
    )
    .eq("id", bookId)
    .single();

  if (error || !book) return null;
  return book;
}

interface VersionPage {
  page_number: number;
  text_content: string;
  illustration_url: string | null;
  audio_url: string | null;
  is_preview: boolean;
}

/**
 * Fetch pages from book_version_pages for the given version.
 *
 * When previewOnly is true returns only rows where is_preview = true, capped at 2.
 * When lifecycle_stage is canonical (set), we NEVER fall back to legacy book_pages —
 * absence of version pages is a hard error.
 *
 * For books without a lifecycle_stage (legacy flow), falls back to book_pages.
 */
async function getVersionPages(
  bookId: string,
  approvedVersionId: string,
  previewOnly: boolean,
): Promise<VersionPage[]> {
  let query = supabaseAdmin
    .from("book_version_pages")
    .select("page_number, text_content, illustration_url, audio_url, is_preview")
    .eq("version_id", approvedVersionId)
    .order("page_number", { ascending: true });

  if (previewOnly) {
    query = query.eq("is_preview", true).limit(2);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch version pages: ${error.message}`);
  // Canonical lifecycle + no pages = configuration error, not a fallback opportunity
  if (!data || data.length === 0) throw new Error("No pages found for approved version");

  return data as VersionPage[];
}

/**
 * Legacy-only fallback for books without a lifecycle_stage.
 * Returns at most 2 pages (preview) or all pages (full access).
 */
async function getLegacyPages(
  bookId: string,
  previewOnly: boolean,
): Promise<VersionPage[]> {
  const { data, error } = await supabaseAdmin
    .from("book_pages")
    .select("page_number, text, illustration_url, audio_url")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true });

  if (error || !data) return [];

  const rows = previewOnly ? data.slice(0, 2) : data;
  return rows.map((p) => ({
    page_number: p.page_number,
    text_content: p.text,
    illustration_url: p.illustration_url,
    audio_url: p.audio_url,
    is_preview: previewOnly,
  }));
}

async function getUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    name: profile?.full_name,
    avatarUrl: profile?.avatar_url,
  };
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const { bookId } = await params;
  const book = await getBookCore(bookId);

  if (!book) return { title: "Book Not Found - Starmee" };

  const appUrl = getAppUrl();
  const title = `${book.child_name}'s Story - Starmee`;
  const description = `Preview ${book.child_name}'s personalised storybook — a magical tale crafted just for them.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${appUrl}/preview/${bookId}`,
      images: [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [],
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { bookId } = await params;
  const { token: rawToken } = await searchParams;

  const [book, user] = await Promise.all([getBookCore(bookId), getUser()]);

  if (!book) notFound();

  // -------------------------------------------------------------------------
  // Lifecycle / status analysis
  // -------------------------------------------------------------------------
  const lifecycleStage: string | null | undefined = book.lifecycle_stage;
  const approvedVersionId: string | null | undefined = book.approved_version_id;
  const isCanonical = lifecycleStage != null; // book is in the new lifecycle system

  // -------------------------------------------------------------------------
  // Authorisation
  //
  // Owner   = authenticated user whose id matches book.user_id
  // Visitor = holder of a valid access_grants token scoped to the exact
  //           approved version (preview or full grant)
  // -------------------------------------------------------------------------
  const isOwner = isCreatorOwner(user?.id, book.user_id);

  let grant: GrantResult | null = null;
  if (rawToken && approvedVersionId) {
    grant = await resolveAccessGrant(rawToken, bookId, approvedVersionId);
  }

  const accessDecision = decideBookAccess({
    stage: lifecycleStage ?? null,
    isOwner,
    grantKind: grant?.accessKind ?? null,
    grantBoundToVerifiedPayment: grant?.permitsFullBook === true,
  });
  const canPreviewApprovedVersion = accessDecision.canPreview;
  const canReadFullBook = accessDecision.canReadFullBook;

  // -------------------------------------------------------------------------
  // Gate on canonical lifecycle stages (title-cased)
  // -------------------------------------------------------------------------
  if (isCanonical) {
    // "Ready for Purchase" requires approved_version_id — without it the book
    // is unapproved and must not be shown.
    if (lifecycleStage === LIFECYCLE.READY_FOR_PURCHASE && !approvedVersionId) {
      return (
        <div className="min-h-screen bg-[#FFFBF5]">
          <Navbar user={user} />
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
              <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              This Version Is Not Yet Approved
            </h1>
            <p className="text-gray-500 max-w-md mb-8">
              This book is awaiting approval. Please check your dashboard for updates.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[#7C3AED] hover:text-[#6D28D9] font-medium transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    if (
      lifecycleStage === LIFECYCLE.READY_FOR_PURCHASE &&
      !canPreviewApprovedVersion
    ) {
      notFound();
    }

    // Any canonical stage that is not "Ready for Purchase", "Purchased", or "Delivered"
    // is a stale/invalid state — block access unconditionally.
    const knownCanonicalStages = [
      LIFECYCLE.READY_FOR_PURCHASE,
      LIFECYCLE.PURCHASED,
      LIFECYCLE.DELIVERED,
    ] as string[];
    if (!knownCanonicalStages.includes(lifecycleStage!)) {
      return (
        <div className="min-h-screen bg-[#FFFBF5]">
          <Navbar user={user} />
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
              <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              This Version Is No Longer Available
            </h1>
            <p className="text-gray-500 max-w-md mb-8">
              This book link has expired or the book is awaiting re-approval. Please
              check your dashboard for the latest version.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[#7C3AED] hover:text-[#6D28D9] font-medium transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    // "Purchased" or "Delivered" — full access only for authorised callers
    const isPurchasedOrDelivered =
      lifecycleStage === LIFECYCLE.PURCHASED || lifecycleStage === LIFECYCLE.DELIVERED;

    if (isPurchasedOrDelivered && !canReadFullBook) {
      // Unauthenticated visitor without a valid grant — show not-found rather
      // than revealing the book exists.
      notFound();
    }

    // At this point the lifecycle is valid. Resolve pages.
    // approvedVersionId is guaranteed non-null for all canonical stages that
    // reach here (READY_FOR_PURCHASE was checked above; PURCHASED/DELIVERED
    // always have one set at transition time).
    const versionId = approvedVersionId!;
    const isFullAccess = isPurchasedOrDelivered && canReadFullBook;
    const showPaywall = !isFullAccess && lifecycleStage === LIFECYCLE.READY_FOR_PURCHASE && !book.is_purchased;

    let rawPages: VersionPage[];
    try {
      rawPages = await getVersionPages(bookId, versionId, !isFullAccess);
    } catch {
      // Hard error — canonical book with no version pages is misconfigured
      return (
        <div className="min-h-screen bg-[#FFFBF5]">
          <Navbar user={user} />
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <Sparkles className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Something Went Wrong
            </h1>
            <p className="text-gray-500 max-w-md mb-8">
              We could not load the pages for this book. Please contact support.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[#7C3AED] hover:text-[#6D28D9] font-medium transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    const sortedPages = [...rawPages].sort((a, b) => a.page_number - b.page_number);
    const signedPageUrls = await toViewableUrls(sortedPages.map((p) => p.illustration_url));

    // Pass the raw token to BookViewer so it can forward it to PaywallOverlay →
    // checkout. The share URL is constructed without the token inside BookViewer.
    return (
      <div className="min-h-screen bg-[#FFFBF5]">
        <ConversionTracker kind="preview" transactionId={bookId} value={null} />
        <Navbar user={user} />
        <main className="py-6 sm:py-10">
          <div className="text-center mb-6 sm:mb-8 px-4">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900">
              {book.child_name}&apos;s Story
            </h1>
            {book.theme_title && (
              <p className="mt-1 text-gray-500">{book.theme_title}</p>
            )}
          </div>

          <BookViewer
            pages={sortedPages.map((p, i) => ({
              pageNumber: p.page_number,
              text: p.text_content,
              illustrationUrl: (signedPageUrls[i] ?? p.illustration_url) ?? undefined,
              audioUrl: p.audio_url || null,
            }))}
            previewPageCount={sortedPages.length}
            isFullAccess={isFullAccess}
            showPaywall={showPaywall}
            childName={book.child_name}
            themeId={book.theme_id}
            themeTitle={book.theme_title}
            bookId={book.id}
            versionId={versionId}
            accessToken={rawToken}
            price="$9.99"
            dedication={book.dedication}
          />
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Legacy flow — no lifecycle_stage set
  // -------------------------------------------------------------------------

  // Legacy rows have no exact-version grant binding. They must be reconciled
  // before an emailed link can be honoured; only the authenticated owner may
  // inspect them in the meantime.
  if (!isOwner) notFound();

  const isReady =
    book.status === "preview_ready" ||
    book.status === "completed" ||
    book.status === "purchased" ||
    book.status === "pending_approval" ||
    book.status === "approved";

  const awaitingReview = book.status === "pending_review";

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#FFFBF5]">
        <Navbar user={user} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-[#7C3AED] animate-pulse" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            {awaitingReview ? "Nearly Ready" : "Your Story Is Being Created"}
          </h1>
          <p className="text-gray-500 max-w-md mb-8">
            {awaitingReview
              ? `The story and pictures for ${book.child_name} are finished. A real person is now checking every page before we share it, which is how we keep each Starmee book safe for little readers.`
              : `${book.child_name}'s magical story is being created right now. This usually takes about two minutes.`}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[#7C3AED] hover:text-[#6D28D9] font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isPurchasedLegacy = book.is_purchased;
  const isPendingReview =
    isPurchasedLegacy &&
    (book.status === "pending_approval" || book.status === "approved");

  // Legacy full access: purchased and not still in review
  const isFullAccessLegacy = isPurchasedLegacy && !isPendingReview;

  const rawPages = await getLegacyPages(bookId, !isFullAccessLegacy);
  const sortedPages = [...rawPages].sort((a, b) => a.page_number - b.page_number);
  const signedPageUrls = await toViewableUrls(sortedPages.map((p) => p.illustration_url));

  const isNewCreation = isOwner && book.status === "preview_ready";

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <ConversionTracker kind="preview" transactionId={bookId} value={null} />
      <Navbar user={user} />

      <main className="py-6 sm:py-10">
        {isNewCreation && (
          <div className="max-w-lg mx-auto px-4 mb-4">
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#7C3AED] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Create
            </Link>
          </div>
        )}

        <div className="text-center mb-6 sm:mb-8 px-4">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900">
            {book.child_name}&apos;s Story
          </h1>
          {book.theme_title && (
            <p className="mt-1 text-gray-500">{book.theme_title}</p>
          )}
        </div>

        {isPendingReview && (
          <div className="max-w-lg mx-auto px-4 mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex gap-3 items-start">
              <span className="text-amber-500 text-xl mt-0.5">⏳</span>
              <div>
                <p className="font-semibold text-amber-800 text-sm mb-0.5">
                  Your book is being reviewed
                </p>
                <p className="text-amber-700 text-sm leading-relaxed">
                  We personally check every book before releasing it. You&apos;ll
                  receive an email as soon as{" "}
                  <strong>{book.child_name}&apos;s</strong> full story is ready —
                  usually within a few hours. In the meantime, enjoy the preview
                  below!
                </p>
              </div>
            </div>
          </div>
        )}

        <BookViewer
          pages={sortedPages.map((p, i) => ({
            pageNumber: p.page_number,
            text: p.text_content,
            illustrationUrl: (signedPageUrls[i] ?? p.illustration_url) ?? undefined,
            audioUrl: p.audio_url || null,
          }))}
          previewPageCount={sortedPages.length}
          isFullAccess={isFullAccessLegacy}
          showPaywall={!isFullAccessLegacy && !isPurchasedLegacy}
          childName={book.child_name}
          themeId={book.theme_id}
          themeTitle={book.theme_title}
          bookId={book.id}
          versionId={undefined}
          accessToken={undefined}
          price="$9.99"
          dedication={book.dedication}
        />
      </main>
    </div>
  );
}
