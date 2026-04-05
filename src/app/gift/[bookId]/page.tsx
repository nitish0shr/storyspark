import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Gift, BookOpen, Download, Sparkles, Heart } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface GiftPageProps {
  params: Promise<{ bookId: string }>;
}

export async function generateMetadata({
  params,
}: GiftPageProps): Promise<Metadata> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { title: "StorySpark Gift" };
  }
  const { bookId } = await params;
  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("*, child_profiles(*)")
    .eq("id", bookId)
    .single();

  const childName = book?.child_profiles?.name || "a special child";

  return {
    title: `A StorySpark Gift for ${childName}!`,
    description: `Someone special created a personalized storybook for ${childName}. Open it now!`,
  };
}

export default async function GiftPage({ params }: GiftPageProps) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/");
  }
  const { bookId } = await params;
  const supabase = await createClient();

  // Fetch the book and related order
  const { data: book } = await supabase
    .from("books")
    .select("*, child_profiles(*)")
    .eq("id", bookId)
    .single();

  if (!book) {
    redirect("/");
  }

  // Fetch the gift order
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("book_id", bookId)
    .eq("is_gift", true)
    .eq("status", "paid")
    .single();

  const childName = book.child_profiles?.name || "Your Little One";

  const giftMessage = order?.gift_message;
  const senderName = order?.gift_recipient_name;
  const isComplete = book.status === "complete";
  const pdfUrl = book.pdf_url;

  // Get user session for navbar
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar user={user} />

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Gift Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl border border-violet-100">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-violet-600 to-pink-500 px-8 py-12 text-center text-white">
            {/* Floating sparkles */}
            <div className="absolute top-4 left-8 animate-pulse">
              <Sparkles className="h-5 w-5 text-yellow-200 opacity-60" />
            </div>
            <div className="absolute top-8 right-12 animate-pulse delay-300">
              <Sparkles className="h-4 w-4 text-yellow-200 opacity-40" />
            </div>
            <div className="absolute bottom-6 left-16 animate-pulse delay-700">
              <Sparkles className="h-3 w-3 text-yellow-200 opacity-50" />
            </div>

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <Gift className="h-8 w-8" />
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
              A Gift for {childName}!
            </h1>
            <p className="text-white/80 text-lg">
              Someone special created a personalized storybook
            </p>
          </div>

          {/* Gift message */}
          <div className="px-8 py-8">
            {giftMessage && (
              <div className="bg-violet-50 rounded-2xl p-6 mb-6 border border-violet-100">
                <div className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-pink-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 italic text-lg leading-relaxed">
                      &ldquo;{giftMessage}&rdquo;
                    </p>
                    {senderName && (
                      <p className="mt-3 text-sm text-gray-500">
                        — With love from {senderName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Book preview */}
            <div className="text-center mb-6">
              <div className="inline-block w-48 h-64 rounded-xl bg-gradient-to-br from-violet-500 to-pink-400 shadow-lg relative overflow-hidden mb-4">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                  <BookOpen className="h-10 w-10 mb-3 opacity-80" />
                  <p className="font-heading text-lg font-bold leading-tight">
                    {childName}&apos;s Adventure
                  </p>
                  <p className="text-sm text-white/70 mt-1">A StorySpark Book</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {isComplete && pdfUrl ? (
                <>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white rounded-xl">
                      <Download className="h-5 w-5 mr-2" />
                      Download {childName}&apos;s Book
                    </Button>
                  </a>
                  <Link href={`/preview/${bookId}`}>
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 mt-3"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Read Online
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 mb-3 animate-pulse">
                    <Sparkles className="h-6 w-6 text-violet-600" />
                  </div>
                  <p className="text-gray-600">
                    {childName}&apos;s book is still being created...
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Check back in a few minutes!
                  </p>
                </div>
              )}
            </div>

            {/* Create your own CTA */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500 mb-3">
                Want to create a storybook for your child too?
              </p>
              <Link href="/create">
                <Button
                  variant="ghost"
                  className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Create Your Own StorySpark Book
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
