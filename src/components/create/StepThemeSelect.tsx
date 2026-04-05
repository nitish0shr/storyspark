"use client";

import { useWizardStore } from "./WizardProvider";
import { themes } from "@/data/themes";
import { cn } from "@/lib/utils";
import {
  Rocket,
  Egg,
  Fish,
  Crown,
  Zap,
  Heart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Rocket,
  Egg,
  Fish,
  Crown,
  Zap,
  Heart,
};

export function StepThemeSelect() {
  const { childName, selectedThemeId, setSelectedTheme, nextStep } =
    useWizardStore();

  const handleSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    // Auto-advance after a brief visual pause
    setTimeout(() => {
      nextStep();
    }, 400);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">
          Choose {childName}&apos;s adventure
        </h2>
        <p className="mt-2 text-gray-500">
          Each theme creates a unique story with custom illustrations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const Icon = iconMap[theme.icon] ?? Rocket;
          const isSelected = selectedThemeId === theme.id;
          const title = theme.titleTemplate.replace("[Child]", childName);

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleSelect(theme.id)}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-all duration-300",
                "hover:shadow-lg hover:-translate-y-0.5",
                isSelected
                  ? "border-violet-600 ring-4 ring-violet-200 shadow-lg shadow-violet-100"
                  : "border-gray-200 bg-white hover:border-violet-300"
              )}
            >
              {/* Gradient header */}
              <div
                className={cn(
                  "flex items-center gap-3 bg-gradient-to-r p-4",
                  theme.colorScheme.gradient
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{theme.name}</h3>
                  <p className="text-xs text-white/80">Ages {theme.ageRange}</p>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4">
                <p className="font-heading text-sm font-semibold text-gray-800 mb-1">
                  {title}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {theme.description}
                </p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
