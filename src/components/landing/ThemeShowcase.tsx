"use client";

import { useRef } from "react";
import Link from "next/link";
import { Theme } from "@/types/theme";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  Egg,
  Fish,
  Crown,
  Zap,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Rocket,
  Egg,
  Fish,
  Crown,
  Zap,
  Heart,
};

interface ThemeShowcaseProps {
  themes: Theme[];
}

function ThemeCard({ theme }: { theme: Theme }) {
  const Icon = iconMap[theme.icon] ?? Sparkles;

  return (
    <div className="min-w-[280px] sm:min-w-[300px] snap-center flex-shrink-0">
      <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-violet-100/40 transition-all duration-300 h-full">
        {/* Gradient header */}
        <div
          className={`relative h-32 bg-gradient-to-br ${theme.colorScheme.gradient} flex items-center justify-center overflow-hidden`}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-4 w-12 h-12 rounded-full bg-white/20 blur-sm" />
            <div className="absolute bottom-3 right-5 w-8 h-8 rounded-full bg-white/15 blur-sm" />
          </div>
          <Icon className="h-14 w-14 text-white/80 group-hover:scale-110 transition-transform duration-300" />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading text-lg font-bold text-gray-900">
              {theme.name}
            </h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${theme.colorScheme.bg} ${theme.colorScheme.accent}`}
            >
              Ages {theme.ageRange}
            </span>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
            {theme.description}
          </p>

          <Link href={`/create?theme=${theme.id}`}>
            <Button
              variant="outline"
              className={`w-full rounded-xl ${theme.colorScheme.border} hover:${theme.colorScheme.bg} font-medium text-sm transition-colors`}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Create This Book
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ThemeShowcase({ themes }: ThemeShowcaseProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section id="themes" className="py-20 sm:py-28 relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/30 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600 mb-3">
            6 Magical Worlds
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choose Their Adventure
          </h2>
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            Every theme is a unique story waiting for your child to be the hero.
          </p>
        </div>

        {/* Scroll controls */}
        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 border border-violet-200 shadow-md items-center justify-center text-violet-600 hover:bg-violet-50 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 border border-violet-200 shadow-md items-center justify-center text-violet-600 hover:bg-violet-50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Scrollable container */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {themes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
