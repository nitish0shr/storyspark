"use client";

import { cn } from "@/lib/utils";

interface DedicationPageProps {
  dedication: string;
  themeId?: string;
}

const THEME_ACCENTS: Record<string, { gradient: string; textColor: string; ornamentColor: string }> = {
  "space-adventure": {
    gradient: "from-indigo-900 via-purple-900 to-indigo-800",
    textColor: "text-indigo-100",
    ornamentColor: "text-indigo-300/40",
  },
  "dinosaur-discovery": {
    gradient: "from-emerald-800 via-green-800 to-emerald-900",
    textColor: "text-emerald-100",
    ornamentColor: "text-emerald-300/40",
  },
  "under-the-sea": {
    gradient: "from-cyan-800 via-teal-800 to-cyan-900",
    textColor: "text-cyan-100",
    ornamentColor: "text-cyan-300/40",
  },
  "royal-quest": {
    gradient: "from-amber-700 via-yellow-800 to-amber-800",
    textColor: "text-amber-100",
    ornamentColor: "text-amber-300/40",
  },
  "superhero-origin": {
    gradient: "from-red-800 via-rose-800 to-red-900",
    textColor: "text-red-100",
    ornamentColor: "text-red-300/40",
  },
  "kindness-courage": {
    gradient: "from-pink-800 via-fuchsia-800 to-pink-900",
    textColor: "text-pink-100",
    ornamentColor: "text-pink-300/40",
  },
  "pirate-treasure": {
    gradient: "from-amber-800 via-yellow-800 to-amber-900",
    textColor: "text-amber-100",
    ornamentColor: "text-amber-300/40",
  },
  "fairy-garden": {
    gradient: "from-violet-800 via-fuchsia-800 to-violet-900",
    textColor: "text-violet-100",
    ornamentColor: "text-violet-300/40",
  },
  "safari-adventure": {
    gradient: "from-orange-800 via-amber-800 to-orange-900",
    textColor: "text-orange-100",
    ornamentColor: "text-orange-300/40",
  },
  "time-travel": {
    gradient: "from-teal-800 via-cyan-800 to-teal-900",
    textColor: "text-teal-100",
    ornamentColor: "text-teal-300/40",
  },
  "christmas-magic": {
    gradient: "from-red-800 via-green-800 to-red-900",
    textColor: "text-red-100",
    ornamentColor: "text-red-300/40",
  },
  "halloween-adventure": {
    gradient: "from-orange-800 via-purple-800 to-orange-900",
    textColor: "text-orange-100",
    ornamentColor: "text-orange-300/40",
  },
};

const DEFAULT_ACCENT = {
  gradient: "from-violet-800 via-purple-800 to-violet-900",
  textColor: "text-violet-100",
  ornamentColor: "text-violet-300/40",
};

export default function DedicationPage({ dedication, themeId }: DedicationPageProps) {
  const accent = (themeId && THEME_ACCENTS[themeId]) || DEFAULT_ACCENT;

  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
      <div className={cn("absolute inset-0 bg-gradient-to-br", accent.gradient)} />

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: "24px 24px",
      }} />

      <div className="relative h-full flex flex-col items-center justify-center px-8 sm:px-12">
        <div className={cn("text-4xl sm:text-5xl mb-6 select-none", accent.ornamentColor)}>
          ❦
        </div>

        <p className={cn(
          "text-center text-base sm:text-lg leading-relaxed italic font-serif max-w-[280px] sm:max-w-xs",
          accent.textColor
        )}>
          &ldquo;{dedication}&rdquo;
        </p>

        <div className={cn("text-4xl sm:text-5xl mt-6 select-none rotate-180", accent.ornamentColor)}>
          ❦
        </div>
      </div>
    </div>
  );
}
