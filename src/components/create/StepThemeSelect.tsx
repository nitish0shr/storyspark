"use client";

import { useState } from "react";
import { useWizardStore } from "./WizardProvider";
import { themes } from "@/data/themes";
import { isThemeAvailable, ThemeCategory } from "@/types/theme";
import { cn } from "@/lib/utils";
import {
  Rocket,
  Egg,
  Fish,
  Crown,
  Zap,
  Heart,
  Star,
  Compass,
  Flower2,
  Binoculars,
  Clock,
  Snowflake,
  Moon,
  Sparkles,
  Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePostHog } from "posthog-js/react";

const iconMap: Record<string, LucideIcon> = {
  Rocket,
  Egg,
  Fish,
  Crown,
  Zap,
  Heart,
  Compass,
  Flower2,
  Binoculars,
  Clock,
  Snowflake,
  Moon,
};

const categoryLabels: { key: "all" | ThemeCategory; label: string }[] = [
  { key: "all", label: "All Themes" },
  { key: "adventure", label: "Adventure" },
  { key: "fantasy", label: "Fantasy" },
  { key: "heartfelt", label: "Heartfelt" },
  { key: "seasonal", label: "Seasonal" },
];

function isAgeInRange(age: number, ageRange: string): boolean {
  const match = ageRange.match(/(\d+)-(\d+)/);
  if (!match) return false;
  const [, min, max] = match;
  return age >= Number(min) && age <= Number(max);
}

export function StepThemeSelect() {
  const { childName, childAge, selectedThemeId, setSelectedTheme, nextStep } =
    useWizardStore();
  const [activeCategory, setActiveCategory] = useState<"all" | ThemeCategory>("all");

  const posthog = usePostHog();

  const handleSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    posthog.capture("wizard_step_completed", { step: "theme_select", theme_id: themeId });
    setTimeout(() => {
      nextStep();
    }, 400);
  };

  const availableSeasonalCount = themes.filter(
    (t) => t.category === "seasonal" && isThemeAvailable(t)
  ).length;

  const filteredThemes = themes.filter((theme) => {
    if (theme.seasonal && !isThemeAvailable(theme)) return false;
    if (activeCategory === "all") return true;
    return theme.category === activeCategory;
  });

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

      <div className="flex flex-wrap justify-center gap-2">
        {categoryLabels.map(({ key, label }) => {
          if (key === "seasonal" && availableSeasonalCount === 0) return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveCategory(key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                activeCategory === key
                  ? "bg-violet-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {label}
              {key === "seasonal" && availableSeasonalCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-amber-900">
                  {availableSeasonalCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredThemes.map((theme) => {
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

              <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                {theme.subscriberOnly && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-100 to-pink-100 px-2.5 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200/50">
                    <Crown className="h-2.5 w-2.5 text-violet-500" />
                    Subscribers Only
                  </span>
                )}
                {theme.badge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200/50">
                    <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                    {theme.badge}
                  </span>
                )}
                {theme.id === "kindness-courage" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                    Most Popular
                  </span>
                )}
                {childAge >= 0 && isAgeInRange(childAge, theme.ageRange) && (
                  <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                    Great for {childAge}-year-olds!
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4 pt-2">
                <p className="font-heading text-sm font-semibold text-gray-800 mb-1">
                  {title}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {theme.description}
                </p>
              </div>

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
