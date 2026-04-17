"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const DEMO_CHILD = "Emma";

const demoPages = [
  {
    pageNumber: 0,
    isCover: true,
    text: `${DEMO_CHILD} Explores the Galaxy`,
    gradient: "from-indigo-900 via-purple-900 to-blue-950",
  },
  {
    pageNumber: 1,
    text: `One clear night, ${DEMO_CHILD} stood in the backyard and gazed up at a sky full of twinkling stars. "I wonder what's up there," ${DEMO_CHILD} whispered. As if answering, a bright light streaked across the sky and landed softly in the garden.`,
    gradient: "from-indigo-800 via-purple-800 to-blue-900",
  },
  {
    pageNumber: 2,
    text: `Inside the rocket ship, ${DEMO_CHILD} pressed the big red button. WHOOOOSH! The ground fell away and Earth became a small blue marble below. Through the window, stars danced like a million fireflies.`,
    gradient: "from-purple-800 via-violet-800 to-indigo-900",
  },
  {
    pageNumber: 3,
    text: `Near Saturn's sparkling rings, ${DEMO_CHILD} floated in a cozy space suit. The rings glittered with ice crystals that caught the starlight. "${DEMO_CHILD}, you're the youngest explorer to ever visit!" said the ship's computer.`,
    gradient: "from-blue-800 via-indigo-800 to-purple-900",
  },
  {
    pageNumber: 4,
    text: `On a glowing purple planet, ${DEMO_CHILD} met round, friendly aliens who spoke in giggles. They shared stories and taught ${DEMO_CHILD} to bounce between the two moons. "You'll always have friends in the stars," they promised as ${DEMO_CHILD} headed home.`,
    gradient: "from-violet-800 via-purple-800 to-pink-900",
  },
];

export default function DemoPage() {
  const [currentPage, setCurrentPage] = useState(0);

  const goNext = () =>
    setCurrentPage((p) => Math.min(p + 1, demoPages.length - 1));
  const goPrev = () => setCurrentPage((p) => Math.max(p - 1, 0));

  const page = demoPages[currentPage];
  const isFirst = currentPage === 0;
  const isLast = currentPage === demoPages.length - 1;

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-[#FFFBF5]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-violet-700"
          >
            <BookOpen className="h-5 w-5" />
            <span className="font-heading">Starmee</span>
          </Link>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
            Sample Book
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 md:py-12">
        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            Sample Story Preview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            See how a personalized Starmee book looks
          </p>
        </div>

        {/* Book */}
        <div className="relative w-full">
          <div
            key={currentPage}
            className="animate-in fade-in duration-500"
          >
            {page.isCover ? (
              /* Cover */
              <div
                className={cn(
                  "relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl",
                  `bg-gradient-to-br ${page.gradient}`
                )}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center text-white">
                  <div className="mb-4 rounded-full bg-white/20 p-4 backdrop-blur-sm">
                    <BookOpen className="h-10 w-10" />
                  </div>
                  <h2 className="font-heading text-3xl md:text-4xl font-bold leading-tight">
                    {page.text}
                  </h2>
                  <div className="mt-6 h-0.5 w-16 rounded-full bg-white/40" />
                  <p className="mt-3 text-sm text-white/70">
                    A Starmee Adventure
                  </p>
                </div>
                <div className="absolute top-3 right-3 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold text-amber-900">
                  SAMPLE
                </div>
              </div>
            ) : (
              /* Interior page */
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-white border border-gray-100">
                {/* Illustration placeholder */}
                <div
                  className={cn(
                    "relative h-[55%] bg-gradient-to-br",
                    page.gradient
                  )}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white/60">
                    <div className="text-center">
                      <Sparkles className="mx-auto h-8 w-8 mb-2" />
                      <p className="text-sm font-medium">
                        Custom AI illustration
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        Generated uniquely for your child
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    SAMPLE
                  </div>
                </div>
                {/* Text */}
                <div className="h-[45%] flex items-center p-6 md:p-8">
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                    {page.text}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Nav arrows */}
          {!isFirst && (
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 hover:text-violet-600 transition sm:-left-5"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 hover:text-violet-600 transition sm:-right-5"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Page dots */}
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {demoPages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === currentPage
                  ? "w-6 bg-violet-600"
                  : "w-2 bg-violet-200 hover:bg-violet-300"
              )}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center space-y-4">
          <p className="text-gray-500 text-sm">
            In the real book, every illustration is generated uniquely for your
            child — featuring their face, their name, and their adventure.
          </p>
          <Link href="/create">
            <Button className="h-14 w-full max-w-sm rounded-xl text-lg font-semibold bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:shadow-xl hover:shadow-violet-200 hover:brightness-105">
              <Sparkles className="mr-2 h-5 w-5" />
              Create Your Child&apos;s Story
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
