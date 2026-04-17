"use client";

import { useState } from "react";
import { useWizardStore } from "./WizardProvider";
import { getThemeById } from "@/data/themes";
import { getQuestionsForTheme } from "@/data/questions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Shield,
  AlertCircle,
  User,
  Palette,
  Camera,
  MessageCircle,
} from "lucide-react";

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
    childName,
    childAge,
    childGender,
    photoPreviewUrl,
    selectedThemeId,
    contextualAnswers,
    email,
    setEmail,
    setChildProfileId,
    setBookId,
    setGenerating,
    nextStep,
  } = useWizardStore();

  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidEmail(email);
  const showEmailError = touched && !valid && email.length > 0;

  const theme = selectedThemeId ? getThemeById(selectedThemeId) : null;
  const questions = selectedThemeId
    ? getQuestionsForTheme(selectedThemeId)
    : [];

  const ageLabel =
    childAge === -1 ? "Not yet born" : `${childAge} year${childAge !== 1 ? "s" : ""} old`;

  const handleGenerate = async () => {
    if (!valid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const createRes = await fetch("/api/create-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName,
          childAge,
          childGender,
          photoUrl: useWizardStore.getState().photoUrl || undefined,
          themeId: selectedThemeId,
          contextualAnswers,
          email,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(
          data.error || "Failed to create book. Please try again."
        );
      }

      const { childProfileId, bookId } = await createRes.json();
      setChildProfileId(childProfileId);
      setBookId(bookId);

      const genRes = await fetch("/api/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      if (!genRes.ok) {
        const data = await genRes.json().catch(() => ({}));
        throw new Error(
          data.error || "Failed to start generation. Please try again."
        );
      }

      setGenerating(true, "Preparing your story...");
      nextStep();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">
          Review &amp; Create
        </h2>
        <p className="mt-2 text-gray-500">
          Everything look right? Let&apos;s make {childName}&apos;s story!
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100">
        {/* Child info */}
        <div className="flex items-center gap-4 p-4">
          {photoPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreviewUrl}
              alt={childName}
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100">
              <User className="h-6 w-6 text-violet-500" />
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{childName}</p>
            <p className="text-sm text-gray-500">
              {ageLabel} · {genderLabel[childGender] || childGender}
            </p>
          </div>
        </div>

        {/* Theme */}
        {theme && (
          <div className="flex items-center gap-3 p-4">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                theme.colorScheme.bg
              )}
            >
              <Palette className={cn("h-5 w-5", theme.colorScheme.accent)} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{theme.name}</p>
              <p className="text-xs text-gray-400">Story theme</p>
            </div>
          </div>
        )}

        {/* Contextual answers */}
        {questions.length > 0 && (
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MessageCircle className="h-4 w-4 text-pink-500" />
              Personalization
            </div>
            {questions.map((q) => {
              const answer = contextualAnswers[q.id];
              if (!answer) return null;
              const label = q.question.replace("{name}", childName);
              return (
                <div key={q.id} className="text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="ml-1 font-medium text-gray-700">
                    {answer}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Photo indicator */}
        {photoPreviewUrl && (
          <div className="flex items-center gap-2 p-4 text-sm text-gray-500">
            <Camera className="h-4 w-4 text-violet-500" />
            Photo uploaded
          </div>
        )}
      </div>

      {/* Value prop */}
      <p className="text-center text-sm text-gray-500">
        You&apos;ll get a 5-page illustrated preview — free, no credit card needed.
      </p>

      {/* Email input */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
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
            "h-12 rounded-xl bg-white px-4 text-base focus-visible:border-violet-400 focus-visible:ring-violet-200",
            showEmailError &&
              "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-200"
          )}
        />
        {showEmailError && (
          <p className="text-sm text-red-500">
            Please enter a valid email address.
          </p>
        )}
        <p className="text-xs text-gray-400">
          We&apos;ll save your preview to this email.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CTA */}
      <Button
        onClick={handleGenerate}
        disabled={!valid || submitting}
        className={cn(
          "h-14 w-full rounded-xl text-lg font-semibold transition-all",
          valid && !submitting
            ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:shadow-xl hover:shadow-violet-200 hover:brightness-105"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        )}
      >
        {submitting ? (
          <>
            <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Creating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate My Free 5-Page Preview
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <Shield className="h-3.5 w-3.5" />
        <span>We never share your email. Unsubscribe anytime.</span>
      </div>
    </div>
  );
}
