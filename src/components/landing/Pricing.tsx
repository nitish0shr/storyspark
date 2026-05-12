import Link from "next/link";
import {
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
  Lock,
  Star,
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
  { icon: Lock, text: "Exclusive subscriber-only themes" },
  { icon: Crown, text: "Subscriber badge on your account" },
  { icon: Gift, text: `Cancel anytime after ${PRICING.subscription.minCommitmentMonths}-month minimum` },
];

export default function Pricing() {
  const subPrice = PRICING.subscription.cents;
  const subDollars = Math.floor(subPrice / 100);
  const subCents = String(subPrice % 100).padStart(2, "0");

  return (
    <section id="pricing" className="py-20 sm:py-28 relative bg-[#FDF5E7] bg-stars">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-14">
          <div className="inline-block bg-[#06D6A0] border-2 border-[#262625] rounded-full px-5 py-1.5 shadow-[3px_3px_0px_#262625] mb-5">
            <span className="font-body font-bold text-sm text-[#262625]">Simple &amp; fair 💚</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#262625] mb-4">
            Choose Your Adventure
          </h2>
          <p className="font-body text-lg text-[#262625]/60 max-w-md mx-auto">
            One magical book, or a new story every month!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* One-Time Purchase Card */}
          <div className="relative bg-[#FFDE59] card-chunky p-8">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="bg-white border-2 border-[#262625] rounded-full px-3 py-1 font-body font-bold text-xs text-[#262625] shadow-[2px_2px_0px_#262625]">
                📱 Digital Delivery
              </span>
            </div>

            <div className="text-center mb-6 bg-white rounded-2xl border-2 border-[#262625] p-5 shadow-[3px_3px_0px_#262625]">
              <div className="flex items-start justify-center">
                <span className="font-heading text-6xl font-bold text-[#262625] leading-none">$9</span>
                <span className="font-heading text-2xl font-bold text-[#262625] leading-none">.99</span>
              </div>
              <p className="font-body font-bold text-sm text-[#262625]/60 mt-1">per storybook</p>
            </div>

            <div className="border-t-2 border-dashed border-[#262625]/20 mb-6" />

            <ul className="space-y-3 mb-7">
              {oneTimeFeatures.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#06D6A0] border-2 border-[#262625] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#262625]">
                    <Check className="h-3 w-3 text-[#262625]" />
                  </div>
                  <span className="font-body font-bold text-sm text-[#262625]">{feature.text}</span>
                </li>
              ))}
            </ul>

            <Link href="/create" className="block">
              <button className="btn-chunky w-full flex items-center justify-center gap-2 bg-[#5E17EB] text-white font-heading font-bold text-lg px-8 py-4">
                <Star className="h-5 w-5 fill-white" />
                Create Your Book!
              </button>
            </Link>

            <p className="text-center mt-4 text-xs text-[#262625]/50 font-body font-bold">
              Free preview first — no credit card needed
            </p>
          </div>

          {/* Subscription Card */}
          <div className="relative bg-gradient-to-br from-[#CB6CE6] to-[#9B4DCA] card-chunky p-8">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFDE59] border-2 border-[#262625] rounded-full px-4 py-1.5 shadow-[3px_3px_0px_#262625] whitespace-nowrap">
              <span className="font-body font-bold text-xs text-[#262625]">Best Value! ⭐</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6 mt-2">
              <span className="bg-white border-2 border-[#262625] rounded-full px-3 py-1 font-body font-bold text-xs text-[#262625] shadow-[2px_2px_0px_#262625]">
                <Crown className="inline h-3 w-3 mr-1" />
                Monthly Book Club
              </span>
            </div>

            <div className="text-center mb-6 bg-white rounded-2xl border-2 border-[#262625] p-5 shadow-[3px_3px_0px_#262625]">
              <div className="flex items-start justify-center">
                <span className="font-heading text-6xl font-bold text-[#262625] leading-none">
                  ${subDollars}
                </span>
                <span className="font-heading text-2xl font-bold text-[#262625] leading-none">
                  .{subCents}
                </span>
              </div>
              <p className="font-body font-bold text-sm text-[#262625]/60 mt-1">per month — 1 book included ({PRICING.subscription.minCommitmentMonths}-month min.)</p>
              <p className="font-body text-xs text-[#5E17EB] font-bold mt-1">
                Save 20% vs buying one at a time
              </p>
            </div>

            <div className="border-t-2 border-dashed border-white/30 mb-6" />

            <ul className="space-y-3 mb-7">
              {subscriptionFeatures.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FFDE59] border-2 border-[#262625] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#262625]">
                    <Check className="h-3 w-3 text-[#262625]" />
                  </div>
                  <span className="font-body font-bold text-sm text-white">{feature.text}</span>
                </li>
              ))}
            </ul>

            <SubscribeButton />

            <p className="text-center mt-4 text-xs text-white/70 font-body font-bold">
              {PRICING.subscription.minCommitmentMonths}-month commitment, then cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
