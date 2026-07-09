"use client";

import { useRef, useState } from "react";
import { useWizardStore } from "./WizardProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Baby, Smile, ArrowRight, UserPlus, X, Camera, Loader2, CheckCircle2,
} from "lucide-react";
import { usePostHog } from "posthog-js/react";

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const SECOND_CONSENT_TEXT =
  "I am the parent or legal guardian of the child in this photo (or have their parent's permission) and consent to it being used only to create this storybook. It is deleted right after analysis and is never used to train AI.";

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

function SecondChildPhotoSection() {
  const secondChildName = useWizardStore((s) => s.secondChildName);
  const secondChildPhotoPreviewUrl = useWizardStore((s) => s.secondChildPhotoPreviewUrl);
  const secondAppearanceProfile = useWizardStore((s) => s.secondAppearanceProfile);
  const setSecondChildPhoto = useWizardStore((s) => s.setSecondChildPhoto);
  const clearSecondChildPhoto = useWizardStore((s) => s.clearSecondChildPhoto);
  const setSecondAppearanceDescription = useWizardStore((s) => s.setSecondAppearanceDescription);
  const setSecondAppearanceProfile = useWizardStore((s) => s.setSecondAppearanceProfile);

  const [file, setFile] = useState<File | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyzed = !!secondAppearanceProfile;
  const name = secondChildName || "the second child";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    setError(null);

    if (!ALLOWED_PHOTO_TYPES.includes(picked.type)) {
      setError("Please choose a JPG, PNG, or WEBP photo.");
      return;
    }
    if (picked.size > MAX_PHOTO_BYTES) {
      setError("That photo is too large. Please choose one under 10 MB.");
      return;
    }
    if (picked.size === 0) {
      setError("That file looks empty. Please try a different photo.");
      return;
    }

    if (secondChildPhotoPreviewUrl) URL.revokeObjectURL(secondChildPhotoPreviewUrl);
    setFile(picked);
    setSecondChildPhoto(picked, URL.createObjectURL(picked));
    setSecondAppearanceDescription(null);
    setSecondAppearanceProfile(null);
    setConsentChecked(false);
  }

  function handleRemove() {
    if (secondChildPhotoPreviewUrl) URL.revokeObjectURL(secondChildPhotoPreviewUrl);
    clearSecondChildPhoto();
    setFile(null);
    setConsentChecked(false);
    setError(null);
  }

  async function handleAnalyze() {
    if (!file || !consentChecked || loading) return;
    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("photo", file);

      const res = await fetch("/api/analyze-photo", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not analyse the photo. Please try again or continue without it.");
        setLoading(false);
        return;
      }

      setSecondAppearanceDescription(data.description ?? null);
      setSecondAppearanceProfile(data.profile ?? null);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again or continue without a photo.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 space-y-3 border-t border-[#262625]/10 pt-5">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-[#5E17EB]" />
        <span className="font-body text-sm font-bold text-[#262625]">
          Add {name}&apos;s photo{" "}
          <span className="font-normal text-[#262625]/40">(optional)</span>
        </span>
      </div>
      <p className="font-body text-xs text-[#262625]/50 leading-relaxed">
        We&apos;ll match {name}&apos;s look in the illustrations too. The photo is analysed once and
        deleted straight away.
      </p>

      {!secondChildPhotoPreviewUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#262625]/20 bg-white p-4 font-body text-sm font-bold text-[#262625]/50 transition-all hover:border-[#5E17EB]/40 hover:bg-[#FDF5E7]/60 hover:text-[#5E17EB]"
        >
          <Camera className="h-4 w-4" />
          Choose a photo
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-xl border-2 border-[#262625]/10 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={secondChildPhotoPreviewUrl}
            alt={`${name} photo preview`}
            className="max-h-40 w-full object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#262625]/20 bg-white transition-colors hover:border-red-300 hover:bg-red-50"
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5 text-[#262625]" />
          </button>
          {analyzed && (
            <div className="flex items-center gap-2 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              <span className="font-body text-xs text-[#262625]/60">
                Photo analysed — {name} will be matched in the illustrations
              </span>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {file && !analyzed && (
        <>
          <label
            className={cn(
              "flex cursor-pointer gap-3 rounded-xl border-2 p-3 transition-colors",
              consentChecked
                ? "border-[#5E17EB]/30 bg-[#5E17EB]/5"
                : "border-[#262625]/12 bg-white hover:border-[#5E17EB]/20"
            )}
          >
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
              />
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors",
                  consentChecked
                    ? "border-[#5E17EB] bg-[#5E17EB]"
                    : "border-[#262625]/30 bg-white"
                )}
              >
                {consentChecked && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
            <p className="font-body text-xs leading-relaxed text-[#262625]/70">
              {SECOND_CONSENT_TEXT}
            </p>
          </label>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!consentChecked || loading}
            className={cn(
              "flex h-10 w-full items-center justify-center gap-2 rounded-xl font-body text-sm font-bold transition-all",
              consentChecked && !loading
                ? "bg-[#5E17EB] text-white hover:brightness-110"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing photo…
              </>
            ) : (
              "Use this photo"
            )}
          </button>
        </>
      )}

      {error && (
        <div className="rounded-xl border-2 border-red-100 bg-red-50 px-3 py-2 font-body text-xs text-red-600">
          {error}
        </div>
      )}
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
          We&apos;ll use this to personalise every page of the story.
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
            <SecondChildPhotoSection />
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
