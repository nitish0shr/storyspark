"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StoryPageOverlay from "./StoryPageOverlay";
import type { TextBlock } from "./StoryPageOverlay";

const samplePages: {
  image: string;
  theme: string;
  color: string;
  textBlocks: TextBlock[];
}[] = [
  {
    image: "/images/demo/spread-space.png",
    theme: "Space Adventure",
    color: "bg-indigo-500",
    textBlocks: [
      {
        type: "narration",
        text: "He climbed out of the spaceship and took his very first step on the moon. The ground was soft and dusty beneath his boots.",
      },
      {
        type: "dialogue",
        speaker: "Aarav",
        text: "Wow! I\u2019m really on the moon! I can see the whole Earth from here!",
      },
      {
        type: "dialogue",
        speaker: "Mission Control",
        text: "Great job, explorer! Now look for the glowing moon crystals.",
      },
    ],
  },
  {
    image: "/images/demo/spread-dino.png",
    theme: "Dinosaur Discovery",
    color: "bg-emerald-500",
    textBlocks: [
      {
        type: "narration",
        text: "Deep in the jungle, the volcano rumbled softly as Aarav and his new dinosaur friend stepped into the valley.",
      },
      {
        type: "dialogue",
        speaker: "Aarav",
        text: "Do you think we should keep going?",
      },
      {
        type: "dialogue",
        speaker: "Dino",
        text: "Yes! Adventure is waiting for us. Follow me!",
      },
    ],
  },
  {
    image: "/images/demo/spread-castle.png",
    theme: "Enchanted Castle",
    color: "bg-pink-500",
    textBlocks: [
      {
        type: "narration",
        text: "A golden carriage pulled by two white horses arrived just for them. Butterflies danced in the warm breeze.",
      },
      {
        type: "dialogue",
        speaker: "Princess Emma",
        text: "The grand ball is about to begin! Are you ready?",
      },
      {
        type: "dialogue",
        speaker: "Aarav",
        text: "I\u2019ve never been to a castle before. This is magical!",
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
            <div className="relative bg-white rounded-3xl overflow-hidden border-2 border-[#1a1a2e] shadow-[6px_6px_0px_#1a1a2e]">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={page.image}
                  alt={`Sample storybook spread from ${page.theme} adventure`}
                  fill
                  className="object-cover transition-opacity duration-500"
                  sizes="(max-width: 768px) 100vw, 720px"
                  priority
                />

                <StoryPageOverlay textBlocks={page.textBlocks} />

                <div className="absolute top-4 right-4 z-20">
                  <div className={`${page.color} border-2 border-[#1a1a2e] rounded-full px-3 py-1 shadow-[2px_2px_0px_#1a1a2e]`}>
                    <span className="font-body font-bold text-xs text-white">{page.theme}</span>
                  </div>
                </div>
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

          <div className="flex items-center justify-center gap-3 mt-8">
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
    </section>
  );
}
