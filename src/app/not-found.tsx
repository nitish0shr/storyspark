import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Page Not Found - Starmee",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Sparkles className="h-12 w-12 text-[#FFDE59]" aria-hidden="true" />

      <h1 className="font-heading text-3xl font-bold text-[#262625] sm:text-4xl">
        This page wandered off
      </h1>

      <p className="max-w-md text-gray-600">
        The link may be old or mistyped. Storybook links are unique to each
        book, so an older link can stop working. Your books are always waiting
        in your dashboard.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="btn-chunky inline-flex items-center gap-2 bg-[#FFDE59] px-6 py-3 font-heading font-bold text-[#262625]"
        >
          Go to homepage
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:border-violet-300 hover:text-violet-700"
        >
          My books
        </Link>
      </div>
    </main>
  );
}
