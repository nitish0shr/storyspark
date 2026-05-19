"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Download,
  BookOpen,
  Loader2,
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
  Palette,
  ShieldCheck,
  Package,
  Mail,
  Heart,
  AlertTriangle,
} from "lucide-react";

interface BookStatusPollerProps {
  bookId: string;
  initialStatus: string;
  initialPdfUrl: string | null;
  childName: string;
}

/**
 * Pizza-tracker style stages. Each stage maps from one (or several) real
 * backend statuses on the `books` table. If/when the backend adds finer
 * grained statuses, just add them to `matches` — the UI updates automatically.
 */
const STAGES = [
  {
    key: "received",
    label: "Order received",
    icon: ClipboardCheck,
    blurb: "We've got your order — thank you!",
    matches: ["paid", "received", "queued"],
  },
  {
    key: "story",
    label: "Writing the story",
    icon: Sparkles,
    blurb: "Our AI storytellers are crafting a one-of-a-kind tale.",
    matches: ["generating_story", "story", "preview_ready"],
  },
  {
    key: "illustrations",
    label: "Designing the book",
    icon: Palette,
    blurb: "Painting every page with your child as the hero.",
    matches: ["generating", "generating_illustrations", "illustrating"],
  },
  {
    key: "quality",
    label: "Quality check",
    icon: ShieldCheck,
    blurb: "Reviewing every page so it's just right.",
    matches: ["quality_check", "reviewing"],
  },
  {
    key: "packaging",
    label: "Packaging your PDF",
    icon: Package,
    blurb: "Binding it all into a beautiful keepsake.",
    matches: ["packaging", "rendering_pdf"],
  },
  {
    key: "sending",
    label: "Sending it your way",
    icon: Mail,
    blurb: "Your download link is on its way to your inbox.",
    matches: ["sending", "emailing"],
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: Heart,
    blurb: "Enjoy the story together!",
    matches: ["complete", "completed", "delivered"],
  },
] as const;

function stageIndexFor(status: string): number {
  const s = (status || "").toLowerCase();
  for (let i = 0; i < STAGES.length; i++) {
    if (STAGES[i].matches.some((m) => s === m)) return i;
  }
  // Unknown / early statuses (draft, pending, preview_generating) → before stage 1
  return 0;
}

export default function BookStatusPoller({
  bookId,
  initialStatus,
  initialPdfUrl,
  childName,
}: BookStatusPollerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);

  // While we wait for the real backend to advance, the UI walks slowly
  // through the early stages so the customer always feels progress.
  const [simulatedIndex, setSimulatedIndex] = useState(() =>
    stageIndexFor(initialStatus)
  );

  const isFailed = status === "failed";
  const isComplete =
    status === "complete" || status === "completed" || status === "delivered";

  const realIndex = stageIndexFor(status);
  // Always show the furthest stage we've reached (real OR simulated), so the
  // tracker only ever moves forward.
  const currentIndex = Math.max(realIndex, simulatedIndex);
  const polling = !isComplete && !isFailed;

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/book-status?bookId=${bookId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status) setStatus(data.status);
      if (data.pdfUrl) setPdfUrl(data.pdfUrl);
    } catch {
      // Silently retry on next interval — the next poll will recover.
    }
  }, [bookId]);

  // Poll the real backend every 3s.
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [polling, checkStatus]);

  // Gently nudge the simulated index forward (max stops one step before
  // "delivered" — only the real backend can mark it delivered).
  useEffect(() => {
    if (!polling) return;
    const tick = setInterval(() => {
      setSimulatedIndex((prev) => Math.min(prev + 1, STAGES.length - 2));
    }, 18000);
    return () => clearInterval(tick);
  }, [polling]);

  // -------- Failure state --------
  if (isFailed) {
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

  // -------- Complete state --------
  if (isComplete && pdfUrl) {
    return (
      <div className="bg-white rounded-2xl border border-green-200 p-8 text-center shadow-sm">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-green-50 mb-4">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {childName}&apos;s book is ready!
        </h2>
        <p className="text-gray-500 mb-6">
          We&apos;ve also emailed you a download link, so you can come back to
          it any time.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={pdfUrl}
            download
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-shadow"
          >
            <Download className="h-5 w-5" />
            Download the book
          </a>
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

  // -------- In-progress tracker --------
  const activeStage = STAGES[currentIndex];
  const progressPct = ((currentIndex + 1) / STAGES.length) * 100;

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
          {activeStage.blurb}
        </p>
      </div>

      {/* Stage list */}
      <ol className="relative space-y-3 mb-6">
        {STAGES.map((stage, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const Icon = stage.icon;
          return (
            <li
              key={stage.key}
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
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    active ? "text-gray-900" : done ? "text-gray-700" : "text-gray-500"
                  }`}
                >
                  {stage.label}
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

      {/* Overall progress bar */}
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
          Most books finish in a few minutes. Refreshing won&apos;t make it
          faster — promise!
        </p>
      </div>
    </div>
  );
}
