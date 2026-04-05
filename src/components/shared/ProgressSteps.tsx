"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const stepLabels = ["Child Info", "Photo", "Theme", "Personalize", "Preview"];

interface ProgressStepsProps {
  currentStep: number;
  totalSteps?: number;
}

export function ProgressSteps({
  currentStep,
  totalSteps = 5,
}: ProgressStepsProps) {
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
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                    isCompleted &&
                      "border-violet-600 bg-violet-600 text-white",
                    isCurrent &&
                      "border-violet-600 bg-violet-50 text-violet-600 ring-4 ring-violet-100",
                    !isCompleted &&
                      !isCurrent &&
                      "border-gray-200 bg-white text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    isCompleted && "text-violet-600",
                    isCurrent && "text-violet-700 font-semibold",
                    !isCompleted && !isCurrent && "text-gray-400"
                  )}
                >
                  {label}
                </span>
              </div>

              {/* Connector line */}
              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    "mx-3 h-0.5 w-8 lg:w-12 rounded-full transition-colors duration-300",
                    currentStep > stepNumber ? "bg-violet-600" : "bg-gray-200"
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
                  isCurrent && "w-8 bg-violet-600",
                  isCompleted && "w-2.5 bg-violet-600",
                  !isCompleted && !isCurrent && "w-2.5 bg-gray-200"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile: current step label */}
      <p className="mt-2 text-center text-xs font-medium text-violet-600 sm:hidden">
        Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
      </p>

      {/* Time estimate */}
      {currentStep < totalSteps && (
        <p className="mt-1 text-center text-[11px] text-gray-400">
          About 2 minutes total
        </p>
      )}
    </nav>
  );
}
