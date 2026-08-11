"use client";

import { useEffect } from "react";

import {
  previewEvents,
  purchaseEvents,
  readTagConfig,
  type ConversionDetails,
  type TrackedEvent,
} from "@/lib/analytics";

// NEXT_PUBLIC_ vars must be referenced statically so Next can inline them.
const config = readTagConfig({
  NEXT_PUBLIC_GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
  NEXT_PUBLIC_GOOGLE_ADS_ID: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
  NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL,
  NEXT_PUBLIC_GOOGLE_ADS_PREVIEW_LABEL:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_PREVIEW_LABEL,
  NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  NEXT_PUBLIC_BOOK_PRICE: process.env.NEXT_PUBLIC_BOOK_PRICE,
  NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY,
});

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    fbq?: (command: string, ...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

function emit(events: TrackedEvent[]): void {
  for (const event of events) {
    if (event.channel === "gtag") {
      if (typeof window.gtag === "function") {
        window.gtag("event", event.name, event.params);
      }
      continue;
    }

    if (event.channel === "meta") {
      if (typeof window.fbq === "function") {
        window.fbq("track", event.name, event.params, {
          eventID: String(event.params.event_id ?? ""),
        });
      }
      continue;
    }

    // Always pushed - GTM reads the real value from here rather than a
    // hardcoded one, whether or not gtag/fbq loaded.
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(event.params);
  }
}

interface ConversionTrackerProps extends ConversionDetails {
  /** "purchase" -> purchase/Purchase, "preview" -> add_to_cart/AddToCart. */
  kind: "purchase" | "preview";
}

/**
 * Fires one conversion, once.
 *
 * Guarded by sessionStorage so a page refresh, or a customer revisiting
 * their preview, cannot report the same conversion twice.
 */
export default function ConversionTracker({
  kind,
  transactionId,
  value,
  currency,
}: ConversionTrackerProps) {
  useEffect(() => {
    if (transactionId.length === 0) return;

    const seenKey = "starmee_conv_" + kind + "_" + transactionId;
    try {
      if (window.sessionStorage.getItem(seenKey) !== null) return;
      window.sessionStorage.setItem(seenKey, "1");
    } catch {
      // Private browsing can throw on sessionStorage. Tracking is not
      // important enough to break the page over.
      return;
    }

    const details = { transactionId, value, currency };
    emit(
      kind === "purchase"
        ? purchaseEvents(config, details)
        : previewEvents(config, details),
    );
  }, [kind, transactionId, value, currency]);

  return null;
}
