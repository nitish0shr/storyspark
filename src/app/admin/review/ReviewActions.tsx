"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewActions({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleAction(action: "approve" | "reject") {
    if (loading) return;

    if (action === "reject") {
      const confirmed = window.confirm(
        "Reject this book? The customer will NOT receive it. You can re-generate it later."
      );
      if (!confirmed) return;
    }

    setLoading(action);

    try {
      const res = await fetch("/api/admin/review-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, action }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Refresh the page to remove the approved/rejected book
      router.refresh();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="ml-auto flex gap-2">
      <button
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {loading === "reject" ? "Rejecting…" : "Reject"}
      </button>
      <button
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading === "approve" ? "Approving…" : "Approve & Deliver"}
      </button>
    </div>
  );
}
