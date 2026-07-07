"use client";

import { useWizardStore } from "./WizardProvider";
import { getQuestionsForTheme } from "@/data/questions";
import { getThemeById } from "@/data/themes";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowRight, Star } from "lucide-react";
import { usePostHog } from "posthog-js/react";

export function StepQuestions() {
  const {
    childName, selectedThemeId, contextualAnswers,
    setContextualAnswer, nextStep,
  } = useWizardStore();

  const posthog = usePostHog();

  const questions = selectedThemeId ? getQuestionsForTheme(selectedThemeId) : [];
  const theme = selectedThemeId ? getThemeById(selectedThemeId) : null;
  const allAnswered = questions.every((q) => contextualAnswers[q.id]?.trim().length > 0);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFDE59] border-2 border-[#262625] shadow-[2px_2px_0px_#262625]">
          <Star className="h-6 w-6 text-[#262625] fill-[#262625]" />
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#262625]">
          Make it personal!
        </h2>
        <p className="mt-2 font-body text-[#262625]/60">
          These details make {childName}&apos;s story extra special.
        </p>
        {theme && (
          <p className="mt-1 font-body text-xs text-[#5E17EB] font-bold">
            Personalising: {childName}&apos;s {theme.name} ✦
          </p>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((question) => {
          const questionText = question.question.replace("{name}", childName);
          const currentValue = contextualAnswers[question.id] ?? "";

          return (
            <div key={question.id} className="space-y-3">
              <label className="block font-body text-sm font-bold text-[#262625]">
                {questionText}
              </label>

              {question.type === "select" && question.options ? (
                <div className="flex flex-wrap gap-2">
                  {question.options.map((option) => {
                    const isSelected = currentValue === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setContextualAnswer(question.id, option)}
                        className={cn(
                          "rounded-full border-2 px-4 py-2 font-body text-sm font-bold transition-all duration-200",
                          isSelected
                            ? "border-[#262625] bg-[#FFDE59] text-[#262625] shadow-[2px_2px_0px_#262625]"
                            : "border-[#262625]/20 bg-white text-[#262625]/60 hover:border-[#CB6CE6] hover:text-[#5E17EB]"
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Input
                  type="text"
                  placeholder="Type your answer — we'll put this in your story!"
                  maxLength={30}
                  value={currentValue}
                  onChange={(e) => setContextualAnswer(question.id, e.target.value)}
                  className="h-12 rounded-xl border-2 border-[#262625]/20 bg-white px-4 font-body text-base focus-visible:border-[#5E17EB] focus-visible:ring-[#CB6CE6]/20"
                />
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => {
          posthog.capture("wizard_step_completed", { step: "questions", theme_id: selectedThemeId });
          nextStep();
        }}
        disabled={!allAnswered}
        className={cn(
          "btn-chunky h-12 w-full flex items-center justify-center gap-2 font-heading font-bold text-base transition-all",
          allAnswered
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
