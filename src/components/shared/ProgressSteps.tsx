"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const stepLabels = ["Child Info", "Photo", "Theme", "Personalise", "Preview"];

interface ProgressStepsProps {
  currentStep: number;
  totalSteps?: number;
}

export function ProgressSteps({ currentStep, totalSteps = 5 }: ProgressStepsProps) {
  return (
    <nav aria-label="Wizard progress" className="w-full">
      {/* Desktop: full labels */}
      <ol className="hidden sm:flex items-center justify-center gap-0">
        {stepLabels.slice(0, totalSteps).map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;

          return (
            <li key={label} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300",
                    isCompleted && "border-[#262625] bg-[#5E17EB] text-white shadow-[2px_2px_0px_#262625]",
                    isCurrent && "border-[#262625] bg-[#FFDE59] text-[#262625] shadow-[2px_2px_0px_#262625]",
                    !isCompleted && !isCurrent && "border-gray-300 bg-white text-gray-400"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                </div>
                <span
                  className={cn(
                    "font-body text-sm font-bold transition-colors duration-300",
                    isCompleted && "text-[#5E17EB]",
                    isCurrent && "text-[#262625]",
                    !isCompleted && !isCurrent && "text-gray-400"
                  )}
                >
                  {label}
                </span>
              </div>

              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    "mx-3 h-0.5 w-8 lg:w-12 rounded-full transition-colors duration-300",
                    currentStep > stepNumber ? "bg-[#5E17EB]" : "bg-gray-200"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: dots only */}
      <div className="flex sm:hidden items-center justify-center gap-2">
        {stepLabels.slice(0, totalSteps).map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;

          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  isCurrent && "w-8 bg-[#FFDE59] border border-[#262625]",
                  isCompleted && "w-2.5 bg-[#5E17EB]",
                  !isCompleted && !isCurrent && "w-2.5 bg-gray-200"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile: current step label */}
      <p className="mt-2 text-center text-xs font-bold font-body text-[#5E17EB] sm:hidden">
        Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
      </p>

      {currentStep < totalSteps && (
        <p className="mt-1 text-center text-[11px] font-body text-[#262625]/40">
          About 2 minutes total
        </p>
      )}
    </nav>
  );
}
