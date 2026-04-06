"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, Star, Heart, Zap } from "lucide-react";

/* ── Decorative doodle components ── */
function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} fill="currentColor">
      <ellipse cx="60" cy="45" rx="55" ry="20" />
      <ellipse cx="40" cy="38" rx="30" ry="22" />
      <ellipse cx="72" cy="33" rx="28" ry="24" />
      <ellipse cx="90" cy="42" rx="22" ry="18" />
    </svg>
  );
}

function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 30" className={className} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
      <path d="M5 15 Q15 5 25 15 Q35 25 45 15 Q55 5 65 15 Q75 25 85 15 Q95 5 100 10" />
    </svg>
  );
}

function StarBurst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 50 50" className={className} fill="currentColor">
      <polygon points="25,2 29,20 47,20 33,31 38,49 25,38 12,49 17,31 3,20 21,20" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#FFF9E6] bg-dots py-16 sm:py-24 lg:py-28">

      {/* Decorative floating shapes */}
      <div className="absolute top-8 left-6 animate-float opacity-70 hidden sm:block">
        <StarBurst className="w-10 h-10 text-[#FFD166]" />
      </div>
      <div className="absolute top-20 right-8 animate-float-reverse opacity-60 hidden sm:block">
        <Heart className="w-8 h-8 text-[#FF6B6B] fill-[#FF6B6B]" />
      </div>
      <div className="absolute top-1/3 left-4 animate-float opacity-50 hidden lg:block" style={{ animationDelay: "1s" }}>
        <Cloud className="w-24 h-12 text-[#4FC3F7]/40" />
      </div>
      <div className="absolute bottom-24 right-6 animate-float opacity-60 hidden sm:block" style={{ animationDelay: "1.5s" }}>
        <StarBurst className="w-8 h-8 text-[#06D6A0]" />
      </div>
      <div className="absolute top-12 left-1/2 animate-spin-slow opacity-30 hidden lg:block">
        <Star className="w-6 h-6 text-[#FF9F1C] fill-[#FF9F1C]" />
      </div>
      <div className="absolute bottom-16 left-1/4 animate-float-reverse opacity-50 hidden lg:block" style={{ animationDelay: "2s" }}>
        <Zap className="w-7 h-7 text-[#FFD166] fill-[#FFD166]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Text content */}
          <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">

            {/* Fun badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFD166] border-2 border-[#1a1a2e] px-4 py-1.5 mb-6 shadow-[3px_3px_0px_#1a1a2e]">
              <div className="flex -space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 text-[#FF9F1C] fill-[#FF9F1C]" />
                ))}
              </div>
              <span className="font-body font-bold text-xs text-[#1a1a2e]">
                Loved by 500+ families ✨
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-[#1a1a2e] leading-[1.05] mb-6">
              Your Child Is{" "}
              <span className="relative inline-block">
                <span className="text-[#7B2D8B] relative z-10">the Star</span>
                {/* Wobbly underline */}
                <Squiggle className="absolute -bottom-2 left-0 w-full text-[#FFD166]" />
              </span>
              <br />
              of Their Own{" "}
              <span className="text-[#FF6B6B]">Story!</span>
            </h1>

            <p className="font-body text-lg sm:text-xl text-[#1a1a2e]/70 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Create a magical, personalized storybook your child will treasure
              forever. <strong>Free preview — no credit card needed!</strong>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/create">
                <button className="btn-chunky flex items-center gap-2.5 bg-[#7B2D8B] text-white font-heading font-bold text-lg px-8 py-4">
                  <Sparkles className="h-5 w-5" />
                  Create Their Book
                </button>
              </Link>
              <a href="#sample-book">
                <button className="btn-chunky flex items-center gap-2 bg-white text-[#1a1a2e] font-heading font-bold text-base px-6 py-4">
                  See a Sample 📖
                </button>
              </a>
            </div>

            {/* Trust dots */}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start">
              {[
                { emoji: "⚡", text: "Preview in about 2 min" },
                { emoji: "🔒", text: "Photo stays private" },
                { emoji: "💳", text: "No credit card needed" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-1.5">
                  <span>{item.emoji}</span>
                  <span className="font-body font-bold text-sm text-[#1a1a2e]/60">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Book mockup */}
          <div className="relative flex items-center justify-center lg:justify-end">

            {/* Decorative circles behind book */}
            <div className="absolute w-72 h-72 rounded-full bg-[#FFD166]/30 border-2 border-[#FFD166]/40 -translate-x-4 hidden sm:block" />
            <div className="absolute w-52 h-52 rounded-full bg-[#7B2D8B]/10 translate-x-8 translate-y-8 hidden sm:block" />

            {/* The book */}
            <div className="relative group animate-bounce-gentle">

              {/* Floating stickers around book */}
              <div className="absolute -top-8 -left-6 animate-float z-20" style={{ animationDelay: "0.5s" }}>
                <div className="bg-[#FFD166] border-2 border-[#1a1a2e] rounded-full px-2.5 py-1 shadow-[3px_3px_0px_#1a1a2e] font-body font-bold text-xs text-[#1a1a2e] whitespace-nowrap">
                  ⭐ Bestseller!
                </div>
              </div>
              <div className="absolute -top-4 right-2 animate-float-reverse z-20" style={{ animationDelay: "1s" }}>
                <StarBurst className="w-8 h-8 text-[#FF6B6B]" />
              </div>
              <div className="absolute bottom-8 -right-8 animate-float z-20" style={{ animationDelay: "1.8s" }}>
                <div className="bg-[#06D6A0] border-2 border-[#1a1a2e] rounded-xl px-2.5 py-1 shadow-[3px_3px_0px_#1a1a2e] font-body font-bold text-xs text-[#1a1a2e]">
                  🎉 Personalized!
                </div>
              </div>
              <div className="absolute -bottom-6 left-4 animate-spin-slow opacity-70">
                <StarBurst className="w-10 h-10 text-[#FF9F1C]" />
              </div>

              {/* Book body */}
              <div className="relative w-64 h-80 sm:w-72 sm:h-[22rem]">
                {/* Spine */}
                <div className="absolute -left-4 inset-y-1 w-8 bg-[#4A0E5C] rounded-l-2xl border-2 border-[#1a1a2e] border-r-0" />

                {/* Cover */}
                <div
                  className="relative w-full h-full rounded-r-3xl rounded-l-sm overflow-hidden"
                  style={{
                    border: "2.5px solid #1a1a2e",
                    boxShadow: "8px 8px 0px #1a1a2e",
                  }}
                >
                  {/* AI-generated book cover */}
                  <Image
                    src="/images/demo/book-cover.png"
                    alt="Sample personalized storybook cover featuring a child as the hero"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 256px, 288px"
                    priority
                  />

                  {/* Title overlay to replace baked-in image text */}
                  <div className="absolute top-0 left-0 right-0 h-[35%] flex flex-col items-center justify-center px-4 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a0e08] via-[#2a1810]/95 to-transparent" />
                    <span
                      className="relative font-heading text-[#FFD166] text-[11px] sm:text-sm tracking-[0.2em] uppercase drop-shadow-lg"
                      style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
                    >
                      Emma&apos;s Adventure
                    </span>
                    <span
                      className="relative font-heading text-white text-lg sm:text-2xl font-bold tracking-wide leading-tight mt-1 drop-shadow-lg text-center"
                      style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
                    >
                      The Enchanted Castle
                    </span>
                  </div>

                  {/* Glossy sheen */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/12 to-transparent" />
                </div>

                {/* Pages edge */}
                <div className="absolute right-0 inset-y-2 w-3 bg-gradient-to-l from-gray-100 to-gray-200 rounded-r-sm border-y-2 border-r-2 border-[#1a1a2e]">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-px bg-gray-300/60 mt-[calc(10%)]" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wavy bottom edge */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 48" className="w-full" preserveAspectRatio="none" fill="#FFFBF0">
          <path d="M0,48 L0,24 Q180,0 360,24 Q540,48 720,24 Q900,0 1080,24 Q1260,48 1440,24 L1440,48 Z" />
        </svg>
      </div>
    </section>
  );
}
