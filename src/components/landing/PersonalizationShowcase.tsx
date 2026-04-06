"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { PreviewOverlay } from "./StoryPageOverlay";
import type { PreviewText } from "./StoryPageOverlay";

const spreadData: {
  src: string;
  alt: string;
  label: string;
  labelColor: string;
  previewText: PreviewText;
  placement?: { position: React.CSSProperties; tailSide?: "left" | "right" | "center" };
}[] = [
  {
    src: "/images/demo/spread-space.png",
    alt: "Storybook spread showing the child as an astronaut on the moon",
    label: "Space Adventure",
    labelColor: "text-indigo-600",
    previewText: {
      type: "dialogue",
      speaker: "Aarav",
      text: "I can see the whole\nEarth from here!",
      speakerColor: "#4F46E5",
    },
    placement: {
      position: { bottom: "8%", right: "4%", maxWidth: "38%" },
      tailSide: "left",
    },
  },
  {
    src: "/images/demo/spread-dino.png",
    alt: "Storybook spread showing the child on a dinosaur adventure",
    label: "Dinosaur Discovery",
    labelColor: "text-emerald-600",
    previewText: {
      type: "dialogue",
      speaker: "Dino",
      text: "Follow me!\nAdventure is waiting!",
      speakerColor: "#059669",
    },
    placement: {
      position: { bottom: "6%", left: "4%", maxWidth: "38%" },
      tailSide: "right",
    },
  },
  {
    src: "/images/demo/spread-castle.png",
    alt: "Storybook spread showing a royal castle adventure",
    label: "Enchanted Castle",
    labelColor: "text-pink-600",
    previewText: {
      type: "narration",
      text: "Butterflies danced in the warm breeze\nas they rode toward the castle.",
    },
    placement: {
      position: { bottom: "5%", left: "4%", maxWidth: "44%" },
    },
  },
];

function SpreadPreviewCard({
  src,
  alt,
  label,
  labelColor,
  previewText,
  placement,
}: {
  src: string;
  alt: string;
  label: string;
  labelColor: string;
  previewText: PreviewText;
  placement?: { position: React.CSSProperties; tailSide?: "left" | "right" | "center" };
}) {
  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden border-2 border-[#1a1a2e] shadow-[5px_5px_0px_#1a1a2e]">
        <div className="relative">
          <Image
            src={src}
            alt={alt}
            width={800}
            height={450}
            className="w-full h-auto block"
            priority
          />
          <PreviewOverlay previewText={previewText} placement={placement} />
        </div>
      </div>
      <p className={`font-heading text-sm font-bold mt-2.5 ml-1 ${labelColor}`}>
        {label}
      </p>
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
            <div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#1a1a2e] shadow-[5px_5px_0px_#1a1a2e] bg-white">
                <Image
                  src="/images/demo/child-photo-boy.png"
                  alt="Example child photo uploaded by a parent"
                  width={512}
                  height={512}
                  className="w-full h-auto block"
                  priority
                />
              </div>
              <p className="font-heading text-sm font-bold mt-2.5 ml-1 text-[#1a1a2e]/60">
                Upload a photo
              </p>
            </div>

            <SpreadPreviewCard {...spreadData[1]} />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <SpreadPreviewCard {...spreadData[0]} />
            <SpreadPreviewCard {...spreadData[2]} />
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
