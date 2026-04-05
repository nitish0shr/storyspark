"use client";

import { useState } from "react";
import { Crown, Calendar, Pause, Play, X, AlertCircle, Loader2 } from "lucide-react";

interface SubscriptionData {
  id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  books_generated: number;
  child_profile_id: string;
}

interface SubscriptionCardProps {
  subscription: SubscriptionData;
  childName: string;
}

export default function SubscriptionCard({
  subscription,
  childName,
}: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sub, setSub] = useState(subscription);

  const nextBillingDate = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const isActive = sub.status === "active" && !sub.cancel_at_period_end;
  const isCanceling = sub.status === "active" && sub.cancel_at_period_end;
  const isPaused = sub.status === "paused";
  const isPastDue = sub.status === "past_due";

  const statusLabel = isCanceling
    ? "Canceling"
    : isPaused
    ? "Paused"
    : isPastDue
    ? "Past Due"
    : "Active";

  const statusColor = isCanceling
    ? "text-amber-600 bg-amber-50 border-amber-200"
    : isPaused
    ? "text-gray-600 bg-gray-50 border-gray-200"
    : isPastDue
    ? "text-red-600 bg-red-50 border-red-200"
    : "text-emerald-600 bg-emerald-50 border-emerald-200";

  async function handleAction(action: "cancel" | "resume" | "pause") {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Something went wrong");
        return;
      }
      setMessage(data.message);
      if (action === "cancel") {
        setSub({ ...sub, cancel_at_period_end: true });
      } else if (action === "resume") {
        setSub({ ...sub, cancel_at_period_end: false, status: "active" });
      } else if (action === "pause") {
        setSub({ ...sub, status: "paused" });
      }
    } catch {
      setMessage("Failed to update subscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 shadow-md">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-gray-900">
              Monthly Book Club
            </h3>
            <p className="text-sm text-gray-500">for {childName}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl bg-white/70 p-3 border border-violet-100">
          <p className="text-xs text-gray-400 mb-0.5">Books Created</p>
          <p className="font-heading text-xl font-bold text-gray-900">
            {sub.books_generated}
          </p>
        </div>
        {nextBillingDate && (
          <div className="rounded-xl bg-white/70 p-3 border border-violet-100">
            <p className="text-xs text-gray-400 mb-0.5">
              {isCanceling ? "Access Until" : "Next Book"}
            </p>
            <p className="font-heading text-sm font-bold text-gray-900 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-violet-500" />
              {nextBillingDate}
            </p>
          </div>
        )}
      </div>

      {isPastDue && (
        <div className="flex items-center gap-2 mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600">
            Payment failed. Please update your payment method to continue receiving books.
          </p>
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-lg bg-violet-50 border border-violet-200 px-3 py-2">
          <p className="text-xs text-violet-700">{message}</p>
        </div>
      )}

      <div className="flex gap-2">
        {isActive && (
          <>
            <button
              onClick={() => handleAction("pause")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              Pause
            </button>
            <button
              onClick={() => handleAction("cancel")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Cancel
            </button>
          </>
        )}
        {isPaused && (
          <button
            onClick={() => handleAction("resume")}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Resume
          </button>
        )}
        {isCanceling && (
          <button
            onClick={() => handleAction("resume")}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Keep Subscription
          </button>
        )}
      </div>
    </div>
  );
}
