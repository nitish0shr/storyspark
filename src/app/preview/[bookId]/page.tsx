import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils";
import { PRICING } from "@/lib/stripe";
import { isAdminEmail } from "@/lib/auth";
import { supabaseAdmin, isAdminConfigured as isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import BookViewer from "@/components/preview/BookViewer";
import Navbar from "@/components/shared/Navbar";
import { ChevronLeft, Sparkles } from "lucide-react";

interface PreviewPageProps {
  params: Promise<{ bookId: string }>;
  searchParams?: Promise<{ token?: string }>;
}

export const dynamic = "force-dynamic";

// Number of free preview pages (including cover)
const PREVIEW_PAGE_COUNT = 3;

async function getBook(bookId: string) {
  if (!isSupabaseAdminConfigured()) return null;
  const { data: book, error } = await supabaseAdmin
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
      story_text,
      illustration_urls,
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

async function hasGiftAccess(bookId: string, token: string | undefined) {
  if (!token || !isSupabaseAdminConfigured()) return false;

  const { data } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("book_id", bookId)
    .eq("is_gift", true)
    .eq("gift_access_token", token)
    .in("status", ["paid", "fulfilled"])
    .maybeSingle();

  return !!data;
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

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { bookId } = await params;
  const book = await getBook(bookId);

  if (!book) {
    return {
      title: "Book Not Found - Starmee",
    };
  }

  const appUrl = getAppUrl();
  const title = `${book.child_name}'s Story - Starmee`;
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

function normalizePages(book: Awaited<ReturnType<typeof getBook>>) {
  if (!book) return [];

  const storedPages = [...(book.pages || [])]
    .filter((page) => page.text)
    .sort((a, b) => a.page_number - b.page_number);

  if (storedPages.length > 0) return storedPages;

  const storyPages = Array.isArray(book.story_text) ? book.story_text : [];
  const illustrationUrls = Array.isArray(book.illustration_urls)
    ? book.illustration_urls
    : [];

  return storyPages
    .map((page, idx) => ({
      page_number: Number(page.pageNumber ?? page.page_number ?? idx + 1),
      text: String(page.text ?? ""),
      illustration_url:
        typeof illustrationUrls[idx] === "string" ? illustrationUrls[idx] : null,
    }))
    .filter((page) => page.text)
    .sort((a, b) => a.page_number - b.page_number);
}

export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { bookId } = await params;
  const { token } = (await searchParams) ?? {};
  const [book, user] = await Promise.all([getBook(bookId), getUser()]);

  if (!book) {
    notFound();
  }

  const isOwner = user?.id === book.user_id;
  const isAdmin = isAdminEmail(user?.email);
  const isGiftRecipient = await hasGiftAccess(bookId, token);

  if (!isOwner && !isAdmin && !isGiftRecipient) {
    notFound();
  }

  // Check if book is ready for preview
  const isReady =
    book.status === "preview_ready" ||
    book.status === "pending_review" ||
    book.status === "complete";

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

  if (book.status === "pending_review" && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FFFBF5]">
        <Navbar user={user} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-[#7C3AED] animate-pulse" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Your Book Is Being Reviewed
          </h1>
          <p className="text-gray-500 max-w-md mb-8">
            {book.child_name}&apos;s full story is complete and is now in our
            review queue. We&apos;ll email you as soon as the reviewed book and
            PDF are ready.
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
  const sortedPages = normalizePages(book);
  if (sortedPages.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFBF5]">
        <Navbar user={user} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-[#7C3AED] animate-pulse" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Story Pages Are Syncing
          </h1>
          <p className="text-gray-500 max-w-md mb-8">
            We found the book record, but the readable pages are still being
            saved. Please check back in a moment.
          </p>
        </div>
      </div>
    );
  }

  const isNewCreation = isOwner && book.status === "preview_ready";
  const canReadFullBook =
    isAdmin || (book.status === "complete" && (isOwner || isGiftRecipient));
  const viewerPages = canReadFullBook
    ? sortedPages
    : sortedPages.slice(0, PREVIEW_PAGE_COUNT);

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
          pages={viewerPages.map((p) => ({
            pageNumber: p.page_number,
            text: p.text,
            illustrationUrl: p.illustration_url,
          }))}
          previewPageCount={
            canReadFullBook ? sortedPages.length : PREVIEW_PAGE_COUNT
          }
          totalPageCount={sortedPages.length}
          childName={book.child_name}
          themeTitle={book.theme_title}
          bookId={book.id}
          price={PRICING.base.label}
        />
      </main>
    </div>
  );
}
