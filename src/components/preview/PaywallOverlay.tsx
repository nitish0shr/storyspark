"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Sparkles,
  BookOpen,
  Download,
  Gift,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaywallOverlayProps {
  bookId: string;
  childName: string;
  remainingPages: number;
  price?: string;
}

export default function PaywallOverlay({
  bookId,
  childName,
  remainingPages,
  price = "$9.99",
}: PaywallOverlayProps) {
  const features = [
    {
      icon: BookOpen,
      text: `Full story with ${remainingPages} more pages`,
    },
    {
      icon: Download,
      text: "High-quality PDF download",
    },
    {
      icon: Sparkles,
      text: "Saved to your account forever",
    },
  ];

  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-500">
      {/* Blurred decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-pink-50 to-violet-50" />
      <div className="absolute inset-0 backdrop-blur-sm" />

      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-6 sm:px-10 text-center">
        {/* Lock badge */}
        <div className="mb-6 relative">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center shadow-lg shadow-violet-300/40">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-pink-400 flex items-center justify-center animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
          Unlock {childName}&apos;s
          <br />
          Full Story
        </h2>

        {/* Subheading */}
        <p className="text-gray-500 text-sm sm:text-base mb-6">
          <span className="font-semibold text-[#7C3AED]">{remainingPages} more magical pages</span>{" "}
          waiting to be discovered
        </p>

        {/* Feature list */}
        <div className="w-full max-w-xs space-y-3 mb-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-left"
            >
              <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <feature.icon className="h-4 w-4 text-[#7C3AED]" />
              </div>
              <span className="text-sm text-gray-700">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Link href={`/checkout?bookId=${bookId}`} className="w-full max-w-xs">
          <Button
            className={cn(
              "w-full h-12 rounded-xl text-base font-semibold text-white border-0",
              "bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#EC4899]",
              "hover:from-[#6D28D9] hover:via-[#7C3AED] hover:to-[#DB2777]",
              "shadow-lg shadow-violet-300/50 hover:shadow-xl hover:shadow-violet-300/60",
              "transition-all duration-300 hover:-translate-y-0.5"
            )}
          >
            <Lock className="h-4 w-4 mr-2" />
            Unlock Full Book — {price}
          </Button>
        </Link>

        {/* Secondary link */}
        <Link
          href={`/gift?bookId=${bookId}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#EC4899] transition-colors group"
        >
          <Gift className="h-4 w-4 group-hover:scale-110 transition-transform" />
          Gift This Book
        </Link>

        {/* Trust badges */}
        <div className="mt-6 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Secure payment
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Instant access
          </span>
        </div>
      </div>
    </div>
  );
}
