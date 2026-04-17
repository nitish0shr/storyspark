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
import { Sparkles, Plus, UserPlus, BookOpen, Receipt } from "lucide-react";

export const metadata = {
  title: "Dashboard | Starmee",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login?redirectTo=/dashboard");
  }

  // Fetch data in parallel
  const [childProfilesRes, booksRes, ordersRes] = await Promise.all([
    supabase
      .from("child_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("books")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  // Map snake_case DB columns to camelCase types
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const childProfiles: ChildProfile[] = (childProfilesRes.data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    age: row.age,
    gender: row.gender,
    photoUrl: row.photo_url,
    photoProcessedUrl: row.photo_processed_url,
    appearanceProfile: row.appearance_profile,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const books: Book[] = (booksRes.data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    childProfileId: row.child_profile_id,
    themeId: row.theme_id,
    status: row.status,
    contextualAnswers: row.contextual_answers,
    storyText: row.story_text,
    illustrationUrls: row.illustration_urls,
    previewPages: row.preview_pages,
    pdfUrl: row.pdf_url,
    pdfPrintUrl: row.pdf_print_url,
    pageCount: row.page_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const orders: Order[] = (ordersRes.data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    status: row.status,
    amountCents: row.amount_cents,
    currency: row.currency,
    tier: row.tier,
    isGift: row.is_gift,
    giftRecipientName: row.gift_recipient_name,
    giftRecipientEmail: row.gift_recipient_email,
    giftMessage: row.gift_message,
    emailDelivered: row.email_delivered,
    createdAt: row.created_at,
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const navUser = {
    id: user.id,
    email: user.email ?? undefined,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
    avatarUrl: user.user_metadata?.avatar_url ?? undefined,
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar user={navUser} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">
              Welcome back
              {navUser.name ? `, ${navUser.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your storybooks and create new adventures.
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-semibold text-sm px-6 py-3 shadow-lg shadow-violet-200/50 transition-all duration-200 shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            Create New Book
          </Link>
        </div>

        {/* Child Profiles Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100">
                <UserPlus className="h-4 w-4 text-violet-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-gray-900">
                Child Profiles
              </h2>
              {childProfiles.length > 0 && (
                <span className="text-sm text-gray-400 ml-1">
                  ({childProfiles.length})
                </span>
              )}
            </div>
          </div>

          {childProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {childProfiles.map((child) => (
                <ChildProfileCard key={child.id} child={child} />
              ))}

              {/* Add child card */}
              <Link
                href="/create"
                className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/30 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200 p-8 min-h-[140px]"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 group-hover:bg-violet-200 transition-colors">
                  <Plus className="h-5 w-5 text-violet-600" />
                </div>
                <span className="text-sm font-medium text-violet-600">
                  Add a Child
                </span>
              </Link>
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/30">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-100 mb-4">
                <UserPlus className="h-7 w-7 text-violet-500" />
              </div>
              <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">
                Add your first child profile
              </h3>
              <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
                Start by adding your child&apos;s details to create personalized
                storybooks.
              </p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-medium text-sm px-5 py-2.5 shadow-md shadow-violet-200/50 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Get Started
              </Link>
            </div>
          )}
        </section>

        {/* Book Library Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-100">
              <BookOpen className="h-4 w-4 text-pink-600" />
            </div>
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Book Library
            </h2>
            {books.length > 0 && (
              <span className="text-sm text-gray-400 ml-1">
                ({books.length})
              </span>
            )}
          </div>
          <BookLibrary books={books} childProfiles={childProfiles} themes={themes} />
        </section>

        {/* Order History Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100">
              <Receipt className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Order History
            </h2>
            {orders.length > 0 && (
              <span className="text-sm text-gray-400 ml-1">
                ({orders.length})
              </span>
            )}
          </div>
          <OrderHistory
            orders={orders}
            books={books}
            childProfiles={childProfiles}
            themes={themes}
          />
        </section>
      </main>
    </div>
  );
}
