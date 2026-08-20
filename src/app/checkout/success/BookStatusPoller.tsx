"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Download,
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  LIFECYCLE_STAGES,
  resolveCanonicalStage,
  isDeliveredStage,
  type LifecycleStage,
} from "@/lib/book-lifecycle";

/** A durable, final storage/access link shown once the book is Delivered. */
export interface DurableLink {
  label: string;
  url: string;
}

interface BookStatusPollerProps {
  bookId: string;
  /** books.lifecycle_stage (canonical value) — may be null on legacy rows. */
  initialStatus: string | null;
  /** Legacy books.status column — used only as a fallback when the canonical stage is null. */
  initialLegacyStatus?: string | null;
  initialPdfUrl: string | null;
  childName: string;
  /** ISO timestamp when the book reached Delivered (stage_delivered_at). */
  initialDeliveredAt?: string | null;
  /** Durable, verified final storage/access links, available once Delivered. */
  initialDurableLinks?: DurableLink[];
  checkoutSessionId?: string | null;
}

/**
 * Customer-facing progress tracker.
 *
 * Displays the EXACT canonical lifecycle stages the backend reports — it never
 * simulates or invents fulfilment progress. The tracker advances only when the
 * backend reports a new canonical stage.
 *
 * Canonical lifecycle (backend):
 *   Generated → Under Review → (Changes Requested → Revised →) Approved
 *   → Ready for Purchase → Purchased → Delivered
 *
 * Internal review stages are shown with customer-appropriate copy but remain
 * the exact canonical stages — no collapsing into invented steps.
 */
const STAGE_COPY: Record<LifecycleStage, { label: string; blurb: string }> = {
  Generated: {
    label: "Story created",
    blurb: "Your child's story has been written — we're checking it over.",
  },
  "Under Review": {
    label: "Being reviewed",
    blurb: "Our team is reviewing every page to make sure it's just right.",
  },
  "Changes Requested": {
    label: "Being refined",
    blurb: "We've asked for a few tweaks to make the book even better.",
  },
  Revised: {
    label: "Being refined",
    blurb: "The story has been revised and is going back for a final look.",
  },
  Approved: {
    label: "Approved",
    blurb: "Your book has been approved — we're preparing it for you now.",
  },
  "Ready for Purchase": {
    label: "Ready",
    blurb: "Your book is ready and being finalised.",
  },
  Purchased: {
    label: "Order confirmed",
    blurb: "Your purchase is confirmed — we're finishing your book now.",
  },
  Delivered: {
    label: "Ready to read!",
    blurb: "Your book is complete — enjoy the story together!",
  },
};

/** Ordered stages shown in the customer tracker. Exact canonical stages. */
const VISIBLE_STAGES: readonly LifecycleStage[] = LIFECYCLE_STAGES;

/** Index of a canonical stage in the visible list, or -1 if not resolvable. */
function stageIndexFor(stage: LifecycleStage | null): number {
  if (!stage) return -1;
  return VISIBLE_STAGES.indexOf(stage);
}

export default function BookStatusPoller({
  bookId,
  initialStatus,
  initialLegacyStatus = null,
  initialPdfUrl,
  childName,
  initialDeliveredAt = null,
  initialDurableLinks = [],
  checkoutSessionId = null,
}: BookStatusPollerProps) {
  const [canonicalStage, setCanonicalStage] = useState<LifecycleStage | null>(
    () => resolveCanonicalStage(initialStatus, initialLegacyStatus)
  );
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [deliveredAt, setDeliveredAt] = useState<string | null>(initialDeliveredAt);
  const [durableLinks, setDurableLinks] = useState<DurableLink[]>(initialDurableLinks);
  const [failed, setFailed] = useState(
    () => (initialLegacyStatus || "").toLowerCase() === "failed"
  );

  const delivered = isDeliveredStage(canonicalStage);
  const polling = !delivered && !failed;

  const checkStatus = useCallback(async () => {
    try {
      const query = new URLSearchParams({ bookId });
      if (checkoutSessionId) query.set("sessionId", checkoutSessionId);
      const res = await fetch(`/api/book-status?${query.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      const rawLegacy: string | null = data.status ?? null;
      if ((rawLegacy || "").toLowerCase() === "failed") {
        setFailed(true);
        return;
      }
      // Prefer canonical lifecycle_stage; fall back to legacy status only when null.
      const resolved = resolveCanonicalStage(data.lifecycleStage ?? null, rawLegacy);
      if (resolved) setCanonicalStage(resolved);
      if (data.pdfUrl) setPdfUrl(data.pdfUrl);
      if (data.deliveredAt) setDeliveredAt(data.deliveredAt);
      if (Array.isArray(data.durableLinks) && data.durableLinks.length > 0) {
        setDurableLinks(data.durableLinks as DurableLink[]);
      }
    } catch {
      // Silently retry on next interval.
    }
  }, [bookId, checkoutSessionId]);

  // Poll every 5 s while in progress. No simulated advancement — the tracker
  // reflects only what the backend reports.
  useEffect(() => {
    if (!polling) return;
    const id = setInterval(checkStatus, 5000);
    return () => clearInterval(id);
  }, [polling, checkStatus]);

  // ── Failure state ──────────────────────────────────────────────────────────

  if (failed) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center shadow-sm">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-amber-50 mb-4">
          <AlertTriangle className="h-7 w-7 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          We hit a snag — but we&apos;re on it
        </h2>
        <p className="text-gray-500 mb-2">
          Something went wrong while creating {childName}&apos;s book, and our
          team has already been alerted.
        </p>
        <p className="text-gray-500 mb-6">
          You haven&apos;t been charged twice. We&apos;ll either fix it
          automatically and email you when the book is ready, or refund you in
          full. No action needed from you right now.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            Go to my dashboard
          </a>
          <a
            href="mailto:hello@starmeestories.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] text-white font-medium hover:bg-[#6d28d9] transition-colors"
          >
            Email support
          </a>
        </div>
      </div>
    );
  }

  // ── Delivered / complete state ─────────────────────────────────────────────

  if (delivered) {
    const deliveredLabel = deliveredAt
      ? new Date(deliveredAt).toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    // Prefer durable, verified final links; fall back to the book PDF URL.
    const links: DurableLink[] =
      durableLinks.length > 0
        ? durableLinks
        : pdfUrl
          ? [{ label: "Download the book", url: pdfUrl }]
          : [];

    return (
      <div className="bg-white rounded-2xl border border-green-200 p-8 text-center shadow-sm">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-green-50 mb-4">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {childName}&apos;s book is ready!
        </h2>
        {deliveredLabel && (
          <p className="text-sm text-gray-500 mb-1">Delivered {deliveredLabel}</p>
        )}
        <p className="text-gray-500 mb-6">
          We&apos;ve also emailed you a download link, so you can come back to
          it any time.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {links.map((link, i) => (
            <a
              key={link.url + i}
              href={link.url}
              download
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-shadow"
            >
              <Download className="h-5 w-5" />
              {link.label}
            </a>
          ))}
          <a
            href={`/preview/${bookId}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-violet-200 text-violet-700 font-semibold hover:border-violet-400 transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            Read in browser
          </a>
        </div>
      </div>
    );
  }

  // ── In-progress tracker ────────────────────────────────────────────────────

  // Only stages up to and including the current one are shown as reached; we
  // never simulate stages the backend has not reported.
  const currentIndex = stageIndexFor(canonicalStage);
  const activeStage = currentIndex >= 0 ? VISIBLE_STAGES[currentIndex] : null;
  const activeCopy = activeStage ? STAGE_COPY[activeStage] : null;
  const reachedCount = currentIndex >= 0 ? currentIndex + 1 : 0;
  const progressPct = (reachedCount / VISIBLE_STAGES.length) * 100;

  return (
    <div className="bg-white rounded-2xl border border-violet-100 p-6 sm:p-8 shadow-sm">
      {/* Headline */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-violet-50 mb-4">
          <Loader2 className="h-7 w-7 text-[#7C3AED] animate-spin" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
          Creating {childName}&apos;s storybook
        </h2>
        <p className="text-gray-500 text-sm">
          {activeCopy
            ? activeCopy.blurb
            : "Your purchase is confirmed — we're getting started on your book."}
        </p>
      </div>

      {/* Stage list — exact canonical stages */}
      <ol className="relative space-y-3 mb-6">
        {VISIBLE_STAGES.map((stage, i) => {
          const done = currentIndex >= 0 && i < currentIndex;
          const active = i === currentIndex;
          return (
            <li
              key={stage}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                active
                  ? "bg-violet-50/70"
                  : done
                    ? "opacity-80"
                    : "opacity-40"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                  done
                    ? "bg-green-500 border-green-500 text-white"
                    : active
                      ? "bg-white border-violet-300 text-[#7C3AED]"
                      : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    active
                      ? "text-gray-900"
                      : done
                        ? "text-gray-700"
                        : "text-gray-500"
                  }`}
                >
                  {STAGE_COPY[stage].label}
                </p>
              </div>
              {active && (
                <span className="text-xs font-medium text-[#7C3AED] whitespace-nowrap">
                  in progress
                </span>
              )}
              {done && (
                <span className="text-xs font-medium text-green-600 whitespace-nowrap">
                  done
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Reassurance */}
      <div className="text-center text-sm text-gray-500 space-y-1">
        <p>
          You can close this page and come back later — we&apos;ll email a
          download link the moment it&apos;s ready.
        </p>
        <p className="text-xs text-gray-400">
          We&apos;ll keep this page up to date as your book progresses.
        </p>
      </div>
    </div>
  );
}
