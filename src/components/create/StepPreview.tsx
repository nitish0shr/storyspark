"use client";

import { useWizardStore } from "./WizardProvider";
import { LoadingAnimation } from "@/components/shared/LoadingAnimation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, PartyPopper, ArrowRight } from "lucide-react";
import Link from "next/link";

export function StepPreview() {
  const { childName, isGenerating, generationStep, bookId } = useWizardStore();

  if (isGenerating) {
    return <LoadingAnimation childName={childName} currentStep={generationStep} />;
  }

  return (
    <div className="mx-auto max-w-md space-y-8 text-center py-8">
      {/* Celebration icon */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg shadow-violet-200">
        <PartyPopper className="h-10 w-10 text-white" />
      </div>

      <div>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">
          {childName}&apos;s story is ready!
        </h2>
        <p className="mt-3 text-gray-500 leading-relaxed">
          We&apos;ve created a personalized storybook with custom illustrations
          just for {childName}. Take a look at the preview!
        </p>
      </div>

      {/* Preview card */}
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-pink-50 p-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
          <BookOpen className="h-8 w-8 text-violet-600" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-gray-800">
          Preview Available
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          5 pages of illustrated story with {childName} as the star
        </p>
      </div>

      <Link href={bookId ? `/preview/${bookId}` : "#"}>
        <Button
          className={cn(
            "h-14 w-full rounded-xl text-lg font-semibold transition-all",
            "bg-gradient-to-r from-violet-600 to-pink-500 text-white",
            "hover:shadow-xl hover:shadow-violet-200 hover:brightness-105"
          )}
        >
          View Your Preview
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>

      <p className="text-xs text-gray-400">
        We&apos;ve also sent a link to your email so you can view it anytime.
      </p>
    </div>
  );
}
