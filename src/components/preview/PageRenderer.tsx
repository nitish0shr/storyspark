"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { BookOpen } from "lucide-react";

interface PageRendererProps {
  pageNumber: number;
  text: string;
  illustrationUrl?: string;
  isBlurred?: boolean;
  isCover?: boolean;
  childName?: string;
  themeTitle?: string;
}

export default function PageRenderer({
  pageNumber,
  text,
  illustrationUrl,
  isBlurred = false,
  isCover = false,
  childName,
  themeTitle,
}: PageRendererProps) {
  if (isCover) {
    return (
      <div
        className={cn(
          "relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl",
          "animate-in fade-in slide-in-from-bottom-4 duration-700"
        )}
      >
        {/* Cover background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#EC4899]" />

        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)",
              backgroundSize: "60px 60px, 80px 80px, 40px 40px",
            }}
          />
        </div>

        {/* Cover illustration */}
        {illustrationUrl && (
          <div className="absolute inset-x-8 top-8 bottom-[45%] rounded-xl overflow-hidden ring-4 ring-white/20 shadow-xl">
            <Image
              src={illustrationUrl}
              alt={`Cover illustration for ${childName}'s story`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
              priority
            />
          </div>
        )}

        {/* Cover text */}
        <div className="absolute bottom-0 inset-x-0 h-[42%] flex flex-col items-center justify-center px-8 text-center">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-white/70" />
            <span className="text-white/70 text-sm font-medium tracking-widest uppercase">
              A StorySpark Book
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-3 drop-shadow-lg">
            {childName}&apos;s
          </h1>
          {themeTitle && (
            <p className="text-lg sm:text-xl text-white/90 font-medium leading-snug max-w-xs">
              {themeTitle}
            </p>
          )}
          <div className="mt-6 h-px w-16 bg-white/30 rounded-full" />
        </div>

        {/* Blur overlay for locked covers */}
        {isBlurred && (
          <div className="absolute inset-0 backdrop-blur-md bg-black/20" />
        )}
      </div>
    );
  }

  // Interior page
  return (
    <div
      className={cn(
        "relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#FFFBF5] shadow-2xl",
        "animate-in fade-in slide-in-from-right-4 duration-500",
        isBlurred && "select-none"
      )}
    >
      {/* Illustration area (top 60%) */}
      <div className="relative h-[60%] w-full bg-violet-50/50">
        {illustrationUrl ? (
          <div className="relative h-full w-full p-4 pb-0">
            <div className="relative h-full w-full rounded-xl overflow-hidden ring-1 ring-violet-100/50 shadow-inner">
              <Image
                src={illustrationUrl}
                alt={`Illustration for page ${pageNumber}`}
                fill
                className={cn(
                  "object-cover transition-all duration-500",
                  isBlurred && "blur-lg grayscale"
                )}
                sizes="(max-width: 768px) 100vw, 500px"
              />
            </div>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center text-violet-300">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Illustration loading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Text area (bottom 40%) */}
      <div className="h-[40%] w-full px-6 py-4 sm:px-8 sm:py-5 flex flex-col justify-center">
        <p
          className={cn(
            "font-serif text-base sm:text-lg leading-relaxed text-gray-800 text-center",
            isBlurred && "blur-md select-none"
          )}
        >
          {text}
        </p>
        <div className="mt-auto pt-3 flex items-center justify-center">
          <span className="text-xs text-gray-400 font-medium">{pageNumber}</span>
        </div>
      </div>

      {/* Subtle page edge effect */}
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-violet-200/30 via-violet-100/20 to-violet-200/30" />

      {/* Blur overlay for locked pages */}
      {isBlurred && (
        <div className="absolute inset-0 backdrop-blur-sm bg-white/10 pointer-events-none" />
      )}
    </div>
  );
}
