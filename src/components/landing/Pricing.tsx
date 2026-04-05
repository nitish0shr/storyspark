import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  BookOpen,
  Paintbrush,
  Download,
  FolderHeart,
  Share2,
  Printer,
  Check,
  ShieldCheck,
} from "lucide-react";
import { PRICING } from "@/lib/stripe";

const features = [
  { icon: BookOpen, text: "Personalized 12-page storybook" },
  { icon: Paintbrush, text: "AI illustrations featuring your child" },
  { icon: Download, text: "Instant PDF download" },
  { icon: FolderHeart, text: "Saved to your account" },
  { icon: Share2, text: "Share with family" },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/40 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600 mb-3">
            Simple Pricing
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            One Price. One Magical Book.
          </h2>
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            No subscriptions. No hidden fees. Just a beautiful book for your child.
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-md mx-auto">
          <Card className="relative overflow-hidden border-violet-200/80 bg-white shadow-xl shadow-violet-100/40">
            {/* Gradient top bar */}
            <div className="h-2 bg-gradient-to-r from-[#7C3AED] to-[#EC4899]" />

            <div className="p-8">
              {/* Digital delivery badge */}
              <div className="flex items-center justify-between mb-6">
                <Badge className="bg-violet-100 text-violet-700 border-violet-200 font-medium">
                  Digital Delivery
                </Badge>
                <Badge
                  variant="outline"
                  className="border-pink-200 text-pink-600 font-medium"
                >
                  <Printer className="h-3 w-3 mr-1" />
                  Print coming soon — $24.99
                </Badge>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-lg font-medium text-gray-400">$</span>
                  <span className="font-heading text-6xl font-bold text-gray-900">
                    {Math.floor(PRICING.base.cents / 100)}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    .{String(PRICING.base.cents % 100).padStart(2, "0")}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">per storybook</p>
              </div>

              {/* Divider */}
              <div className="relative mb-8">
                <div className="h-px bg-violet-100" />
                <div className="absolute inset-x-1/4 top-0 h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-100">
                      <Check className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    <span className="text-sm text-gray-700">{feature.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/create" className="block">
                <Button
                  size="lg"
                  className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-semibold text-base py-6 shadow-lg shadow-violet-300/40 border-0 transition-all duration-300 hover:shadow-xl hover:shadow-violet-300/50"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Your Book
                </Button>
              </Link>

              {/* Competitor anchor */}
              <p className="mt-5 text-center text-xs text-gray-400">
                Personalized storybooks typically cost $25–40 elsewhere.
              </p>

              {/* Guarantee */}
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>100% satisfaction guarantee</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
