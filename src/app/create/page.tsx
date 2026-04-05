"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWizardStore } from "@/components/create/WizardProvider";
import { ProgressSteps } from "@/components/shared/ProgressSteps";
import { StepChildInfo } from "@/components/create/StepChildInfo";
import { StepPhotoUpload } from "@/components/create/StepPhotoUpload";
import { StepThemeSelect } from "@/components/create/StepThemeSelect";
import { StepQuestions } from "@/components/create/StepQuestions";
import { StepEmail } from "@/components/create/StepEmail";
import { StepPreview } from "@/components/create/StepPreview";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Internal step mapping:
 * 1 = Child Info       (progress step 1)
 * 2 = Photo Upload     (progress step 2)
 * 3 = Theme Select     (progress step 3)
 * 4 = Questions        (progress step 4 -- shown as "Questions")
 * 5 = Email            (progress step 4 visually, but we map to 4)
 * 6 = Preview          (progress step 5)
 */
function stepToProgress(step: number): number {
  if (step <= 3) return step;
  if (step === 4) return 4; // questions
  if (step === 5) return 4; // email still shows as step 4
  return 5; // preview
}

export default function CreatePage() {
  const step = useWizardStore((s) => s.step);
  const prevStep = useWizardStore((s) => s.prevStep);
  const [fadeKey, setFadeKey] = useState(step);
  const [isVisible, setIsVisible] = useState(true);

  // Animate step transitions
  useEffect(() => {
    setIsVisible(false);
    const timeout = setTimeout(() => {
      setFadeKey(step);
      setIsVisible(true);
    }, 150);
    return () => clearTimeout(timeout);
  }, [step]);

  const progressStep = stepToProgress(step);
  const showBack = step > 1 && step < 6;

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-[#FFFBF5]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-violet-700"
          >
            <BookOpen className="h-5 w-5" />
            <span className="font-heading">StorySpark</span>
          </Link>

          {step < 6 && (
            <span className="text-xs font-medium text-gray-400 hidden sm:block">
              Create Your Book
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
        {/* Back button */}
        {showBack && (
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={prevStep}
              className="gap-1.5 text-gray-500 hover:text-violet-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        {/* Step content with fade */}
        <div
          className={cn(
            "transition-all duration-200 ease-in-out",
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          )}
        >
          {fadeKey === 1 && <StepChildInfo />}
          {fadeKey === 2 && <StepPhotoUpload />}
          {fadeKey === 3 && <StepThemeSelect />}
          {fadeKey === 4 && <StepQuestions />}
          {fadeKey === 5 && <StepEmail />}
          {fadeKey === 6 && <StepPreview />}
        </div>
      </main>
    </div>
  );
}
