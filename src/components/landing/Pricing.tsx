import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Paintbrush,
  Download,
  FolderHeart,
  Share2,
  Check,
  Crown,
  RefreshCw,
  Percent,
  Gift,
} from "lucide-react";
import { PRICING } from "@/lib/stripe";
import SubscribeButton from "./SubscribeButton";

const oneTimeFeatures = [
  { icon: BookOpen, text: "Personalized 12-page storybook" },
  { icon: Paintbrush, text: "AI illustrations featuring your child" },
  { icon: Download, text: "Instant PDF download" },
  { icon: FolderHeart, text: "Saved to your account" },
  { icon: Share2, text: "Share a link with family" },
];

const subscriptionFeatures = [
  { icon: BookOpen, text: "1 new personalized book every month" },
  { icon: RefreshCw, text: "Theme picked for you automatically" },
  { icon: Percent, text: "15% off any extra books" },
  { icon: Crown, text: "Subscriber badge on your account" },
  { icon: Gift, text: "Pause or cancel anytime" },
];

export default function Pricing() {
  const subPrice = PRICING.subscription.cents;
  const subDollars = Math.floor(subPrice / 100);
  const subCents = String(subPrice % 100).padStart(2, "0");

  return (
    <section id="pricing" className="py-20 sm:py-28 relative bg-[#FFFBF0] bg-dots">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-14">
          <div className="inline-block bg-[#06D6A0] border-2 border-[#1a1a2e] rounded-full px-5 py-1.5 shadow-[3px_3px_0px_#1a1a2e] mb-5">
            <span className="font-body font-bold text-sm text-[#1a1a2e]">Simple & fair 💚</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a2e] mb-4">
            Choose Your Adventure
          </h2>
          <p className="font-body text-lg text-[#1a1a2e]/60 max-w-md mx-auto">
            One magical book, or a new story every month!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* One-Time Purchase Card */}
          <div className="relative bg-[#FFD166] card-chunky p-8">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="bg-white border-2 border-[#1a1a2e] rounded-full px-3 py-1 font-body font-bold text-xs text-[#1a1a2e] shadow-[2px_2px_0px_#1a1a2e]">
                📱 Digital Delivery
              </span>
            </div>

            <div className="text-center mb-6 bg-white rounded-2xl border-2 border-[#1a1a2e] p-5 shadow-[3px_3px_0px_#1a1a2e]">
              <div className="flex items-start justify-center">
                <span className="font-heading text-6xl font-bold text-[#1a1a2e] leading-none">$9</span>
                <span className="font-heading text-2xl font-bold text-[#1a1a2e] leading-none">.99</span>
              </div>
              <p className="font-body font-bold text-sm text-[#1a1a2e]/60 mt-1">per storybook</p>
            </div>

            <div className="border-t-2 border-dashed border-[#1a1a2e]/20 mb-6" />

            <ul className="space-y-3 mb-7">
              {oneTimeFeatures.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#06D6A0] border-2 border-[#1a1a2e] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#1a1a2e]">
                    <Check className="h-3 w-3 text-[#1a1a2e]" />
                  </div>
                  <span className="font-body font-bold text-sm text-[#1a1a2e]">{feature.text}</span>
                </li>
              ))}
            </ul>

            <Link href="/create" className="block">
              <button className="btn-chunky w-full flex items-center justify-center gap-2 bg-[#7B2D8B] text-white font-heading font-bold text-lg px-8 py-4">
                <Sparkles className="h-5 w-5" />
                Create Your Book!
              </button>
            </Link>

            <p className="text-center mt-4 text-xs text-[#1a1a2e]/50 font-body font-bold">
              Free preview first — no credit card needed
            </p>
          </div>

          {/* Subscription Card */}
          <div className="relative bg-gradient-to-br from-[#C3B1E1] to-[#E8B4F8] card-chunky p-8">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF6B6B] border-2 border-[#1a1a2e] rounded-full px-4 py-1.5 shadow-[3px_3px_0px_#1a1a2e] whitespace-nowrap">
              <span className="font-body font-bold text-xs text-white">Best Value!</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6 mt-2">
              <span className="bg-white border-2 border-[#1a1a2e] rounded-full px-3 py-1 font-body font-bold text-xs text-[#1a1a2e] shadow-[2px_2px_0px_#1a1a2e]">
                <Crown className="inline h-3 w-3 mr-1" />
                Monthly Book Club
              </span>
            </div>

            <div className="text-center mb-6 bg-white rounded-2xl border-2 border-[#1a1a2e] p-5 shadow-[3px_3px_0px_#1a1a2e]">
              <div className="flex items-start justify-center">
                <span className="font-heading text-6xl font-bold text-[#1a1a2e] leading-none">
                  ${subDollars}
                </span>
                <span className="font-heading text-2xl font-bold text-[#1a1a2e] leading-none">
                  .{subCents}
                </span>
              </div>
              <p className="font-body font-bold text-sm text-[#1a1a2e]/60 mt-1">per month — 1 book included</p>
              <p className="font-body text-xs text-[#06D6A0] font-bold mt-1">
                Save 20% vs buying one at a time
              </p>
            </div>

            <div className="border-t-2 border-dashed border-[#1a1a2e]/20 mb-6" />

            <ul className="space-y-3 mb-7">
              {subscriptionFeatures.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FFD166] border-2 border-[#1a1a2e] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#1a1a2e]">
                    <Check className="h-3 w-3 text-[#1a1a2e]" />
                  </div>
                  <span className="font-body font-bold text-sm text-[#1a1a2e]">{feature.text}</span>
                </li>
              ))}
            </ul>

            <SubscribeButton />

            <p className="text-center mt-4 text-xs text-[#1a1a2e]/50 font-body font-bold">
              Cancel anytime — no commitment
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
