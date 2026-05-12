"use client";

import { useEffect, useRef, useState } from "react";
import { useWizardStore } from "./WizardProvider";
import { LoadingAnimation } from "@/components/shared/LoadingAnimation";
import { cn } from "@/lib/utils";
import { BookOpen, PartyPopper, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

const POLL_INTERVAL = 3000;
const POLL_TIMEOUT = 120000;

export function StepPreview() {
  const { childName, isGenerating, generationStep, bookId, setGenerating } = useWizardStore();
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!bookId || !isGenerating) return;
    startTimeRef.current = Date.now();

    const poll = async () => {
      try {
        const res = await fetch(`/api/book-status?bookId=${bookId}`);
        if (!res.ok) { setPollError("Failed to check status"); return; }

        const data = await res.json();

        if (data.status === "preview_ready" || data.status === "completed" || data.status === "purchased") {
          setReady(true);
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
          return;
        }

        if (data.status === "failed") {
          setPollError("Generation failed. Please try again.");
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
          return;
        }

        if (Date.now() - startTimeRef.current > POLL_TIMEOUT) {
          setTimedOut(true);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch { /* keep polling */ }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [bookId, isGenerating, setGenerating]);

  if (isGenerating && !ready && !timedOut && !pollError) {
    return <LoadingAnimation childName={childName} currentStep={generationStep} />;
  }

  if (timedOut) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center py-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFDE59] border-2 border-[#262625] shadow-[3px_3px_0px_#262625]">
          <RefreshCw className="h-8 w-8 text-[#262625]" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-[#262625]">
            Taking longer than expected
          </h2>
          <p className="mt-2 font-body text-[#262625]/60 text-sm">
            {childName}&apos;s story is still being created. This can take a few minutes for complex illustrations.
          </p>
        </div>
        {bookId && (
          <Link href={`/preview/${bookId}`} className="btn-chunky inline-flex items-center gap-2 bg-[#FFDE59] px-6 py-3 font-heading font-bold text-[#262625]">
            Check Preview Page
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    );
  }

  if (pollError) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center py-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 border-2 border-red-200">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-[#262625]">Something went wrong</h2>
          <p className="mt-2 font-body text-[#262625]/60 text-sm">{pollError}</p>
        </div>
        <button
          onClick={() => { setPollError(null); setTimedOut(false); setGenerating(true, "Retrying..."); }}
          className="btn-chunky inline-flex items-center gap-2 bg-[#5E17EB] px-6 py-3 font-heading font-bold text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  // Success
  return (
    <div className="mx-auto max-w-md space-y-8 text-center py-8">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FFDE59] border-2 border-[#262625] shadow-[4px_4px_0px_#262625]">
        <PartyPopper className="h-10 w-10 text-[#262625]" />
      </div>

      <div>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#262625]">
          {childName}&apos;s story is ready!
        </h2>
        <p className="mt-3 font-body text-[#262625]/60 leading-relaxed">
          We&apos;ve created a personalized storybook with custom illustrations just for {childName}.
        </p>
      </div>

      {/* Preview card */}
      <div className="card-chunky bg-[#CB6CE6]/10 p-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-2 border-[#262625]/10">
          <BookOpen className="h-8 w-8 text-[#5E17EB]" />
        </div>
        <h3 className="font-heading text-lg font-bold text-[#262625]">Preview Available</h3>
        <p className="mt-1 font-body text-sm text-[#262625]/60">
          5 pages of illustrated story with {childName} as the star
        </p>
      </div>

      <Link
        href={bookId ? `/preview/${bookId}` : "#"}
        className={cn(
          "btn-chunky flex w-full items-center justify-center gap-2 bg-[#FFDE59] py-4 font-heading text-lg font-bold text-[#262625]"
        )}
      >
        View Your Preview
        <ArrowRight className="h-5 w-5" />
      </Link>

      <p className="font-body text-xs text-[#262625]/40">
        Your preview is saved to your account. You can view it anytime from your dashboard.
      </p>
    </div>
  );
}
