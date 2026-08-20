import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/shared/Navbar";
import BookStatusPoller from "./BookStatusPoller";
import ConversionTracker from "@/components/shared/ConversionTracker";
import { centsToMajorUnits } from "@/lib/analytics";
import { Sparkles, BookOpen, Share2, PlusCircle } from "lucide-react";
import {
  canExposeDeliveredArtefacts,
  canIssueFinalBookSignedLink,
  isExactVerifiedPayment,
} from "@/lib/book-access";
import {
  createFinalBookSignedUrl,
} from "@/lib/storage-urls";

export const metadata: Metadata = {
  title: "Order Complete - Starmee",
  description: "Your personalised storybook is being created!",
};

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string; book_id?: string }>;
}

async function getUser() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
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

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id, book_id } = await searchParams;

  if (!session_id && !book_id) {
    redirect("/dashboard");
  }

  const user = await getUser();
  if (!user && !session_id) {
    redirect("/auth/login?redirectTo=/dashboard");
  }

  // Resolve book ID from Stripe session or query param
  let bookId = book_id || null;
  let childName = "";
  let themeTitle = "";
  let purchaseValue: number | null = null;
  let purchaseCurrency = "USD";
  let hasExactVerifiedPayment = false;
  let authorisedOrderId: string | null = null;

  if (session_id && isStripeConfigured()) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);

      // Verify session ownership: the session's metadata user_id must match
      // the authenticated user. If there's no user session we still show the
      // page (Stripe redirected them here), but we don't leak another user's
      // book.
      const sessionUserId = session.metadata?.user_id;
      if (user && sessionUserId && sessionUserId !== user.id) {
        // Mismatch — this session does not belong to the current user.
        console.warn(
          `[success] Session ${session_id} user_id ${sessionUserId} ` +
            `does not match authenticated user ${user.id}. Redirecting.`
        );
        redirect("/dashboard");
      }

      bookId = session.metadata?.book_id || bookId;
      purchaseValue = centsToMajorUnits(session.amount_total);
      purchaseCurrency = (session.currency ?? "usd").toUpperCase();
    } catch (err) {
      console.error("Failed to retrieve Stripe session:", err);
    }
  }

  if (!bookId) {
    redirect("/dashboard");
  }

  // Fetch book info — verify the book belongs to the authenticated user
  const { data: book } = await supabaseAdmin
    .from("books")
    .select(
      "id, child_name, theme_title, status, pdf_url, is_purchased, user_id, lifecycle_stage, stage_delivered_at, approved_version_id",
    )
    .eq("id", bookId)
    .single();

  if (!book) {
    redirect("/dashboard");
  }

  // Ownership check: authenticated users can only see their own books on this page.
  if (user && book.user_id && book.user_id !== user.id) {
    console.warn(
      `[success] Book ${bookId} owner ${book.user_id} does not match user ${user.id}. Redirecting.`
    );
    redirect("/dashboard");
  }

  // Verify there is a paid order for this book (cross-check the order record)
  if (session_id) {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status, user_id, book_id, version_id, payment_verified_at")
      .eq("stripe_checkout_session_id", session_id)
      .maybeSingle();

    // If an order exists, its book_id must match and user must be the owner
    if (order) {
      if (order.book_id && order.book_id !== bookId) {
        console.warn(
          `[success] Order book_id ${order.book_id} does not match URL book_id ${bookId}.`
        );
        redirect("/dashboard");
      }
      if (user && order.user_id && order.user_id !== user.id) {
        console.warn(
          `[success] Order user_id ${order.user_id} does not match authenticated user ${user.id}.`
        );
        redirect("/dashboard");
      }
      hasExactVerifiedPayment = isExactVerifiedPayment({
        approvedVersionId: book.approved_version_id,
        orderVersionId: order.version_id,
        orderStatus: order.status,
        paymentVerifiedAt: order.payment_verified_at,
      });
      authorisedOrderId = hasExactVerifiedPayment ? order.id : null;
    } else {
      redirect("/dashboard");
    }
  } else if (user && book.approved_version_id) {
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
    authorisedOrderId = paidOrder?.id ?? null;
  }

  childName = book.child_name || "Your child";
  themeTitle = book.theme_title || "";

  // The canonical lifecycle stage drives the customer tracker. Pass the legacy
  // status separately so the tracker only falls back to it when the canonical
  // stage is null.
  const canonicalStage = (book.lifecycle_stage as string | null) ?? null;
  const legacyStatus = (book.status as string | null) ?? null;
  const deliveredAt = (book.stage_delivered_at as string | null) ?? null;
  let hasAccessAuthorisation = Boolean(
    user && user.id === book.user_id && hasExactVerifiedPayment,
  );
  if (!hasAccessAuthorisation && authorisedOrderId && book.approved_version_id) {
    const { data: accessGrant } = await supabaseAdmin
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
    hasAccessAuthorisation = Boolean(
      accessGrant &&
        (!accessGrant.expires_at ||
          Date.parse(accessGrant.expires_at) > Date.now()),
    );
  }
  const canExposeDeliveryLinks = canExposeDeliveredArtefacts({
    stage: canonicalStage,
    approvedVersionId: book.approved_version_id,
    hasExactVerifiedPayment,
  }) && hasAccessAuthorisation;

  // Durable, verified final storage/access links — only shown once the book is
  // Delivered. We only surface artefacts confirmed present in storage
  // (durable_verified_at) so we never advertise a link that may not resolve.
  const durableLinks: { label: string; url: string }[] = [];
  if (canExposeDeliveryLinks) {
    const { data: artefacts } = await supabaseAdmin
      .from("product_artefacts")
      .select("kind, version_id, storage_path, metadata, durable_verified_at, created_at")
      .eq("book_id", bookId)
      .eq("version_id", book.approved_version_id)
      .not("durable_verified_at", "is", null)
      .not("access_verified_at", "is", null)
      .in("kind", ["pdf_digital", "epub"])
      .order("created_at", { ascending: false });

    for (const a of artefacts ?? []) {
      const metadata =
        (a.metadata as Record<string, unknown> | null) ?? null;
      if (!canIssueFinalBookSignedLink({
        stage: canonicalStage,
        bookId,
        approvedVersionId: book.approved_version_id,
        artefactVersionId: a.version_id,
        storagePath: a.storage_path,
        storageBucket:
          typeof metadata?.storage_bucket === "string"
            ? metadata.storage_bucket
            : null,
        hasExactVerifiedPayment,
        hasAccessAuthorisation,
      })) continue;
      const url = a.storage_path
        ? await createFinalBookSignedUrl(a.storage_path)
        : null;
      if (!url) continue;
      const kind = (a as Record<string, unknown>).kind as string;
      const label =
        kind === "epub" ? "Download the ePub" : "Download the book";
      // De-duplicate by url; keep the first (most recent) of each label.
      if (!durableLinks.some((l) => l.url === url)) {
        durableLinks.push({ label, url });
      }
    }
  }
  const pdfUrl =
    durableLinks.find((link) => link.label === "Download the book")?.url ??
    null;

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar user={user} />

      <main className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
        <ConversionTracker
          kind="purchase"
          transactionId={session_id ?? bookId}
          value={purchaseValue}
          currency={purchaseCurrency}
        />
        {/* Confetti CSS animation */}
        <div className="confetti-container" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                backgroundColor: [
                  "#7C3AED",
                  "#EC4899",
                  "#F59E0B",
                  "#10B981",
                  "#3B82F6",
                ][i % 5],
              }}
            />
          ))}
        </div>

        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 mb-6">
            <Sparkles className="h-10 w-10 text-[#7C3AED]" />
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {childName}&apos;s storybook is being created!
          </h1>
          {themeTitle && (
            <p className="text-gray-500 text-lg">{themeTitle}</p>
          )}
        </div>

        {/* Status / Polling area */}
        <BookStatusPoller
          bookId={bookId}
          initialStatus={canonicalStage}
          initialLegacyStatus={legacyStatus}
          initialPdfUrl={pdfUrl}
          childName={childName}
          initialDeliveredAt={deliveredAt}
          initialDurableLinks={durableLinks}
          checkoutSessionId={session_id ?? null}
        />

        {/* Account note */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 px-4 py-2 rounded-full text-sm font-medium">
            <BookOpen className="h-4 w-4" />
            Saved to your account
          </div>
        </div>

        {/* Bottom CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Create Another Book
          </Link>
          <button
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:border-pink-300 hover:text-pink-600 transition-colors"
            onClick={undefined}
            title="Share feature coming soon"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        {/* Confetti styles */}
        <style>{`
          .confetti-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            z-index: 50;
            animation: fadeOutConfetti 5s forwards;
          }
          @keyframes fadeOutConfetti {
            0%, 80% { opacity: 1; }
            100% { opacity: 0; }
          }
          .confetti-piece {
            position: absolute;
            top: -10px;
            width: 10px;
            height: 10px;
            border-radius: 2px;
            animation: confettiFall linear forwards;
          }
          @keyframes confettiFall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}</style>
      </main>
    </div>
  );
}
