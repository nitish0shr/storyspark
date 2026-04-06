"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FullPageOverlay } from "./StoryPageOverlay";
import type { TextBlock } from "./StoryPageOverlay";

const samplePages: {
  image: string;
  title: string;
  theme: string;
  color: string;
  fullPageTextBlocks: TextBlock[];
}[] = [
  {
    image: "/images/demo/spread-space.png",
    title: "Mission to the Moon!",
    theme: "Space Adventure",
    color: "bg-indigo-500",
    fullPageTextBlocks: [
      {
        type: "narration",
        text: "He took his very first step on the moon. The ground was soft and dusty beneath his boots.",
      },
      {
        type: "dialogue",
        speaker: "Aarav",
        text: "I can see the whole Earth from here!",
      },
    ],
  },
  {
    image: "/images/demo/spread-dino.png",
    title: "The Dinosaur Valley",
    theme: "Dinosaur Discovery",
    color: "bg-emerald-500",
    fullPageTextBlocks: [
      {
        type: "narration",
        text: "The volcano rumbled softly as they stepped into the valley together.",
      },
      {
        type: "dialogue",
        speaker: "Dino",
        text: "Follow me! Adventure is waiting!",
      },
    ],
  },
  {
    image: "/images/demo/spread-castle.png",
    title: "The Royal Adventure",
    theme: "Enchanted Castle",
    color: "bg-pink-500",
    fullPageTextBlocks: [
      {
        type: "narration",
        text: "A golden carriage arrived as butterflies danced in the warm breeze.",
      },
      {
        type: "dialogue",
        speaker: "Princess Emma",
        text: "The grand ball is about to begin!",
      },
    ],
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
    <section id="sample-book" className="py-20 sm:py-28 relative bg-[#FFFBF0]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <div className="inline-block bg-[#FF9F1C] border-2 border-[#1a1a2e] rounded-full px-5 py-1.5 shadow-[3px_3px_0px_#1a1a2e] mb-5">
            <span className="font-body font-bold text-sm text-[#1a1a2e]">Peek inside</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a1a2e] mb-4">
            One Page From Each World
          </h2>
          <p className="font-body text-lg text-[#1a1a2e]/60 max-w-md mx-auto">
            Every adventure features <span className="font-bold text-[#7B2D8B]">your child</span> as the hero, illustrated in a beautiful storybook style.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden border-2 border-[#1a1a2e] shadow-[6px_6px_0px_#1a1a2e]">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={page.image}
                  alt={`${page.title} — ${page.theme} storybook page`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 720px"
                  priority
                />

                <FullPageOverlay textBlocks={page.fullPageTextBlocks} />
              </div>
            </div>

            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 0}
              className="absolute left-2 sm:-left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 border-[#1a1a2e] shadow-[3px_3px_0px_#1a1a2e] flex items-center justify-center text-[#1a1a2e] hover:bg-[#FFD166] disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === samplePages.length - 1}
              className="absolute right-2 sm:-right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 border-[#1a1a2e] shadow-[3px_3px_0px_#1a1a2e] flex items-center justify-center text-[#1a1a2e] hover:bg-[#FFD166] disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg font-bold text-[#1a1a2e]">{page.title}</h3>
              <span className="font-body text-sm text-[#1a1a2e]/50">{page.theme}</span>
            </div>

            <div className="flex items-center gap-3">
              {samplePages.map((p, index) => (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  className={`rounded-full transition-all duration-300 border-2 border-[#1a1a2e] ${
                    index === currentPage
                      ? `w-10 h-3 ${p.color} shadow-[2px_2px_0px_#1a1a2e]`
                      : "w-3 h-3 bg-white hover:bg-[#FFD166]"
                  }`}
                  aria-label={`Go to ${p.theme}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
