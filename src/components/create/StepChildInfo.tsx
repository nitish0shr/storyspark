"use client";

import { useWizardStore } from "./WizardProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Baby, Smile, ArrowRight, UserPlus, X } from "lucide-react";
import { usePostHog } from "posthog-js/react";

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
];

function ChildForm({
  label,
  name,
  age,
  gender,
  onNameChange,
  onAgeChange,
  onGenderChange,
}: {
  label: string;
  name: string;
  age: number;
  gender: string;
  onNameChange: (n: string) => void;
  onAgeChange: (a: number) => void;
  onGenderChange: (g: "boy" | "girl" | "neutral") => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor={`${label}-name`} className="text-sm font-medium text-gray-700">
          {label}&apos;s first name
        </Label>
        <Input
          id={`${label}-name`}
          type="text"
          placeholder="e.g. Emma"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-12 rounded-xl border-gray-200 bg-white px-4 text-base focus-visible:border-violet-400 focus-visible:ring-violet-200"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${label}-age`} className="text-sm font-medium text-gray-700">
          Age{" "}
          <span className="font-normal text-gray-400">(adjusts story reading level)</span>
        </Label>
        <div className="relative">
          <select
            id={`${label}-age`}
            value={age}
            onChange={(e) => onAgeChange(Number(e.target.value))}
            className={cn(
              "h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-base outline-none transition-colors",
              "focus:border-violet-400 focus:ring-2 focus:ring-violet-200",
              age === -1 && "text-gray-400"
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
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">Gender</Label>
        <div className="grid grid-cols-3 gap-3">
          {genderOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = gender === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onGenderChange(option.value)}
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
                    isSelected ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"
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
    </div>
  );
}

export function StepChildInfo() {
  const {
    childName,
    childAge,
    childGender,
    setChildName,
    setChildAge,
    setChildGender,
    hasSecondChild,
    secondChildName,
    secondChildAge,
    secondChildGender,
    setHasSecondChild,
    setSecondChildName,
    setSecondChildAge,
    setSecondChildGender,
    nextStep,
  } = useWizardStore();

  const posthog = usePostHog();

  const firstValid = childName.trim().length > 0 && childAge !== -1 && childGender !== "";
  const secondValid = !hasSecondChild || (
    secondChildName.trim().length > 0 && secondChildAge !== -1 && secondChildGender !== ""
  );
  const isValid = firstValid && secondValid;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">
          Tell us about your little one{hasSecondChild ? "s" : ""}
        </h2>
        <p className="mt-2 text-gray-500">
          We&apos;ll use this to personalize every page of the story.
        </p>
      </div>

      <ChildForm
        label="Child"
        name={childName}
        age={childAge}
        gender={childGender}
        onNameChange={setChildName}
        onAgeChange={setChildAge}
        onGenderChange={setChildGender}
      />

      {!hasSecondChild ? (
        <button
          type="button"
          onClick={() => setHasSecondChild(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 text-sm font-medium text-gray-500 transition-all hover:border-violet-300 hover:bg-violet-50/30 hover:text-violet-600"
        >
          <UserPlus className="h-4 w-4" />
          Add a sibling or friend as co-hero
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-semibold text-gray-700">
                Sibling / Friend
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHasSecondChild(false)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/30 p-5">
            <ChildForm
              label="Second child"
              name={secondChildName}
              age={secondChildAge}
              gender={secondChildGender}
              onNameChange={setSecondChildName}
              onAgeChange={setSecondChildAge}
              onGenderChange={setSecondChildGender}
            />
          </div>
        </div>
      )}

      <Button
        onClick={() => {
          posthog.capture("wizard_step_completed", {
            step: "child_info",
            child_age: childAge,
            child_gender: childGender,
            has_second_child: hasSecondChild,
          });
          nextStep();
        }}
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
