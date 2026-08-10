"use client";

import { useEffect } from "react";

import {
  purchaseEvents,
  readGoogleTagConfig,
  type PurchaseDetails,
} from "@/lib/analytics";

const config = readGoogleTagConfig({
  NEXT_PUBLIC_GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
  NEXT_PUBLIC_GOOGLE_ADS_ID: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
  NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL,
});

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

/**
 * Fires the purchase / Ads conversion events once per order.
 *
 * Rendered on the checkout success page. Guarded by sessionStorage so that
 * refreshing that page does not report the same sale twice.
 */
export default function PurchaseConversion({
  transactionId,
  value,
  currency,
}: PurchaseDetails) {
  useEffect(() => {
    if (typeof window.gtag !== "function") return;

    const seenKey = "starmee_conversion_" + transactionId;
    if (window.sessionStorage.getItem(seenKey) !== null) return;
    window.sessionStorage.setItem(seenKey, "1");

    const events = purchaseEvents(config, { transactionId, value, currency });
    for (const [name, params] of events) {
      window.gtag("event", name, params);
    }
  }, [transactionId, value, currency]);

  return null;
}
