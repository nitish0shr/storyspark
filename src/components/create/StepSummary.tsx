"use client";

import { useState } from "react";
import { useWizardStore } from "./WizardProvider";
import { getThemeById } from "@/data/themes";
import { getQuestionsForTheme } from "@/data/questions";
import { supportedLanguages } from "@/data/languages";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Sparkles, Shield, AlertCircle, User, Palette, Camera, MessageCircle, Heart, Globe,
} from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { PRIVACY_NOTICE, MARKETING_CONSENT_LABEL, ADULT_CONFIRMATION_LABEL } from "@/lib/consent";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const genderLabel: Record<string, string> = {
  boy: "Boy",
  girl: "Girl",
  neutral: "Non-binary",
};

export function StepSummary() {
  const {
    childName, childAge, childGender, photoPreviewUrl,
    hasSecondChild, secondChildName, secondChildAge, secondChildGender, secondChildPhotoPreviewUrl,
    selectedThemeId, contextualAnswers,
    dedication, setDedication,
    language, setLanguage,
    email, setEmail,
    setChildProfileId, setSecondChildProfileId, setBookId, setGenerating, nextStep,
  } = useWizardStore();

  const posthog = usePostHog();
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);

  const valid = isValidEmail(email);
  const showEmailError = touched && !valid && email.length > 0;

  const theme = selectedThemeId ? getThemeById(selectedThemeId) : null;
  const questions = selectedThemeId ? getQuestionsForTheme(selectedThemeId) : [];
  const ageLabel = childAge === -1 ? "Not yet born" : `${childAge} year${childAge !== 1 ? "s" : ""} old`;

  const handleGenerate = async () => {
    if (!valid || !adultConfirmed || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const createRes = await fetch("/api/create-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName, childAge, childGender,
          photoUrl: useWizardStore.getState().photoUrl || undefined,
          appearanceDescription: useWizardStore.getState().appearanceDescription || undefined,
          appearanceProfile: useWizardStore.getState().appearanceProfile || undefined,
          themeId: selectedThemeId, contextualAnswers,
          dedication: dedication.trim() || undefined,
          language, email,
          marketingConsent,
          adultConfirmed,
          ...(hasSecondChild ? {
            secondChildName, secondChildAge, secondChildGender,
            secondChildPhotoUrl: useWizardStore.getState().secondChildPhotoUrl || undefined,
            secondAppearanceDescription: useWizardStore.getState().secondAppearanceDescription || undefined,
            secondAppearanceProfile: useWizardStore.getState().secondAppearanceProfile || undefined,
          } : {}),
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create book. Please try again.");
      }

      const resData = await createRes.json();
      setChildProfileId(resData.childProfileId);
      if (resData.secondChildProfileId) setSecondChildProfileId(resData.secondChildProfileId);
      setBookId(resData.bookId);
      const bookId = resData.bookId;

      const genRes = await fetch("/api/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      if (!genRes.ok) {
        const data = await genRes.json().catch(() => ({}));
        // A book id saved in this browser can point at a book that no longer
        // exists - it may have been removed since. Clearing the stale ids means
        // the next attempt starts clean, instead of trapping the visitor on a
        // dead end they have no way to escape.
        if (genRes.status === 404) {
          setBookId(null);
          setChildProfileId(null);
          setSecondChildProfileId(null);
          throw new Error(
            "That saved draft is no longer available. Tap the button once more and we will start a fresh one.",
          );
        }
        throw new Error(data.error || "Failed to start generation. Please try again.");
      }

      posthog.capture("book_preview_requested", { theme_id: selectedThemeId, book_id: bookId });
      setGenerating(true, "Preparing your story...");
      nextStep();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#262625]">
          Review &amp; Create
        </h2>
        <p className="mt-2 font-body text-[#262625]/60">
          Everything look right? Let&apos;s make {childName}&apos;s story!
        </p>
      </div>

      {/* Summary card */}
      <div className="card-chunky divide-y divide-[#262625]/10 bg-white">
        {/* Child info */}
        <div className="flex items-center gap-4 p-4">
          {photoPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreviewUrl} alt={childName} className="h-14 w-14 rounded-xl border-2 border-[#262625]/10 object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#CB6CE6]/20 border-2 border-[#CB6CE6]/30">
              <User className="h-6 w-6 text-[#5E17EB]" />
            </div>
          )}
          <div>
            <p className="font-heading font-bold text-[#262625]">{childName}</p>
            <p className="font-body text-sm text-[#262625]/50">
              {ageLabel} · {genderLabel[childGender] || childGender}
            </p>
          </div>
        </div>

        {/* Theme */}
        {theme && (
          <div className="flex items-center gap-3 p-4">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", theme.colorScheme.bg)}>
              <Palette className={cn("h-5 w-5", theme.colorScheme.accent)} />
            </div>
            <div>
              <p className="font-body text-sm font-bold text-[#262625]">{theme.name}</p>
              <p className="font-body text-xs text-[#262625]/40">Story theme</p>
            </div>
          </div>
        )}

        {/* Contextual answers */}
        {questions.length > 0 && (
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 font-body text-sm font-bold text-[#262625]">
              <MessageCircle className="h-4 w-4 text-[#CB6CE6]" />
              Personalisation
            </div>
            {questions.map((q) => {
              const answer = contextualAnswers[q.id];
              if (!answer) return null;
              const label = q.question.replace("{name}", childName);
              return (
                <div key={q.id} className="font-body text-sm">
                  <span className="text-[#262625]/40">{label}</span>
                  <span className="ml-1 font-bold text-[#262625]">{answer}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Second child */}
        {hasSecondChild && secondChildName && (
          <div className="flex items-center gap-4 p-4">
            {secondChildPhotoPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={secondChildPhotoPreviewUrl} alt={secondChildName} className="h-14 w-14 rounded-xl border-2 border-[#262625]/10 object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFDE59]/30 border-2 border-[#FFDE59]/50">
                <User className="h-6 w-6 text-[#262625]" />
              </div>
            )}
            <div>
              <p className="font-heading font-bold text-[#262625]">{secondChildName}</p>
              <p className="font-body text-sm text-[#262625]/50">
                {secondChildAge === -1 ? "Not yet born" : `${secondChildAge} year${secondChildAge !== 1 ? "s" : ""} old`} · {genderLabel[secondChildGender] || secondChildGender} · Co-hero
              </p>
            </div>
          </div>
        )}

        {/* Photo indicator */}
        {photoPreviewUrl && (
          <div className="flex items-center gap-2 p-4 font-body text-sm text-[#262625]/50">
            <Camera className="h-4 w-4 text-[#5E17EB]" />
            Photo{hasSecondChild ? "s" : ""} uploaded
          </div>
        )}
      </div>

      {/* Dedication */}
      <div className="card-chunky bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-[#CB6CE6]" />
          <Label htmlFor="dedication" className="font-body text-sm font-bold text-[#262625]">
            Add a dedication{" "}
            <span className="font-normal text-[#262625]/40">(optional)</span>
          </Label>
        </div>
        <textarea
          id="dedication"
          placeholder={`e.g. "To ${childName}, with all my love — Grandma"`}
          value={dedication}
          onChange={(e) => setDedication(e.target.value)}
          maxLength={300}
          rows={2}
          className="w-full rounded-xl border-2 border-[#262625]/15 bg-[#FDF5E7] px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#CB6CE6]/30 focus:border-[#5E17EB] resize-none"
        />
        <p className="font-body text-xs text-[#262625]/40">
          This will appear as a special page right after the cover.
        </p>
      </div>

      {/* Language selector */}
      <div className="card-chunky bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[#5E17EB]" />
          <Label htmlFor="language" className="font-body text-sm font-bold text-[#262625]">
            Story language
          </Label>
        </div>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full rounded-xl border-2 border-[#262625]/15 bg-[#FDF5E7] px-4 py-3 font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#CB6CE6]/30 focus:border-[#5E17EB] appearance-none cursor-pointer"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name} ({lang.nativeName})
            </option>
          ))}
        </select>
        {language !== "en" && (
          <p className="font-body text-xs text-[#5E17EB] font-bold">
            The story text will be written in {supportedLanguages.find((l) => l.code === language)?.name}. UI stays in English.
          </p>
        )}
      </div>

      <p className="text-center font-body text-sm text-[#262625]/60">
        You&apos;ll see a free sample illustration of your child as the hero — no credit card needed.
      </p>

      {/* Email input */}
      <div className="space-y-2">
        <Label htmlFor="email" className="font-body text-sm font-bold text-[#262625]">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onBlur={() => setTouched(true)}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(
            "h-12 rounded-xl border-2 border-[#262625]/15 bg-white px-4 font-body text-base focus-visible:border-[#5E17EB] focus-visible:ring-[#CB6CE6]/20",
            showEmailError && "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100"
          )}
        />
        {showEmailError && (
          <p className="font-body text-sm text-red-500">Please enter a valid email address.</p>
        )}
        <p className="font-body text-xs text-[#262625]/40">We&apos;ll save your preview to this email.</p>
      </div>

      {/* Privacy notice + consent */}

      <div className="starmee-consent mt-4 space-y-3 rounded-xl bg-[#FFF7E6] p-4">

        <p className="font-body text-xs text-[#262625]/70">

          {PRIVACY_NOTICE.replace(" Please see our Privacy Policy for more information.", " ")}

          See our{" "}

          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">

            Privacy Policy

          </a>{" "}

          for more information.

        </p>

        <label className="flex items-start gap-3 font-body text-sm text-[#262625]">

          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0"

            checked={adultConfirmed}

            onChange={(e) => setAdultConfirmed(e.target.checked)} />

          <span>{ADULT_CONFIRMATION_LABEL}</span>

        </label>

        <label className="flex items-start gap-3 font-body text-sm text-[#262625]">

          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0"

            checked={marketingConsent}

            onChange={(e) => setMarketingConsent(e.target.checked)} />

          <span>{MARKETING_CONSENT_LABEL}</span>

        </label>

      </div>

      
      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border-2 border-red-100 px-4 py-3 font-body text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleGenerate}
        disabled={!valid || !adultConfirmed || submitting}
        className={cn(
          "btn-chunky h-14 w-full flex items-center justify-center gap-2 font-heading font-bold text-lg transition-all",
          valid && !submitting
            ? "bg-[#FFDE59] text-[#262625] cursor-pointer"
            : "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300 shadow-none"
        )}
      >
        {submitting ? (
          <>
            <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-[#262625] border-t-transparent" />
            Creating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            See My Free Sample
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 font-body text-xs text-[#262625]/40">
        <Shield className="h-3.5 w-3.5" />
        <span>We never share your email. Unsubscribe anytime.</span>
      </div>
    </div>
  );
}
