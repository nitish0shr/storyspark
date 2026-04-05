"use client";

import { useState } from "react";
import { useWizardStore } from "./WizardProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail, Sparkles, Shield, AlertCircle } from "lucide-react";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function StepEmail() {
  const {
    childName,
    childAge,
    childGender,
    photoUrl,
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
  const showError = touched && !valid && email.length > 0;

  const handleGenerate = async () => {
    if (!valid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Create book record via API
      const createRes = await fetch("/api/create-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName,
          childAge,
          childGender,
          photoUrl: photoUrl || undefined,
          themeId: selectedThemeId,
          contextualAnswers,
          email,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create book. Please try again.");
      }

      const { childProfileId, bookId } = await createRes.json();
      setChildProfileId(childProfileId);
      setBookId(bookId);

      // Step 2: Trigger preview generation
      const genRes = await fetch("/api/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      if (!genRes.ok) {
        const data = await genRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start generation. Please try again.");
      }

      // Step 3: Move to preview step with real generation in progress
      setGenerating(true, "Preparing your story...");
      nextStep();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
          <Mail className="h-6 w-6 text-violet-600" />
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">
          Almost there!
        </h2>
        <p className="mt-2 text-gray-500">
          Enter your email to see {childName}&apos;s preview. We&apos;ll also
          save it to your account.
        </p>
      </div>

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
            showError &&
              "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-200"
          )}
        />
        {showError && (
          <p className="text-sm text-red-500">
            Please enter a valid email address.
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
            Generate Preview
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
