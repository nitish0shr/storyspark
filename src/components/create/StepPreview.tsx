"use client";

import { useEffect, useRef, useState } from "react";
import { useWizardStore } from "./WizardProvider";
import { LoadingAnimation } from "@/components/shared/LoadingAnimation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, PartyPopper, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

const POLL_INTERVAL = 3000; // 3 seconds
const POLL_TIMEOUT = 120000; // 2 minutes

export function StepPreview() {
  const { childName, isGenerating, generationStep, bookId, setGenerating } =
    useWizardStore();
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
        if (!res.ok) {
          setPollError("Failed to check status");
          return;
        }

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

        // Check timeout
        if (Date.now() - startTimeRef.current > POLL_TIMEOUT) {
          setTimedOut(true);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Network error — keep polling
      }
    };

    // Initial poll
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [bookId, isGenerating, setGenerating]);

  // Generating state with real polling
  if (isGenerating && !ready && !timedOut && !pollError) {
    return <LoadingAnimation childName={childName} currentStep={generationStep} />;
  }

  // Timed out
  if (timedOut) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center py-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <RefreshCw className="h-8 w-8 text-amber-600" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Taking longer than expected
          </h2>
          <p className="mt-2 text-gray-500 text-sm">
            {childName}&apos;s story is still being created. This can take a few
            minutes for complex illustrations.
          </p>
        </div>
        {bookId && (
          <Link href={`/preview/${bookId}`}>
            <Button className="h-12 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold">
              Check Preview Page
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    );
  }

  // Error state
  if (pollError) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center py-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-gray-500 text-sm">{pollError}</p>
        </div>
        <Button
          onClick={() => {
            setPollError(null);
            setTimedOut(false);
            setGenerating(true, "Retrying...");
          }}
          className="h-12 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // Success state
  return (
    <div className="mx-auto max-w-md space-y-8 text-center py-8">
      {/* Celebration icon */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg shadow-violet-200">
        <PartyPopper className="h-10 w-10 text-white" />
      </div>

      <div>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">
          {childName}&apos;s story is ready!
        </h2>
        <p className="mt-3 text-gray-500 leading-relaxed">
          We&apos;ve created a personalized storybook with custom illustrations
          just for {childName}. Take a look at the preview!
        </p>
      </div>

      {/* Preview card */}
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-pink-50 p-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
          <BookOpen className="h-8 w-8 text-violet-600" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-gray-800">
          Preview Available
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          5 pages of illustrated story with {childName} as the star
        </p>
      </div>

      <Link href={bookId ? `/preview/${bookId}` : "#"}>
        <Button
          className={cn(
            "h-14 w-full rounded-xl text-lg font-semibold transition-all",
            "bg-gradient-to-r from-violet-600 to-pink-500 text-white",
            "hover:shadow-xl hover:shadow-violet-200 hover:brightness-105"
          )}
        >
          View Your Preview
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>

      <p className="text-xs text-gray-400">
        Your preview is saved to your account. You can view it anytime from your
        dashboard.
      </p>
    </div>
  );
}
