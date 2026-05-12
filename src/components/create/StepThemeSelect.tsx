"use client";

import { useState } from "react";
import { useWizardStore } from "./WizardProvider";
import { themes } from "@/data/themes";
import { isThemeAvailable, ThemeCategory } from "@/types/theme";
import { cn } from "@/lib/utils";
import {
  Rocket, Egg, Fish, Crown, Zap, Heart, Star, Compass, Flower2,
  Binoculars, Clock, Snowflake, Moon, Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePostHog } from "posthog-js/react";

const iconMap: Record<string, LucideIcon> = {
  Rocket, Egg, Fish, Crown, Zap, Heart, Compass, Flower2,
  Binoculars, Clock, Snowflake, Moon,
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
  const { childName, childAge, selectedThemeId, setSelectedTheme, nextStep } = useWizardStore();
  const [activeCategory, setActiveCategory] = useState<"all" | ThemeCategory>("all");
  const posthog = usePostHog();

  const handleSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    posthog.capture("wizard_step_completed", { step: "theme_select", theme_id: themeId });
    setTimeout(() => nextStep(), 400);
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
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#262625]">
          Choose {childName}&apos;s adventure
        </h2>
        <p className="mt-2 font-body text-[#262625]/60">
          Each theme creates a unique story with custom illustrations.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap justify-center gap-2">
        {categoryLabels.map(({ key, label }) => {
          if (key === "seasonal" && availableSeasonalCount === 0) return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveCategory(key)}
              className={cn(
                "rounded-full border-2 px-4 py-1.5 font-body text-sm font-bold transition-all",
                activeCategory === key
                  ? "border-[#262625] bg-[#5E17EB] text-white shadow-[2px_2px_0px_#262625]"
                  : "border-[#262625]/20 bg-white text-[#262625]/60 hover:border-[#CB6CE6] hover:text-[#5E17EB]"
              )}
            >
              {label}
              {key === "seasonal" && availableSeasonalCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#FFDE59] text-[10px] font-bold text-[#262625]">
                  {availableSeasonalCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Theme grid */}
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
                "group relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-all duration-200",
                isSelected
                  ? "border-[#262625] shadow-[4px_4px_0px_#262625] -translate-y-0.5"
                  : "border-[#262625]/15 bg-white hover:border-[#CB6CE6] hover:shadow-[3px_3px_0px_#CB6CE6] hover:-translate-y-0.5"
              )}
            >
              {/* Header band */}
              <div className={cn("flex items-center gap-3 bg-gradient-to-r p-4", theme.colorScheme.gradient)}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-white">{theme.name}</h3>
                  <p className="font-body text-xs text-white/80">Ages {theme.ageRange}</p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                {theme.subscriberOnly && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#CB6CE6]/40 bg-[#CB6CE6]/10 px-2.5 py-0.5 font-body text-[10px] font-bold text-[#5E17EB]">
                    <Crown className="h-2.5 w-2.5" />
                    Subscribers Only
                  </span>
                )}
                {theme.badge && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#FFDE59] bg-[#FFDE59]/30 px-2.5 py-0.5 font-body text-[10px] font-bold text-[#262625]">
                    <Sparkles className="h-2.5 w-2.5" />
                    {theme.badge}
                  </span>
                )}
                {theme.id === "kindness-courage" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#FFDE59] bg-[#FFDE59]/40 px-2 py-0.5 font-body text-[10px] font-bold text-[#262625]">
                    <Star className="h-2.5 w-2.5 fill-[#262625]" />
                    Most Popular
                  </span>
                )}
                {childAge >= 0 && isAgeInRange(childAge, theme.ageRange) && (
                  <span className="inline-flex items-center rounded-full border border-[#5E17EB]/20 bg-[#5E17EB]/10 px-2 py-0.5 font-body text-[10px] font-bold text-[#5E17EB]">
                    Great for {childAge}-year-olds!
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4 pt-2">
                <p className="font-heading text-sm font-bold text-[#262625] mb-1">{title}</p>
                <p className="font-body text-xs text-[#262625]/50 leading-relaxed">{theme.description}</p>
              </div>

              {isSelected && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFDE59] border-2 border-[#262625] shadow-[1px_1px_0px_#262625]">
                  <svg className="h-3.5 w-3.5 text-[#262625]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
