"use client";

import { useWizardStore } from "./WizardProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <Label htmlFor={`${label}-name`} className="font-body text-sm font-bold text-[#262625]">
          {label}&apos;s first name
        </Label>
        <Input
          id={`${label}-name`}
          type="text"
          placeholder="e.g. Emma"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-12 rounded-xl border-2 border-[#262625]/20 bg-white px-4 text-base focus-visible:border-[#5E17EB] focus-visible:ring-[#CB6CE6]/20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${label}-age`} className="font-body text-sm font-bold text-[#262625]">
          Age{" "}
          <span className="font-normal text-[#262625]/50">(adjusts story reading level)</span>
        </Label>
        <div className="relative">
          <select
            id={`${label}-age`}
            value={age}
            onChange={(e) => onAgeChange(Number(e.target.value))}
            className={cn(
              "h-12 w-full appearance-none rounded-xl border-2 border-[#262625]/20 bg-white px-4 pr-10 text-base outline-none transition-colors font-body",
              "focus:border-[#5E17EB] focus:ring-2 focus:ring-[#CB6CE6]/20",
              age === -1 && "text-[#262625]/40"
            )}
          >
            <option value={-1} disabled>Select age</option>
            {ageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg className="h-4 w-4 text-[#262625]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="font-body text-sm font-bold text-[#262625]">Gender</Label>
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
                  isSelected
                    ? "border-[#262625] bg-[#FFDE59] shadow-[3px_3px_0px_#262625]"
                    : "border-[#262625]/20 bg-white hover:border-[#CB6CE6] hover:bg-[#CB6CE6]/5"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                  isSelected ? "bg-[#262625] text-[#FFDE59]" : "bg-[#262625]/10 text-[#262625]/50"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "font-body text-xs font-bold sm:text-sm",
                  isSelected ? "text-[#262625]" : "text-[#262625]/60"
                )}>
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
    childName, childAge, childGender,
    setChildName, setChildAge, setChildGender,
    hasSecondChild, secondChildName, secondChildAge, secondChildGender,
    setHasSecondChild, setSecondChildName, setSecondChildAge, setSecondChildGender,
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
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#262625]">
          Tell us about your little one{hasSecondChild ? "s" : ""}
        </h2>
        <p className="mt-2 font-body text-[#262625]/60">
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#262625]/30 bg-white p-4 font-body text-sm font-bold text-[#262625]/50 transition-all hover:border-[#CB6CE6] hover:bg-[#CB6CE6]/5 hover:text-[#5E17EB]"
        >
          <UserPlus className="h-4 w-4" />
          Add a sibling or friend as co-hero
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#5E17EB]" />
              <span className="font-body text-sm font-bold text-[#262625]">Sibling / Friend</span>
            </div>
            <button
              type="button"
              onClick={() => setHasSecondChild(false)}
              className="flex items-center gap-1 font-body text-xs text-[#262625]/40 hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          </div>

          <div className="rounded-2xl border-2 border-[#CB6CE6]/30 bg-[#CB6CE6]/5 p-5">
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

      <button
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
          "btn-chunky h-12 w-full flex items-center justify-center gap-2 font-heading font-bold text-base transition-all",
          isValid
            ? "bg-[#FFDE59] text-[#262625] cursor-pointer"
            : "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300 shadow-none"
        )}
      >
        Next
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
