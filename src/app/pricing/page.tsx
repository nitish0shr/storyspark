import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Clock, Undo2 } from "lucide-react";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";

export const metadata: Metadata = {
  title: "Pricing — Starmee",
  description:
    "Simple one-time pricing for personalized AI children's books. Starting at $9.99. No subscription, no hidden fees.",
};

const guarantees = [
  {
    icon: Clock,
    title: "10-minute delivery",
    body: "Your personalized book arrives by email within minutes, not weeks.",
  },
  {
    icon: Undo2,
    title: "Not happy? Refund.",
    body: "If the book doesn't feel right, reply to your delivery email within 7 days for a full refund.",
  },
  {
    icon: ShieldCheck,
    title: "Your data is yours",
    body: "We never sell photos or information. Delete your account any time at /dashboard.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#FFFBF0]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <Pricing />

      <section className="py-16 bg-white border-y-2 border-[#1a1a2e]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-heading text-3xl font-bold text-[#1a1a2e] mb-10">
            What you can count on
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {guarantees.map((g) => {
              const Icon = g.icon;
              return (
                <div
                  key={g.title}
                  className="rounded-2xl border-2 border-[#1a1a2e] bg-[#FFFBF0] p-6 shadow-[4px_4px_0px_#1a1a2e]"
                >
                  <Icon className="h-6 w-6 text-[#7B5CF6] mb-3" />
                  <h3 className="font-heading font-bold text-lg text-[#1a1a2e] mb-1">
                    {g.title}
                  </h3>
                  <p className="text-sm text-gray-700">{g.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <FAQ />
    </main>
  );
}
