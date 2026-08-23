"use client";

import { useEffect, useState } from "react";
import { useWizardStore } from "@/components/create/WizardProvider";
import { ProgressSteps } from "@/components/shared/ProgressSteps";
import { StepChildInfo } from "@/components/create/StepChildInfo";
import { StepPhotoUpload } from "@/components/create/StepPhotoUpload";
import { StepThemeSelect } from "@/components/create/StepThemeSelect";
import { StepQuestions } from "@/components/create/StepQuestions";
import { StepSummary } from "@/components/create/StepSummary";
import { StepPreview } from "@/components/create/StepPreview";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { cn, getMarketingUrl } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  establishCreatorSession,
  type CreatorIdentity,
} from "@/lib/creator-session";

// Maps internal step numbers (1–6) → visible progress steps (1–5)
// Step 5 (Summary) and step 6 (Preview generation) both show progress step 5
function stepToProgress(step: number): number {
  const map: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 5 };
  return map[step] ?? 1;
}

export default function CreatePage() {
  const step = useWizardStore((s) => s.step);
  const prevStep = useWizardStore((s) => s.prevStep);
  const [fadeKey, setFadeKey] = useState(step);
  const [isVisible, setIsVisible] = useState(true);
  const [creatorIdentity, setCreatorIdentity] =
    useState<CreatorIdentity | null>(null);
  const [authState, setAuthState] = useState<"checking" | "ready" | "error">(
    "checking",
  );
  const [authAttempt, setAuthAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setAuthState("checking");
    setCreatorIdentity(null);

    async function initialiseCreatorSession() {
      try {
        const supabase = createClient();
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }
        const identity = await establishCreatorSession(supabase.auth);
        if (!active) return;
        setCreatorIdentity(identity);
        setAuthState("ready");
      } catch (error) {
        console.warn("Creator session could not be established:", error);
        if (!active) return;
        setAuthState("error");
      }
    }

    void initialiseCreatorSession();
    return () => {
      active = false;
    };
  }, [authAttempt]);

  useEffect(() => {
    setIsVisible(false);
    const timeout = setTimeout(() => {
      setFadeKey(step);
      setIsVisible(true);
    }, 150);
    return () => clearTimeout(timeout);
  }, [step]);

  if (authState === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FDF5E7] px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5E17EB]" aria-hidden="true" />
        <p className="font-body text-sm font-bold text-[#262625]/60">
          Starting your secure book session…
        </p>
      </div>
    );
  }

  if (authState === "error" || !creatorIdentity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDF5E7] px-4">
        <div className="card-chunky max-w-md space-y-5 bg-white p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-[#262625]">
              We couldn&apos;t start a secure session
            </h1>
            <p className="mt-2 font-body text-sm leading-relaxed text-[#262625]/60">
              Your book needs a private guest session so only you can open it.
              Please try again before continuing.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setAuthAttempt((attempt) => attempt + 1)}
            className="btn-chunky w-full gap-2 bg-[#5E17EB] font-heading font-bold text-white"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry secure session
          </Button>
        </div>
      </div>
    );
  }

  const progressStep = stepToProgress(step);
  const showBack = step > 1 && step < 6;

  return (
    <div className="min-h-screen bg-[#FDF5E7] bg-stars">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b-[2.5px] border-[#262625] bg-[#FDF5E7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <a href={getMarketingUrl()} className="flex items-center">
            <img
              src="https://starmeestories.com/wp-content/uploads/2026/04/Starmee-Logo-Primary.png"
              alt="Starmee"
              className="h-9 w-auto"
            />
          </a>

          {step < 6 && (
            <span className="font-body text-xs font-bold text-[#262625]/50 hidden sm:block">
              Create Their Book
            </span>
          )}
        </div>
      </header>

      {/* Progress */}
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-2">
        <ProgressSteps currentStep={progressStep} totalSteps={5} />
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        {showBack && (
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={prevStep}
              className="gap-1.5 text-[#262625]/60 hover:text-[#5E17EB] font-body font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        <div
          className={cn(
            "transition-all duration-200 ease-in-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          {fadeKey === 1 && <StepChildInfo />}
          {fadeKey === 2 && <StepPhotoUpload />}
          {fadeKey === 3 && (
            <StepThemeSelect isGuest={creatorIdentity.isAnonymous} />
          )}
          {fadeKey === 4 && <StepQuestions />}
          {fadeKey === 5 && <StepSummary />}
          {fadeKey === 6 && <StepPreview />}
        </div>
      </main>
    </div>
  );
}
