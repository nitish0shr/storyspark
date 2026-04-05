"use client";

import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "My daughter couldn't believe she was IN the book! She made us read it every single night for two weeks straight.",
    name: "Sarah M.",
    role: "Mom of Lily, age 4",
    emoji: "👩",
    bg: "bg-[#FFD166]",
    theme: "Magic Forest 🌲",
  },
  {
    quote: "The illustrations honestly look like my son! Best birthday gift I've ever given. He was SO excited.",
    name: "David L.",
    role: "Dad of Noah, age 6",
    emoji: "👨",
    bg: "bg-[#DCFBF2]",
    theme: "Space Adventure 🚀",
  },
  {
    quote: "I bought one for each of my three grandkids. Now they're all fighting over whose adventure is the best!",
    name: "Linda K.",
    role: "Grandma of 3",
    emoji: "👵",
    bg: "bg-[#C3B1E1]",
    theme: "Enchanted Castle 🏰",
  },
  {
    quote: "My son kept pointing at every page shouting 'That's me! That's me!' The look on his face was priceless.",
    name: "Marcus T.",
    role: "Dad of Tyler, age 7",
    emoji: "🧔",
    bg: "bg-[#FFE8E8]",
    theme: "Superhero City 🦸",
  },
  {
    quote: "I was skeptical at first but the quality completely blew me away. The story felt hand-written for my daughter.",
    name: "Jessica R.",
    role: "Mom of Zoe, age 5",
    emoji: "👩‍🦱",
    bg: "bg-[#E0F4FD]",
    theme: "Ocean Depths 🐠",
  },
  {
    quote: "Perfect rainy day surprise. My niece has read her dinosaur book so many times the pages are starting to wear!",
    name: "Amy C.",
    role: "Auntie of Emma, age 3",
    emoji: "👩‍🦰",
    bg: "bg-[#FFF4CC]",
    theme: "Dino World 🦕",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 sm:py-28 bg-[#FFF9E6] bg-dots relative">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block bg-[#FF6B6B] border-2 border-[#1a1a2e] rounded-full px-5 py-1.5 shadow-[3px_3px_0px_#1a1a2e] mb-5">
            <span className="font-body font-bold text-sm text-white">Happy families! 💛</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a2e] mb-4">
            Parents Are Obsessed 😍
          </h2>
          {/* Stars */}
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-[#FF9F1C] fill-[#FF9F1C]" />
            ))}
          </div>
          <p className="font-body font-bold text-sm text-[#1a1a2e]/50">
            4.9 out of 5 · 500+ personalized books created
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`${t.bg} card-chunky p-6 flex flex-col gap-4`}
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 text-[#FF9F1C] fill-[#FF9F1C]" />
                ))}
              </div>

              {/* Theme tag */}
              <div className="inline-flex">
                <span className="bg-white/60 border-2 border-[#1a1a2e] rounded-full px-3 py-0.5 font-body font-bold text-xs text-[#1a1a2e]">
                  {t.theme}
                </span>
              </div>

              {/* Quote */}
              <p className="font-body text-sm text-[#1a1a2e] leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-3 border-t-2 border-dashed border-[#1a1a2e]/20">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#1a1a2e] flex items-center justify-center text-xl shadow-[2px_2px_0px_#1a1a2e] flex-shrink-0">
                  {t.emoji}
                </div>
                <div>
                  <p className="font-body font-bold text-sm text-[#1a1a2e]">{t.name}</p>
                  <p className="font-body text-xs text-[#1a1a2e]/60">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 48" className="w-full" preserveAspectRatio="none" fill="#C3B1E1">
          <path d="M0,48 L0,20 Q360,50 720,20 Q1080,-10 1440,30 L1440,48 Z" />
        </svg>
      </div>
    </section>
  );
}
