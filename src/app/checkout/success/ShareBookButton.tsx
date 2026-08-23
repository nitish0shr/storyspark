"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { createCompletedBookShareData } from "@/lib/book-sharing";

type ShareStatus = "idle" | "copied" | "manual";

const shareData = createCompletedBookShareData(
  process.env.NEXT_PUBLIC_MARKETING_URL,
);

export default function ShareBookButton() {
  const [status, setStatus] = useState<ShareStatus>("idle");

  const copyLink = async (): Promise<boolean> => {
    if (!navigator.clipboard?.writeText) return false;

    try {
      await navigator.clipboard.writeText(shareData.url);
      setStatus("copied");
      return true;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        // Cancelling a native share sheet is intentional; do not replace it
        // with a fallback message.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    if (!(await copyLink())) {
      setStatus("manual");
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:border-pink-300 hover:text-pink-600 transition-colors"
        onClick={handleShare}
        aria-describedby="book-share-status"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Share
      </button>

      <p id="book-share-status" className="sr-only" aria-live="polite">
        {status === "copied"
          ? "Share link copied to your clipboard."
          : status === "manual"
            ? "Sharing is not available in this browser. Copy the link below to share it."
            : ""}
      </p>

      {status === "copied" && (
        <p className="max-w-xs text-center text-sm font-medium text-green-700" aria-hidden="true">
          <Check className="mr-1 inline h-4 w-4" />
          Sharing isn&apos;t available here, so we copied the Starmee Stories
          link for you.
        </p>
      )}

      {status === "manual" && (
        <div className="w-full max-w-sm rounded-xl border border-violet-200 bg-violet-50 p-3">
          <p className="mb-2 text-sm text-violet-900">
            Sharing and automatic copying aren&apos;t available in this browser.
            Select this Starmee Stories link and use your browser&apos;s copy
            command.
          </p>
          <input
            type="text"
            readOnly
            value={shareData.url}
            aria-label="Starmee Stories link to share"
            onFocus={(event) => event.currentTarget.select()}
            onClick={(event) => event.currentTarget.select()}
            className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-gray-700"
          />
        </div>
      )}
    </div>
  );
}