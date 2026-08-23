"use client";

import { useEffect, useRef, useState } from "react";
import { useWizardStore } from "./WizardProvider";
import { LoadingAnimation } from "@/components/shared/LoadingAnimation";
import { cn } from "@/lib/utils";
import { BookOpen, PartyPopper, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getPreviewProgressState } from "@/lib/preview-progress";

const POLL_INTERVAL = 3000;

export function StepPreview() {
  const { childName, generationStep, bookId, setGenerating, reset } =
    useWizardStore();
  const [ready, setReady] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [showLongRunningNotice, setShowLongRunningNotice] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | undefined>();
  const [pollAttempt, setPollAttempt] = useState(0);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!bookId) return;
    let active = true;
    startTimeRef.current = Date.now();
    setGenerating(true, "Preparing your story...");

    const poll = async () => {
      try {
        const res = await fetch(`/api/book-status?bookId=${bookId}`);
        if (!active) return;
        if (!res.ok) {
          if ([401, 403, 404].includes(res.status)) {
            setPollError(
              "This book is not available in your current secure session.",
            );
            setGenerating(false);
            if (pollRef.current) clearInterval(pollRef.current);
            return;
          }
          setConnectionIssue(true);
          return;
        }

        const data = await res.json();
        if (!active) return;
        setConnectionIssue(false);
        setServerStatus(
          typeof data.status === "string" ? data.status : undefined,
        );
        const progress = getPreviewProgressState(
          data.status,
          Date.now() - startTimeRef.current,
        );
        setShowLongRunningNotice(progress.showLongRunningNotice);

        if (progress.phase === "ready") {
          setReady(true);
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
          return;
        }

        if (progress.phase === "failed") {
          setPollError("Generation failed. Please try again.");
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
          return;
        }
      } catch {
        if (active) setConnectionIssue(true);
      }
    };

    void poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [bookId, pollAttempt, setGenerating]);

  if (bookId && !ready && !pollError) {
    return (
      <div>
        <LoadingAnimation
          childName={childName}
          currentStep={generationStep}
          serverStatus={serverStatus}
        />
        {(showLongRunningNotice || connectionIssue) && (
          <div
            className="mx-auto -mt-4 max-w-sm rounded-2xl border-2 border-[#FFDE59] bg-[#FFDE59]/20 p-4 text-center"
            role="status"
          >
            <p className="font-body text-sm font-bold text-[#262625]">
              {connectionIssue
                ? "We’re reconnecting and will keep checking this book."
                : `${childName}’s story is still being created.`}
            </p>
            <p className="mt-1 font-body text-xs leading-relaxed text-[#262625]/60">
              There is no need to start again. This page will open the same book
              as soon as it is ready.
            </p>
          </div>
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
          onClick={() => {
            setPollError(null);
            setConnectionIssue(false);
            setShowLongRunningNotice(false);
            setPollAttempt((attempt) => attempt + 1);
          }}
          className="btn-chunky inline-flex items-center gap-2 bg-[#5E17EB] px-6 py-3 font-heading font-bold text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Check Again
        </button>
        <button
          type="button"
          onClick={reset}
          className="block w-full font-body text-sm text-[#262625]/60 underline underline-offset-4"
        >
          Start a different book
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
          We&apos;ve created a personalised storybook with custom illustrations just for {childName}.
        </p>
      </div>

      {/* Preview card */}
      <div className="card-chunky bg-[#CB6CE6]/10 p-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-2 border-[#262625]/10">
          <BookOpen className="h-8 w-8 text-[#5E17EB]" />
        </div>
        <h3 className="font-heading text-lg font-bold text-[#262625]">Preview Available</h3>
        <p className="mt-1 font-body text-sm text-[#262625]/60">
          A free sample illustration showing {childName} as the star of the story
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

      {/* Without this, anyone returning to /create is stuck on whichever book
          was last in progress - including a stranger's on a shared device -
          because the wizard always resumes saved state. */}
      <button
        type="button"
        onClick={reset}
        className="mt-4 w-full font-body text-sm text-[#262625]/60 underline underline-offset-4 transition-colors hover:text-[#7C3AED]"
      >
        Start a different book
      </button>

      <p className="font-body text-xs text-[#262625]/40">
        Bookmark this page to come back to your preview anytime.
      </p>
    </div>
  );
}
