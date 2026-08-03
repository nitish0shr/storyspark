/**
 * Order confirmation.
 *
 * Read-only GET page, so refreshing it can never re-submit an order. It is
 * addressed by books.public_ref (a random reference), never by the sequential
 * database id, and it deliberately shows no customer name or email.
 *
 * PAYMENTS: Stripe is not configured on this app and nothing here touches it.
 * When a payment provider is connected later, point its success URL at:
 *     /order/confirmed?ref={PUBLIC_REF}
 * where PUBLIC_REF is books.public_ref for the order.
 */

import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Order confirmed - Starmee",
  description: "Thank you! We have received your Starmee order.",
};

export const dynamic = "force-dynamic";

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  // Show at most a short prefix, and only if it looks like our own reference.
  const safeRef =
    ref && /^[a-f0-9]{8,32}$/i.test(ref) ? ref.slice(0, 12) : null;

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar />
      <main className="mx-auto w-full max-w-xl px-4 py-16 sm:py-24">
        <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-3xl">
            <span aria-hidden="true">*</span>
          </div>

          <h1 className="font-heading text-2xl font-bold text-gray-900 sm:text-3xl">
            Thank you! We&apos;ve received your order.
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
            Our team is reviewing your personalized story to make sure everything
            looks great and is appropriate for children. We&apos;ll email it to you
            as soon as it&apos;s ready.
          </p>

          {safeRef ? (
            <p className="mt-6 text-sm text-gray-500">
              Your order reference:{" "}
              <span className="font-mono text-gray-800">{safeRef}</span>
            </p>
          ) : null}

          <div className="mt-8 rounded-xl bg-violet-50/60 p-4">
            <h2 className="font-heading text-sm font-semibold text-gray-900">
              What happens next
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-gray-600">
              <li>1. We create the story and illustrations.</li>
              <li>2. Automated checks confirm the story matches your choices.</li>
              <li>3. A person on our team reads it before anything is sent.</li>
              <li>4. You get an email with the finished story.</li>
            </ol>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Nothing is sent to you until a person has approved it, so this can take
            a little time. You can safely close this page - we have your order.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="w-full rounded-xl bg-[#7C3AED] px-4 py-3 text-center text-base font-semibold text-white"
            >
              Back to Starmee
            </Link>
            <Link
              href="/contact"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-base font-semibold text-gray-700"
            >
              Contact us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
