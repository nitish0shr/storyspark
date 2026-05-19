"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const samplePages = [
  {
    image: "/images/demo/spread-space.png",
    theme: "Space Adventure",
    color: "bg-[#5E17EB]",
    overlayTitle: "Mission to the Moon!",
    overlayBody: "He climbed out of the spaceship and took his very first step on the moon. The ground was soft and dusty. He looked up and saw the Earth, big and blue, floating in the dark sky. \u201CThis is amazing!\u201D he whispered.",
  },
  {
    image: "/images/demo/spread-dino.png",
    theme: "Dinosaur Discovery",
    color: "bg-emerald-500",
    overlayTitle: "The Dinosaur Valley",
    overlayBody: "Deep in the jungle, he met a friendly little dinosaur with bright, curious eyes. \u201CHi there! Want to explore with me?\u201D The dinosaur wagged its tail happily. Together, they set off toward the rumbling volcano in the distance.",
  },
  {
    image: "/images/demo/spread-castle.png",
    theme: "Enchanted Castle",
    color: "bg-[#CB6CE6]",
    overlayTitle: "The Royal Adventure",
    overlayBody: "A golden carriage pulled by two white horses arrived just for them. Butterflies danced in the warm breeze as they rode through the flower-covered meadow toward the sparkling castle on the hill.",
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
    <section id="sample-book" className="py-20 sm:py-28 relative bg-[#FDF5E7]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <div className="inline-block bg-[#FFDE59] border-2 border-[#262625] rounded-full px-5 py-1.5 shadow-[3px_3px_0px_#262625] mb-5">
            <span className="font-body font-bold text-sm text-[#262625]">Peek inside 📖</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#262625] mb-4">
            One Page From Each World
          </h2>
          <p className="font-body text-lg text-[#262625]/60 max-w-md mx-auto">
            Every adventure features <span className="font-bold text-[#5E17EB]">your child</span> as the hero, illustrated in a beautiful storybook style.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="relative bg-white rounded-3xl overflow-hidden border-2 border-[#262625] shadow-[6px_6px_0px_#262625]">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={page.image}
                  alt={`Sample storybook spread from ${page.theme} adventure`}
                  fill
                  className="object-cover transition-opacity duration-500"
                  sizes="(max-width: 768px) 100vw, 720px"
                  priority
                />

                <div className="absolute left-[3%] top-[5%] w-[44%] h-[90%] flex flex-col pointer-events-none">
                  <div className="absolute inset-0 bg-[#FDF5E7]/90 backdrop-blur-sm rounded-lg" />
                  <div className="relative p-[8%] flex flex-col h-full">
                    <h3 className="font-heading text-[clamp(10px,2vw,18px)] font-bold text-[#262625] leading-tight mb-[4%]">
                      {page.overlayTitle}
                    </h3>
                    <p className="font-body text-[clamp(7px,1.3vw,13px)] text-[#262625]/80 leading-relaxed">
                      {page.overlayBody}
                    </p>
                  </div>
                </div>

                <div className="absolute top-4 right-4 z-10">
                  <div className={`${page.color} border-2 border-[#262625] rounded-full px-3 py-1 shadow-[2px_2px_0px_#262625]`}>
                    <span className="font-body font-bold text-xs text-white whitespace-nowrap">{page.theme}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 0}
              className="absolute left-2 sm:-left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 border-[#262625] shadow-[3px_3px_0px_#262625] flex items-center justify-center text-[#262625] hover:bg-[#FFDE59] disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === samplePages.length - 1}
              className="absolute right-2 sm:-right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 border-[#262625] shadow-[3px_3px_0px_#262625] flex items-center justify-center text-[#262625] hover:bg-[#FFDE59] disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
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
                className={`rounded-full transition-all duration-300 border-2 border-[#262625] ${
                  index === currentPage
                    ? `w-10 h-3 ${p.color} shadow-[2px_2px_0px_#262625]`
                    : "w-3 h-3 bg-white hover:bg-[#FFDE59]"
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
