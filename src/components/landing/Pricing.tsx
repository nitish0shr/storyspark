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
    <section id="pricing" className="py-20 sm:py-28 relative bg-[#FFFBF0] bg-dots">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="inline-block bg-[#06D6A0] border-2 border-[#1a1a2e] rounded-full px-5 py-1.5 shadow-[3px_3px_0px_#1a1a2e] mb-5">
            <span className="font-body font-bold text-sm text-[#1a1a2e]">Simple & fair 💚</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a2e] mb-4">
            One Price. One Magical Book.
          </h2>
          <p className="font-body text-lg text-[#1a1a2e]/60 max-w-md mx-auto">
            No subscriptions. No surprises. Just one amazing book!
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-md mx-auto">
          <div className="relative bg-[#FFD166] card-chunky p-8">
            {/* Top sticker */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF6B6B] border-2 border-[#1a1a2e] rounded-full px-4 py-1.5 shadow-[3px_3px_0px_#1a1a2e] whitespace-nowrap">
              <span className="font-body font-bold text-xs text-white">🎁 Much cheaper than competitors!</span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6 mt-2">
              <span className="bg-white border-2 border-[#1a1a2e] rounded-full px-3 py-1 font-body font-bold text-xs text-[#1a1a2e] shadow-[2px_2px_0px_#1a1a2e]">
                📱 Digital Delivery
              </span>
              <span className="bg-[#C3B1E1] border-2 border-[#1a1a2e] rounded-full px-3 py-1 font-body font-bold text-xs text-[#1a1a2e] shadow-[2px_2px_0px_#1a1a2e]">
                <Printer className="inline h-3 w-3 mr-1" />
                Print soon — $24.99
              </span>
            </div>

            {/* Price */}
            <div className="text-center mb-6 bg-white rounded-2xl border-2 border-[#1a1a2e] p-5 shadow-[3px_3px_0px_#1a1a2e]">
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-heading text-2xl font-bold text-[#1a1a2e]/50">$</span>
                <span className="font-heading text-7xl font-bold text-[#1a1a2e]">
                  {Math.floor(PRICING.base.cents / 100)}
                </span>
                <span className="font-heading text-3xl font-bold text-[#1a1a2e]">
                  .{String(PRICING.base.cents % 100).padStart(2, "0")}
                </span>
              </div>
              <p className="font-body font-bold text-sm text-[#1a1a2e]/60 mt-1">per storybook</p>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-[#1a1a2e]/20 mb-6" />

            {/* Features */}
            <ul className="space-y-3 mb-7">
              {features.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#06D6A0] border-2 border-[#1a1a2e] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#1a1a2e]">
                    <Check className="h-3 w-3 text-[#1a1a2e]" />
                  </div>
                  <span className="font-body font-bold text-sm text-[#1a1a2e]">{feature.text}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link href="/create" className="block">
              <button className="btn-chunky w-full flex items-center justify-center gap-2 bg-[#7B2D8B] text-white font-heading font-bold text-lg px-8 py-4">
                <Sparkles className="h-5 w-5" />
                Create Your Book!
              </button>
            </Link>

            {/* Guarantee */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[#1a1a2e]/60 font-body font-bold">
              <ShieldCheck className="h-4 w-4 text-[#06D6A0]" />
              <span>100% happiness guarantee · 30-day refund</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
