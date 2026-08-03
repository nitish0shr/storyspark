"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWizardStore } from "@/components/create/WizardProvider";
import { ProgressSteps } from "@/components/shared/ProgressSteps";
import { StepChildInfo } from "@/components/create/StepChildInfo";
import { StepPhotoUpload } from "@/components/create/StepPhotoUpload";
import { StepThemeSelect } from "@/components/create/StepThemeSelect";
import { StepQuestions } from "@/components/create/StepQuestions";
import { StepSummary } from "@/components/create/StepSummary";
import { StepPreview } from "@/components/create/StepPreview";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setAuthChecked(true);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setAuthChecked(true);
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }: { data: { user: unknown } }) => {
      if (!user) {
        supabase.auth
          .signInAnonymously()
          .then(() => setAuthChecked(true))
          .catch((err: unknown) => {
            console.warn("Anonymous sign-in failed, continuing anyway:", err);
            setAuthChecked(true);
          });
      } else {
        setAuthChecked(true);
      }
    });
  }, []);

  useEffect(() => {
    setIsVisible(false);
    const timeout = setTimeout(() => {
      setFadeKey(step);
      setIsVisible(true);
    }, 150);
    return () => clearTimeout(timeout);
  }, [step]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDF5E7]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5E17EB]" />
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
          <Link href="/" className="flex items-center">
            <img
              src="https://starmeestories.com/wp-content/uploads/2026/04/Starmee-Logo-Primary.png"
              alt="Starmee"
              className="h-9 w-auto"
            />
          </Link>

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
          {fadeKey === 3 && <StepThemeSelect />}
          {fadeKey === 4 && <StepQuestions />}
          {fadeKey === 5 && <StepSummary />}
          {fadeKey === 6 && <StepPreview />}
        </div>
      </main>
    </div>
  );
}
