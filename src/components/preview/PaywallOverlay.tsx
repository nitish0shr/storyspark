"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Sparkles,
  BookOpen,
  Download,
  Gift,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICING } from "@/lib/stripe";
import Link from "next/link";

interface PaywallOverlayProps {
  bookId: string;
  childName: string;
  remainingPages: number;
  price?: string;
  /** Exact approved version ID — forwarded to checkout so the backend can
   *  verify the buyer is purchasing the version they previewed. */
  versionId?: string;
  /** Opaque access grant token from the URL.  Forwarded to checkout body so
   *  an anonymous visitor with a valid preview grant can purchase.
   *  Never placed in the share URL — only sent in the POST body. */
  accessToken?: string;
}

export default function PaywallOverlay({
  bookId,
  childName,
  remainingPages,
  price = PRICING.base.label,
  versionId,
  accessToken,
}: PaywallOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaserEmail, setPurchaserEmail] = useState("");

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        bookId,
        tier: "base",
      };
      if (versionId) body.versionId = versionId;
      // Access token sent in body only — never in the URL
      if (accessToken) body.accessToken = accessToken;
      if (accessToken) {
        const normalisedEmail = purchaserEmail.trim();
        if (!normalisedEmail) {
          setError("Please enter the email address for your purchase.");
          return;
        }
        body.purchaserEmail = normalisedEmail;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: BookOpen, text: `Full story with ${remainingPages} more pages` },
    { icon: Download, text: "High-quality PDF download" },
    { icon: Sparkles, text: "Saved to your account forever" },
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
          <span className="font-semibold text-[#7C3AED]">
            {remainingPages} more magical pages
          </span>{" "}
          waiting to be discovered
        </p>

        {/* Feature list */}
        <div className="w-full max-w-xs space-y-3 mb-8">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 text-left">
              <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <feature.icon className="h-4 w-4 text-[#7C3AED]" />
              </div>
              <span className="text-sm text-gray-700">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 text-sm text-red-600 max-w-xs">{error}</p>
        )}

        {accessToken ? (
          <label className="mb-4 w-full max-w-xs text-left text-sm text-gray-700">
            Purchase email
            <input
              type="email"
              autoComplete="email"
              required
              value={purchaserEmail}
              onChange={(event) => setPurchaserEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-1 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-violet-100"
            />
          </label>
        ) : null}

        {/* CTA Button — POSTs to checkout, no sensitive data in URL */}
        <Button
          onClick={handleUnlock}
          disabled={loading}
          className={cn(
            "w-full max-w-xs h-12 rounded-xl text-base font-semibold text-white border-0",
            "bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#EC4899]",
            "hover:from-[#6D28D9] hover:via-[#7C3AED] hover:to-[#DB2777]",
            "shadow-lg shadow-violet-300/50 hover:shadow-xl hover:shadow-violet-300/60",
            "transition-all duration-300 hover:-translate-y-0.5",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0",
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Lock className="h-4 w-4 mr-2" />
          )}
          {loading ? "Preparing checkout…" : `Unlock Full Book — ${price}`}
        </Button>

        {/* Secondary link */}
        <Link
          href={`/gift/${bookId}`}
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
