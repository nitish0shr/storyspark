import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils";
import BookViewer from "@/components/preview/BookViewer";
import Navbar from "@/components/shared/Navbar";
import { ChevronLeft, Sparkles } from "lucide-react";

interface PreviewPageProps {
  params: Promise<{ bookId: string }>;
}

// Number of free preview pages (including cover)
const PREVIEW_PAGE_COUNT = 3;

async function getBook(bookId: string) {
  const supabase = await createClient();

  const { data: book, error } = await supabase
    .from("books")
    .select(
      `
      id,
      child_name,
      theme_id,
      theme_title,
      status,
      user_id,
      is_purchased,
      price_cents,
      pages:book_pages(
        page_number,
        text,
        illustration_url
      )
    `
    )
    .eq("id", bookId)
    .single();

  if (error || !book) return null;
  return book;
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

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { bookId } = await params;
  const book = await getBook(bookId);

  if (!book) {
    return {
      title: "Book Not Found - StorySpark",
    };
  }

  const appUrl = getAppUrl();
  const title = `${book.child_name}'s Story - StorySpark`;
  const description = `Preview ${book.child_name}'s personalized storybook — a magical tale crafted just for them.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${appUrl}/preview/${bookId}`,
      images: book.pages?.[0]?.illustration_url
        ? [
            {
              url: book.pages[0].illustration_url,
              width: 1200,
              height: 630,
              alt: `${book.child_name}'s story cover`,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: book.pages?.[0]?.illustration_url
        ? [book.pages[0].illustration_url]
        : [],
    },
  };
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { bookId } = await params;
  const [book, user] = await Promise.all([getBook(bookId), getUser()]);

  if (!book) {
    notFound();
  }

  // Check if book is ready for preview
  const isReady =
    book.status === "preview_ready" ||
    book.status === "completed" ||
    book.status === "purchased";

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#FFFBF5]">
        <Navbar user={user} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-[#7C3AED] animate-pulse" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Your Story Is Being Created
          </h1>
          <p className="text-gray-500 max-w-md mb-8">
            {book.child_name}&apos;s magical story is still being crafted. Check
            back in a moment — the illustrations and story pages are almost
            ready!
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

  // Sort pages by page_number
  const sortedPages = [...(book.pages || [])].sort(
    (a, b) => a.page_number - b.page_number
  );

  const isOwner = user?.id === book.user_id;
  const isNewCreation = isOwner && book.status === "preview_ready";

  // Format price
  const priceDollars = book.price_cents
    ? `$${(book.price_cents / 100).toFixed(2)}`
    : "$9.99";

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar user={user} />

      <main className="py-6 sm:py-10">
        {/* Back link for fresh creations */}
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

        {/* Book title */}
        <div className="text-center mb-6 sm:mb-8 px-4">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900">
            {book.child_name}&apos;s Story
          </h1>
          {book.theme_title && (
            <p className="mt-1 text-gray-500">{book.theme_title}</p>
          )}
        </div>

        {/* Book Viewer */}
        <BookViewer
          pages={sortedPages.map((p) => ({
            pageNumber: p.page_number,
            text: p.text,
            illustrationUrl: p.illustration_url,
          }))}
          previewPageCount={
            book.is_purchased ? sortedPages.length : PREVIEW_PAGE_COUNT
          }
          childName={book.child_name}
          themeTitle={book.theme_title}
          bookId={book.id}
          price={priceDollars}
        />
      </main>
    </div>
  );
}
