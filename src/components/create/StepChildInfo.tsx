"use client";

import { useWizardStore } from "./WizardProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Baby, User, Smile, ArrowRight } from "lucide-react";

const ageOptions = [
  { value: -2, label: "Pre-birth (Sonogram)" },
  { value: 0, label: "Newborn (0-1)" },
  { value: 1, label: "1 year old" },
  { value: 2, label: "2 years old" },
  { value: 3, label: "3 years old" },
  { value: 4, label: "4 years old" },
  { value: 5, label: "5 years old" },
  { value: 6, label: "6 years old" },
  { value: 7, label: "7 years old" },
  { value: 8, label: "8 years old" },
  { value: 9, label: "9 years old" },
  { value: 10, label: "10 years old" },
  { value: 11, label: "11 years old" },
  { value: 12, label: "12 years old" },
];

const genderOptions = [
  { value: "boy" as const, label: "Boy", icon: Baby },
  { value: "girl" as const, label: "Girl", icon: Smile },
  { value: "neutral" as const, label: "Prefer not to say", icon: User },
];

export function StepChildInfo() {
  const {
    childName,
    childAge,
    childGender,
    setChildName,
    setChildAge,
    setChildGender,
    nextStep,
  } = useWizardStore();

  const isValid = childName.trim().length > 0 && childAge !== -1 && childGender !== "";

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">
          Tell us about your little one
        </h2>
        <p className="mt-2 text-gray-500">
          We&apos;ll use this to personalize every page of the story.
        </p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="childName" className="text-sm font-medium text-gray-700">
          Child&apos;s first name
        </Label>
        <Input
          id="childName"
          type="text"
          placeholder="e.g. Emma"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          className="h-12 rounded-xl border-gray-200 bg-white px-4 text-base focus-visible:border-violet-400 focus-visible:ring-violet-200"
        />
      </div>

      {/* Age */}
      <div className="space-y-2">
        <Label htmlFor="childAge" className="text-sm font-medium text-gray-700">
          Age
        </Label>
        <div className="relative">
          <select
            id="childAge"
            value={childAge}
            onChange={(e) => setChildAge(Number(e.target.value))}
            className={cn(
              "h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-base outline-none transition-colors",
              "focus:border-violet-400 focus:ring-2 focus:ring-violet-200",
              childAge === -1 && "text-gray-400"
            )}
          >
            <option value={-1} disabled>
              Select age
            </option>
            {ageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">Gender</Label>
        <div className="grid grid-cols-3 gap-3">
          {genderOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = childGender === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setChildGender(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                  "hover:border-violet-300 hover:bg-violet-50/50",
                  isSelected
                    ? "border-violet-600 bg-violet-50 shadow-sm shadow-violet-100"
                    : "border-gray-200 bg-white"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    isSelected
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium sm:text-sm",
                    isSelected ? "text-violet-700" : "text-gray-600"
                  )}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Next */}
      <Button
        onClick={nextStep}
        disabled={!isValid}
        className={cn(
          "h-12 w-full rounded-xl text-base font-semibold transition-all",
          isValid
            ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:shadow-lg hover:shadow-violet-200 hover:brightness-105"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        )}
      >
        Next
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
