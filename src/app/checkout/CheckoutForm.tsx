"use client";

import { useState } from "react";
import { PricingTier } from "@/types/order";
import { Check, Gift, Loader2, Star, CreditCard } from "lucide-react";

interface TierOption {
  id: PricingTier;
  name: string;
  price: number;
  priceLabel: string;
  popular?: boolean;
  features: string[];
}

interface CheckoutFormProps {
  bookId: string;
  childName: string;
  tiers: TierOption[];
}

export default function CheckoutForm({
  bookId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  childName,
  tiers,
}: CheckoutFormProps) {
  const [selectedTier, setSelectedTier] = useState<PricingTier>("mid");
  const [isGift, setIsGift] = useState(false);
  const [giftRecipientName, setGiftRecipientName] = useState("");
  const [giftRecipientEmail, setGiftRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTierData = tiers.find((t) => t.id === selectedTier);
  const basePrice = selectedTierData?.price ?? 0;

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          tier: selectedTier,
          isGift,
          ...(isGift
            ? {
                giftRecipientName,
                giftRecipientEmail,
                giftMessage: giftMessage || undefined,
              }
            : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
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
  }

  const isGiftValid =
    !isGift || (giftRecipientName.trim() && giftRecipientEmail.trim());

  return (
    <div>
      {/* Tier selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.id;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedTier(tier.id)}
              className={`relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all ${
                isSelected
                  ? "border-[#7C3AED] bg-violet-50/50 shadow-lg shadow-violet-100"
                  : "border-gray-200 bg-white hover:border-violet-200 hover:shadow-md"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  <Star className="h-3 w-3" />
                  Most Popular
                </span>
              )}

              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {tier.name}
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">
                {tier.priceLabel}
              </p>

              <ul className="space-y-2 flex-1">
                {tier.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <Check className="h-4 w-4 text-[#7C3AED] mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div
                className={`mt-4 h-2 rounded-full transition-colors ${
                  isSelected
                    ? "bg-gradient-to-r from-violet-500 to-pink-500"
                    : "bg-gray-100"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Gift toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={`relative w-12 h-7 rounded-full transition-colors ${
              isGift ? "bg-[#7C3AED]" : "bg-gray-200"
            }`}
            onClick={() => setIsGift(!isGift)}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                isGift ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#EC4899]" />
            <span className="font-medium text-gray-900">This is a gift</span>
          </div>
        </label>

        {isGift && (
          <div className="mt-5 space-y-4 pl-1">
            <div>
              <label
                htmlFor="giftName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Recipient&apos;s Name
              </label>
              <input
                id="giftName"
                type="text"
                placeholder="e.g. Grandma"
                value={giftRecipientName}
                onChange={(e) => setGiftRecipientName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="giftEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Recipient&apos;s Email
              </label>
              <input
                id="giftEmail"
                type="email"
                placeholder="grandma@email.com"
                value={giftRecipientEmail}
                onChange={(e) => setGiftRecipientEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent"
              />
            </div>
            <div>
              <label
                htmlFor="giftMessage"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Gift Message{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="giftMessage"
                placeholder="Write a personal message..."
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Order summary */}
      <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl border border-violet-100 p-6 mb-6">
        <div className="flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>${(basePrice / 100).toFixed(2)}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || !isGiftValid}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl gradient-primary text-white font-semibold text-lg shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Redirecting to payment...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Proceed to Payment
          </>
        )}
      </button>

      <p className="mt-4 text-center text-sm text-gray-400">
        Secure checkout powered by Stripe. You won&apos;t be charged until you
        confirm on the next page.
      </p>
    </div>
  );
}
