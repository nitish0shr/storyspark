"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

const spreadOverlays: Record<string, { title: string; body: string }> = {
  "/images/demo/spread-space.png": {
    title: "Mission to the Moon!",
    body: "He climbed out of the spaceship and took his very first step on the moon. The ground was soft and dusty. He looked up and saw the Earth, big and blue, floating in the dark sky. \u201CThis is amazing!\u201D he whispered.",
  },
  "/images/demo/spread-dino.png": {
    title: "The Dinosaur Valley",
    body: "Deep in the jungle, he met a friendly little dinosaur with bright green eyes. \u201CHi there! Want to explore with me?\u201D The dinosaur wagged its tail happily. Together, they set off toward the rumbling volcano.",
  },
  "/images/demo/spread-castle.png": {
    title: "The Royal Adventure",
    body: "A golden carriage pulled by two white horses arrived just for them. Butterflies danced in the warm breeze as they rode through the flower-covered meadow toward the sparkling castle on the hill.",
  },
};

function SpreadWithOverlay({
  src,
  alt,
  label,
  labelColor,
}: {
  src: string;
  alt: string;
  label: string;
  labelColor: string;
}) {
  const overlay = spreadOverlays[src];
  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-[#1a1a2e] shadow-[5px_5px_0px_#1a1a2e]">
      <div className="absolute top-3 left-3 z-10">
        <div className={`${labelColor} border-2 border-[#1a1a2e] rounded-full px-3 py-1 shadow-[2px_2px_0px_#1a1a2e]`}>
          <span className="font-body font-bold text-xs text-white">{label}</span>
        </div>
      </div>
      <div className="relative">
        <Image
          src={src}
          alt={alt}
          width={800}
          height={450}
          className="w-full h-auto"
          priority
        />
        {overlay && (
          <div className="absolute left-[3%] top-[5%] w-[44%] h-[90%] flex flex-col pointer-events-none p-[3%]">
            <h3
              className="font-heading text-[clamp(9px,1.7vw,17px)] font-extrabold text-white leading-tight mb-[3%] drop-shadow-lg"
              style={{ textShadow: "0 2px 6px rgba(0,0,0,0.8), 0 0px 2px rgba(0,0,0,0.9)" }}
            >
              {overlay.title}
            </h3>
            <p
              className="font-body text-[clamp(6px,1.15vw,11px)] text-white/95 leading-relaxed font-medium drop-shadow-md"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.85), 0 0px 1px rgba(0,0,0,0.95)" }}
            >
              {overlay.body}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PersonalizationShowcase() {
  return (
    <section className="relative py-20 sm:py-28 bg-[#FFF9E6] overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-block bg-[#FF6B6B] border-2 border-[#1a1a2e] rounded-full px-5 py-1.5 shadow-[3px_3px_0px_#1a1a2e] mb-5">
            <span className="font-body font-bold text-sm text-white">See the magic in action</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a2e] mb-4">
            From Photo to <span className="text-[#7B2D8B]">Storybook Hero</span>
          </h2>
          <p className="font-body text-lg text-[#1a1a2e]/60 max-w-lg mx-auto">
            Upload a photo and our AI transforms your child into the star of their very own illustrated adventure.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 gap-6">
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#1a1a2e] shadow-[5px_5px_0px_#1a1a2e] bg-white">
              <div className="absolute top-3 left-3 z-10">
                <div className="bg-white border-2 border-[#1a1a2e] rounded-full px-3 py-1 shadow-[2px_2px_0px_#1a1a2e]">
                  <span className="font-body font-bold text-xs text-[#1a1a2e]">Upload a photo</span>
                </div>
              </div>
              <Image
                src="/images/demo/child-photo-boy.png"
                alt="Example child photo uploaded by a parent"
                width={512}
                height={512}
                className="w-full h-auto"
                priority
              />
            </div>

            <SpreadWithOverlay
              src="/images/demo/spread-dino.png"
              alt="Storybook spread showing the child on a dinosaur adventure"
              label="Dinosaur Discovery"
              labelColor="bg-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <SpreadWithOverlay
              src="/images/demo/spread-space.png"
              alt="Storybook spread showing the child as an astronaut on the moon"
              label="Space Adventure"
              labelColor="bg-indigo-500"
            />

            <SpreadWithOverlay
              src="/images/demo/spread-castle.png"
              alt="Storybook spread showing a royal castle adventure"
              label="Enchanted Castle"
              labelColor="bg-pink-500"
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 bg-white border-2 border-[#1a1a2e] rounded-2xl px-6 py-3 shadow-[3px_3px_0px_#1a1a2e]">
            <Sparkles className="w-5 h-5 text-[#7B2D8B]" />
            <span className="font-body font-bold text-sm text-[#1a1a2e]">
              Same child. Different adventure. Every book is unique.
            </span>
          </div>

          <Link href="/create">
            <button className="btn-chunky flex items-center gap-2 bg-[#7B2D8B] text-white font-heading font-bold text-lg px-8 py-4 mt-2">
              <Sparkles className="h-5 w-5" />
              Create Their Book
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>

          <p className="font-body text-xs text-[#1a1a2e]/40 max-w-sm mx-auto text-center mt-2">
            Demo images shown above are AI-generated examples. Your child&apos;s storybook will be uniquely created from their own photo.
          </p>
        </div>
      </div>
    </section>
  );
}
