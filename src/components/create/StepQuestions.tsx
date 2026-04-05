"use client";

import { useWizardStore } from "./WizardProvider";
import { getQuestionsForTheme } from "@/data/questions";
import { getThemeById } from "@/data/themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";
import { usePostHog } from "posthog-js/react";

export function StepQuestions() {
  const {
    childName,
    selectedThemeId,
    contextualAnswers,
    setContextualAnswer,
    nextStep,
  } = useWizardStore();

  const posthog = usePostHog();

  const questions = selectedThemeId
    ? getQuestionsForTheme(selectedThemeId)
    : [];
  const theme = selectedThemeId ? getThemeById(selectedThemeId) : null;

  const allAnswered = questions.every(
    (q) => contextualAnswers[q.id]?.trim().length > 0
  );

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
          <Sparkles className="h-6 w-6 text-pink-500" />
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">
          Make it personal!
        </h2>
        <p className="mt-2 text-gray-500">
          These details make {childName}&apos;s story extra special.
        </p>
        {theme && (
          <p className="mt-1 text-xs text-violet-500 font-medium">
            Personalizing: {childName}&apos;s {theme.name} ✦
          </p>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((question) => {
          const questionText = question.question.replace(
            "{name}",
            childName
          );
          const currentValue = contextualAnswers[question.id] ?? "";

          return (
            <div key={question.id} className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
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
                        onClick={() =>
                          setContextualAnswer(question.id, option)
                        }
                        className={cn(
                          "rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200",
                          "hover:border-violet-300 hover:bg-violet-50/50",
                          isSelected
                            ? "border-violet-600 bg-violet-50 text-violet-700 shadow-sm"
                            : "border-gray-200 bg-white text-gray-600"
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
                  onChange={(e) =>
                    setContextualAnswer(question.id, e.target.value)
                  }
                  className="h-12 rounded-xl border-gray-200 bg-white px-4 text-base focus-visible:border-violet-400 focus-visible:ring-violet-200"
                />
              )}
            </div>
          );
        })}
      </div>

      <Button
        onClick={() => {
          posthog.capture("wizard_step_completed", { step: "questions", theme_id: selectedThemeId });
          nextStep();
        }}
        disabled={!allAnswered}
        className={cn(
          "h-12 w-full rounded-xl text-base font-semibold transition-all",
          allAnswered
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
