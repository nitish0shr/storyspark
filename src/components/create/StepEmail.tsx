"use client";

import { useState } from "react";
import { useWizardStore } from "./WizardProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail, Sparkles, Shield } from "lucide-react";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function StepEmail() {
  const { childName, email, setEmail, nextStep, setGenerating } =
    useWizardStore();
  const [touched, setTouched] = useState(false);

  const valid = isValidEmail(email);
  const showError = touched && !valid && email.length > 0;

  const handleGenerate = () => {
    if (!valid) return;
    setGenerating(true, "Preparing your story...");
    nextStep();

    // Simulate generation progress
    const steps = [
      "Analyzing photo...",
      "Writing the story...",
      "Creating illustrations...",
      "Adding finishing touches...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setGenerating(true, steps[i]);
        i++;
      } else {
        clearInterval(interval);
        // Simulate completion after generation
        setTimeout(() => {
          useWizardStore.setState({
            isGenerating: false,
            generationStep: "",
            bookId: "preview-" + Date.now(),
          });
        }, 2000);
      }
    }, 3000);
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
            showError && "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-200"
          )}
        />
        {showError && (
          <p className="text-sm text-red-500">Please enter a valid email address.</p>
        )}
      </div>

      <Button
        onClick={handleGenerate}
        disabled={!valid}
        className={cn(
          "h-14 w-full rounded-xl text-lg font-semibold transition-all",
          valid
            ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:shadow-xl hover:shadow-violet-200 hover:brightness-105"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        )}
      >
        <Sparkles className="mr-2 h-5 w-5" />
        Generate Preview
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <Shield className="h-3.5 w-3.5" />
        <span>We never share your email. Unsubscribe anytime.</span>
      </div>
    </div>
  );
}
