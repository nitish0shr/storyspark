import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";
import { PRICE_BASE, PRICE_MID, PRICE_PREMIUM } from "@/lib/stripe";
import Navbar from "@/components/shared/Navbar";
import CheckoutForm from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout - StorySpark",
  description: "Complete your personalized storybook order.",
};

export const dynamic = "force-dynamic";

interface CheckoutPageProps {
  searchParams: Promise<{ bookId?: string }>;
}

async function getUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
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

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const { bookId } = await searchParams;
  const user = await getUser();

  if (!user) {
    redirect("/auth/login?redirect=/checkout" + (bookId ? `?bookId=${bookId}` : ""));
  }

  if (!bookId) {
    redirect("/dashboard");
  }

  // Fetch book details
  const { data: book } = await supabaseAdmin
    .from("books")
    .select("id, child_name, theme_title, status, user_id, is_purchased")
    .eq("id", bookId)
    .single();

  if (!book || book.user_id !== user.id) {
    redirect("/dashboard");
  }

  if (book.is_purchased) {
    redirect(`/checkout/success?book_id=${bookId}`);
  }

  // Get cover illustration for preview thumbnail
  const { data: coverPage } = await supabaseAdmin
    .from("book_pages")
    .select("illustration_url")
    .eq("book_id", bookId)
    .eq("page_number", 1)
    .single();

  const tiers = [
    {
      id: "base" as const,
      name: "Digital Book",
      price: PRICE_BASE,
      priceLabel: formatPrice(PRICE_BASE),
      features: [
        "Full illustrated story",
        "PDF download",
        "Read in browser",
        "Saved to your account",
      ],
    },
    {
      id: "mid" as const,
      name: "Deluxe Digital",
      price: PRICE_MID,
      priceLabel: formatPrice(PRICE_MID),
      popular: true,
      features: [
        "Everything in Digital Book",
        "Print-ready high-res PDF",
        "Bonus coloring pages",
        "Audio narration",
      ],
    },
    {
      id: "premium" as const,
      name: "Premium Bundle",
      price: PRICE_PREMIUM,
      priceLabel: formatPrice(PRICE_PREMIUM),
      features: [
        "Everything in Deluxe Digital",
        "Hardcover shipped to you",
        "Gift wrapping available",
        "Priority support",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Complete Your Order
          </h1>
          <p className="text-gray-500 text-lg">
            {book.child_name}&apos;s personalized storybook
            {book.theme_title ? ` — ${book.theme_title}` : ""}
          </p>
        </div>

        {/* Book preview thumbnail */}
        {coverPage?.illustration_url && (
          <div className="flex justify-center mb-10">
            <div className="relative w-40 h-52 sm:w-48 sm:h-64 rounded-xl overflow-hidden shadow-lg shadow-violet-200/40 border-2 border-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverPage.illustration_url}
                alt={`${book.child_name}'s book cover`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        )}

        <CheckoutForm
          bookId={bookId}
          childName={book.child_name}
          tiers={tiers}
        />
      </main>
    </div>
  );
}
