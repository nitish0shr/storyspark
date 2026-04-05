import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/shared/Navbar";
import BookStatusPoller from "./BookStatusPoller";
import { Sparkles, BookOpen, Share2, PlusCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Order Complete - StorySpark",
  description: "Your personalized storybook is being created!",
};

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string; book_id?: string }>;
}

async function getUser() {
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

  // Resolve book ID from Stripe session or query param
  let bookId = book_id || null;
  let childName = "";
  let themeTitle = "";

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      bookId = session.metadata?.book_id || bookId;
    } catch (err) {
      console.error("Failed to retrieve Stripe session:", err);
    }
  }

  if (!bookId) {
    redirect("/dashboard");
  }

  // Fetch book info
  const { data: book } = await supabaseAdmin
    .from("books")
    .select("id, child_name, theme_title, status, pdf_url, is_purchased")
    .eq("id", bookId)
    .single();

  if (!book) {
    redirect("/dashboard");
  }

  childName = book.child_name || "Your child";
  themeTitle = book.theme_title || "";

  const pdfUrl = book.pdf_url;

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar user={user} />

      <main className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
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
                backgroundColor:
                  ["#7C3AED", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"][
                    i % 5
                  ],
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
          initialStatus={book.status}
          initialPdfUrl={pdfUrl}
          childName={childName}
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
