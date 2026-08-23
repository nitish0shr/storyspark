import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Book } from "@/types/book";
import { ChildProfile } from "@/types/child";
import { Order } from "@/types/order";
import { themes } from "@/data/themes";
import Navbar from "@/components/shared/Navbar";
import ChildProfileCard from "@/components/dashboard/ChildProfileCard";
import BookLibrary from "@/components/dashboard/BookLibrary";
import OrderHistory from "@/components/dashboard/OrderHistory";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard";
import { Sparkles, Plus, UserPlus, BookOpen, Receipt, Crown } from "lucide-react";
import { toViewableUrls } from "@/lib/storage-urls";

export const metadata = {
  title: "Dashboard | Starmee Stories",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login?redirectTo=/dashboard");
  }

  const [childProfilesRes, booksRes, ordersRes, subscriptionsRes] = await Promise.all([
    supabase.from("child_profiles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("books").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).in("status", ["active", "paused", "past_due"]).order("created_at", { ascending: false }).limit(1),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const childProfiles: ChildProfile[] = (childProfilesRes.data ?? []).map((row: any) => ({
    id: row.id, userId: row.user_id, name: row.name, age: row.age, gender: row.gender,
    photoUrl: row.photo_url, photoProcessedUrl: row.photo_processed_url,
    appearanceProfile: row.appearance_profile
      ? { ...row.appearance_profile, referenceSheetUrl: undefined }
      : row.appearance_profile,
    createdAt: row.created_at, updatedAt: row.updated_at,
  }));

  const books: Book[] = (booksRes.data ?? []).map((row: any) => ({
    id: row.id, userId: row.user_id, childProfileId: row.child_profile_id,
    secondChildProfileId: row.second_child_profile_id ?? null, themeId: row.theme_id,
    language: row.language ?? "en", status: row.status, contextualAnswers: row.contextual_answers,
    storyText: row.story_text, illustrationUrls: row.illustration_urls, previewPages: row.preview_pages,
    pdfUrl: row.pdf_url, pdfPrintUrl: row.pdf_print_url, pageCount: row.page_count,
    lifecycleStage: row.lifecycle_stage ?? null,
    operationalState: row.operational_state ?? null,
    operationalError: row.operational_error ?? null,
    currentVersionId: row.current_version_id ?? null,
    reviewVersionId: row.review_version_id ?? null,
    approvedVersionId: row.approved_version_id ?? null,
    lifecycleRevision: row.lifecycle_revision ?? 0,
    stageTimestamps: {
      generatedAt: row.stage_generated_at ?? null,
      underReviewAt: row.stage_under_review_at ?? null,
      changesRequestedAt: row.stage_changes_requested_at ?? null,
      revisedAt: row.stage_revised_at ?? null,
      approvedAt: row.stage_approved_at ?? null,
      readyForPurchaseAt: row.stage_ready_for_purchase_at ?? null,
      purchasedAt: row.stage_purchased_at ?? null,
      deliveredAt: row.stage_delivered_at ?? null,
    },
    createdAt: row.created_at, updatedAt: row.updated_at,
  }));

  // Private bucket: swap stored URLs for short-lived signed ones.
  for (const b of books) {
    if (Array.isArray(b.illustrationUrls) && b.illustrationUrls.length) {
      b.illustrationUrls = (await toViewableUrls(b.illustrationUrls)).filter(Boolean) as string[];
    }
  }
  const orders: Order[] = (ordersRes.data ?? []).map((row: any) => ({
    id: row.id, userId: row.user_id, bookId: row.book_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    status: row.status, amountCents: row.amount_cents, currency: row.currency,
    tier: row.tier, isGift: row.is_gift, giftRecipientName: row.gift_recipient_name,
    giftRecipientEmail: row.gift_recipient_email, giftMessage: row.gift_message,
    emailDelivered: row.email_delivered, createdAt: row.created_at,
    versionId: row.version_id ?? null,
    checkoutIdempotencyKey: row.checkout_idempotency_key ?? null,
    paymentVerifiedAt: row.payment_verified_at ?? null,
    purchaseConfirmationSentAt: row.purchase_confirmation_sent_at ?? null,
    fulfilledAt: row.fulfilled_at ?? null,
    idempotencyKey: row.idempotency_key ?? null,
    paymentConfirmedAt: row.payment_confirmed_at ?? null,
    paymentMethod: row.payment_method ?? null,
    paymentMetadata: row.payment_metadata ?? null,
  }));
  const activeSubscription = (subscriptionsRes.data ?? [])[0] ?? null;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const navUser = {
    id: user.id,
    email: user.email ?? undefined,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
    avatarUrl: user.user_metadata?.avatar_url ?? undefined,
  };

  return (
    <div className="min-h-screen bg-[#FDF5E7] bg-stars">
      <Navbar user={navUser} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#262625]">
              Welcome back{navUser.name ? `, ${navUser.name.split(" ")[0]}` : ""}!
            </h1>
            <p className="font-body text-[#262625]/60 mt-1">
              Manage your storybooks and create new adventures.
            </p>
            {activeSubscription && (
              <span className="inline-flex items-center gap-1.5 mt-2 bg-[#FFDE59] border-2 border-[#262625] text-[#262625] text-xs font-bold px-3 py-1 rounded-full shadow-[2px_2px_0px_#262625]">
                <Crown className="h-3.5 w-3.5" />
                Book Club Member
              </span>
            )}
          </div>
          <Link
            href="/create"
            className="btn-chunky inline-flex items-center justify-center gap-2 bg-[#FFDE59] px-6 py-3 font-heading font-bold text-[#262625] text-sm shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            Create New Book
          </Link>
        </div>

        {/* Child Profiles Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#CB6CE6]/20 border border-[#CB6CE6]/30">
                <UserPlus className="h-4 w-4 text-[#5E17EB]" />
              </div>
              <h2 className="font-heading text-xl font-bold text-[#262625]">Child Profiles</h2>
              {childProfiles.length > 0 && (
                <span className="font-body text-sm text-[#262625]/40 ml-1">({childProfiles.length})</span>
              )}
            </div>
          </div>

          {childProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {childProfiles.map((child) => (
                <ChildProfileCard key={child.id} child={child} />
              ))}
              <Link
                href="/create"
                className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#262625]/20 bg-white/50 hover:bg-[#CB6CE6]/5 hover:border-[#CB6CE6] transition-all duration-200 p-8 min-h-[140px]"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#CB6CE6]/15 group-hover:bg-[#CB6CE6]/25 transition-colors border-2 border-[#CB6CE6]/30">
                  <Plus className="h-5 w-5 text-[#5E17EB]" />
                </div>
                <span className="font-body text-sm font-bold text-[#5E17EB]">Add a Child</span>
              </Link>
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl border-2 border-dashed border-[#262625]/15 bg-white/40">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#CB6CE6]/15 border-2 border-[#CB6CE6]/20 mb-4">
                <UserPlus className="h-7 w-7 text-[#5E17EB]" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[#262625] mb-1">
                Add your first child profile
              </h3>
              <p className="font-body text-sm text-[#262625]/50 mb-5 max-w-sm mx-auto">
                Start by adding your child&apos;s details to create personalised storybooks.
              </p>
              <Link href="/create" className="btn-chunky inline-flex items-center gap-2 bg-[#FFDE59] px-5 py-2.5 font-heading font-bold text-[#262625] text-sm">
                <Plus className="h-4 w-4" />
                Get Started
              </Link>
            </div>
          )}
        </section>

        {/* Subscription Section */}
        {activeSubscription && (
          <section className="mb-12">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFDE59]/40 border border-[#FFDE59]">
                <Crown className="h-4 w-4 text-[#262625]" />
              </div>
              <h2 className="font-heading text-xl font-bold text-[#262625]">My Subscription</h2>
            </div>
            <div className="max-w-md">
              <SubscriptionCard
                subscription={{
                  id: activeSubscription.id,
                  status: activeSubscription.status,
                  current_period_end: activeSubscription.current_period_end,
                  cancel_at_period_end: activeSubscription.cancel_at_period_end,
                  books_generated: activeSubscription.books_generated ?? 0,
                  child_profile_id: activeSubscription.child_profile_id,
                }}
                childName={childProfiles.find((c) => c.id === activeSubscription.child_profile_id)?.name ?? "Your child"}
              />
            </div>
          </section>
        )}

        {/* Book Library Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#5E17EB]/10 border border-[#5E17EB]/20">
              <BookOpen className="h-4 w-4 text-[#5E17EB]" />
            </div>
            <h2 className="font-heading text-xl font-bold text-[#262625]">Book Library</h2>
            {books.length > 0 && (
              <span className="font-body text-sm text-[#262625]/40 ml-1">({books.length})</span>
            )}
          </div>
          <BookLibrary books={books} childProfiles={childProfiles} themes={themes} />
        </section>

        {/* Order History Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200">
              <Receipt className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="font-heading text-xl font-bold text-[#262625]">Order History</h2>
            {orders.length > 0 && (
              <span className="font-body text-sm text-[#262625]/40 ml-1">({orders.length})</span>
            )}
          </div>
          <OrderHistory orders={orders} books={books} childProfiles={childProfiles} themes={themes} />
        </section>
      </main>
    </div>
  );
}
