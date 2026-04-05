"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, BookOpen, Loader2, CheckCircle2 } from "lucide-react";

interface BookStatusPollerProps {
  bookId: string;
  initialStatus: string;
  initialPdfUrl: string | null;
  childName: string;
}

export default function BookStatusPoller({
  bookId,
  initialStatus,
  initialPdfUrl,
  childName,
}: BookStatusPollerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [polling, setPolling] = useState(
    initialStatus !== "complete" && initialStatus !== "completed"
  );

  const isComplete = status === "complete" || status === "completed";
  const isFailed = status === "failed";
  const isGenerating =
    status === "generating" || status === "preview_ready" || status === "paid";

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/book-status?bookId=${bookId}`);
      if (!res.ok) return;

      const data = await res.json();
      setStatus(data.status);

      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
      }

      if (
        data.status === "complete" ||
        data.status === "completed" ||
        data.status === "failed"
      ) {
        setPolling(false);
      }
    } catch {
      // Silently retry on next interval
    }
  }, [bookId]);

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [polling, checkStatus]);

  if (isFailed) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-4">
          <span className="text-2xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-500 mb-4">
          We ran into an issue creating {childName}&apos;s book. Our team has
          been notified and we&apos;ll have it ready soon.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[#7C3AED] font-medium hover:underline"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  if (isComplete && pdfUrl) {
    return (
      <div className="bg-white rounded-2xl border border-green-200 p-8 text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-green-50 mb-4">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Your book is ready!
        </h2>
        <p className="text-gray-500 mb-6">
          {childName}&apos;s personalized storybook has been created and is
          ready to enjoy.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={pdfUrl}
            download
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-shadow"
          >
            <Download className="h-5 w-5" />
            Download Your Book
          </a>
          <a
            href={`/preview/${bookId}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-violet-200 text-violet-700 font-semibold hover:border-violet-400 transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            View in Browser
          </a>
        </div>
      </div>
    );
  }

  // Still generating
  return (
    <div className="bg-white rounded-2xl border border-violet-100 p-8 text-center">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-violet-50 mb-4">
        <Loader2 className="h-7 w-7 text-[#7C3AED] animate-spin" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Creating {childName}&apos;s storybook...
      </h2>
      <p className="text-gray-500 mb-6">
        Our AI illustrators are crafting each page. This usually takes under 2
        minutes.
      </p>

      {/* Progress bar */}
      <div className="max-w-xs mx-auto">
        <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full animate-progress" />
        </div>
        <p className="mt-3 text-sm text-gray-400">
          {isGenerating ? "Generating illustrations..." : "Starting up..."}
        </p>
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 5%; }
          50% { width: 65%; }
          90% { width: 90%; }
          100% { width: 95%; }
        }
        .animate-progress {
          animation: progress 90s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
