import { notFound } from "next/navigation";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getBook(id: string, token: string | undefined) {
  if (!isAdminConfigured()) return null;

  const { data } = await supabaseAdmin
    .from("books")
    .select("id, child_name, theme_id, status, pdf_url, pdf_print_url, download_token, preview_image_url")
    .eq("id", id)
    .single();

  if (!data) return null;
  if (!token || data.download_token !== token) return null;
  if (data.status !== "complete") return null;

  return data;
}

export default async function BookDownloadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  const book = await getBook(id, token);

  if (!book) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">Link not valid</h2>
        <p className="text-sm text-[#6b6b8a] max-w-xs mb-6">
          This download link may have expired or is incorrect. Check your email
          for the correct link, or contact support.
        </p>
        <a
          href="https://starmeestories.com"
          className="text-[#E8417A] font-semibold underline text-sm"
        >
          ← Back to Starmee
        </a>
      </div>
    );
  }

  const childName = book.child_name || "Your child";

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex flex-col items-center px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-4xl mb-2">⭐</div>
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Starmee Stories</h1>
      </div>

      <div className="w-full max-w-md">
        {/* Success card */}
        <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">
            {childName}'s book is ready!
          </h2>
          <p className="text-sm text-[#6b6b8a] mb-8">
            Your personalized storybook has been carefully reviewed and is ready to download.
            Print it, share it, or read it on any device!
          </p>

          {/* Primary download button */}
          {book.pdf_url && (
            <a
              href={book.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#E8417A] hover:bg-[#d43570] text-white font-bold py-4 rounded-2xl transition-colors text-base mb-3"
            >
              📥 Download Your Book (PDF)
            </a>
          )}

          {/* High-res print version */}
          {book.pdf_print_url && book.pdf_print_url !== book.pdf_url && (
            <a
              href={book.pdf_print_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full border border-pink-200 text-[#E8417A] font-semibold py-3 rounded-2xl hover:bg-pink-50 transition-colors text-sm mb-3"
            >
              🖨️ Download Print-Ready Version (High-Res)
            </a>
          )}

          {!book.pdf_url && (
            <p className="text-sm text-[#6b6b8a]">
              Your PDF is still being prepared. You'll receive an email when it's ready.
            </p>
          )}
        </div>

        {/* Tips */}
        <div className="mt-5 bg-white rounded-2xl border border-pink-100 p-5">
          <h3 className="font-bold text-[#1a1a2e] text-sm mb-3">Tips for your book</h3>
          <ul className="space-y-2 text-xs text-[#6b6b8a]">
            <li className="flex gap-2">
              <span>🖨️</span>
              <span>Print at home or at any print shop — we recommend glossy paper for best results</span>
            </li>
            <li className="flex gap-2">
              <span>📱</span>
              <span>Read on any device — works great on tablets for bedtime stories</span>
            </li>
            <li className="flex gap-2">
              <span>💝</span>
              <span>Makes a wonderful gift — send the PDF to grandparents or friends</span>
            </li>
          </ul>
        </div>

        {/* Create another */}
        <div className="mt-5 text-center">
          <Link
            href="/preview/start"
            className="text-sm text-[#E8417A] font-semibold underline"
          >
            ✨ Create another book for a different child
          </Link>
        </div>
      </div>
    </div>
  );
}
