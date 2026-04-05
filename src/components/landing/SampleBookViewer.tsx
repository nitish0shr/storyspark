"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

const samplePages = [
  {
    gradient: "from-violet-400 via-purple-400 to-indigo-500",
    text: "Once upon a time, in a cozy little house on Maple Street, lived a child with the biggest imagination in the whole wide world.",
    label: "Page 1",
  },
  {
    gradient: "from-emerald-400 via-teal-400 to-cyan-500",
    text: "One sunny morning, something magical happened. A tiny, glowing star landed right on their windowsill and whispered, \"Come on an adventure!\"",
    label: "Page 2",
  },
  {
    gradient: "from-amber-400 via-orange-400 to-rose-500",
    text: "Together they flew over rainbow mountains and through clouds made of cotton candy, meeting friendly creatures along the way.",
    label: "Page 3",
  },
  {
    gradient: "from-pink-400 via-rose-400 to-fuchsia-500",
    text: "\"You are braver than you know,\" said the star. And with a big smile, they knew that was the truest thing anyone had ever said.",
    label: "Page 4",
  },
  {
    gradient: "from-violet-500 via-purple-500 to-pink-500",
    text: "And from that day on, every time they looked up at the night sky, they knew the stars were twinkling just for them. The End.",
    label: "Page 5",
  },
];

export default function SampleBookViewer() {
  const [currentPage, setCurrentPage] = useState(0);

  const goTo = (page: number) => {
    if (page >= 0 && page < samplePages.length) {
      setCurrentPage(page);
    }
  };

  const page = samplePages[currentPage];

  return (
    <section id="sample-book" className="py-20 sm:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-50/30 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-600 mb-3">
            Sneak Peek
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Peek Inside a Storybook
          </h2>
          <p className="text-lg text-gray-500">
            This could be <span className="font-semibold text-violet-600">YOUR</span>{" "}
            child&apos;s story
          </p>
        </div>

        {/* Book viewer */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {/* Book frame */}
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-violet-200/40 border border-violet-100/60 overflow-hidden">
              {/* Page illustration area */}
              <div
                className={`relative h-56 sm:h-72 bg-gradient-to-br ${page.gradient} transition-all duration-500 ease-in-out flex items-center justify-center overflow-hidden`}
              >
                {/* Decorative circles */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-6 left-8 w-16 h-16 rounded-full bg-white/10" />
                  <div className="absolute bottom-8 right-12 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute top-12 right-1/4 w-8 h-8 rounded-full bg-white/15" />
                  <div className="absolute bottom-4 left-1/3 w-6 h-6 rounded-full bg-white/10" />
                </div>

                <BookOpen className="h-20 w-20 text-white/30" />

                {/* Page indicator */}
                <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-white/80">
                  {page.label}
                </div>
              </div>

              {/* Text area */}
              <div className="p-6 sm:p-8">
                <p className="font-heading text-base sm:text-lg text-gray-800 leading-relaxed text-center italic">
                  &ldquo;{page.text}&rdquo;
                </p>
              </div>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 0}
              className="absolute left-0 sm:-left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-violet-200 shadow-md flex items-center justify-center text-violet-600 hover:bg-violet-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === samplePages.length - 1}
              className="absolute right-0 sm:-right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-violet-200 shadow-md flex items-center justify-center text-violet-600 hover:bg-violet-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Page dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {samplePages.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === currentPage
                    ? "w-8 h-2.5 bg-gradient-to-r from-violet-500 to-pink-500"
                    : "w-2.5 h-2.5 bg-violet-200 hover:bg-violet-300"
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
