"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Heart, Zap } from "lucide-react";

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

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="currentColor">
      <polygon points="20,1 22,17 38,20 22,23 20,39 18,23 2,20 18,17" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#FDF5E7] bg-stars py-16 sm:py-24 lg:py-28">

      {/* Decorative floating shapes */}
      <div className="absolute top-8 left-6 animate-float opacity-80 hidden sm:block">
        <SparkleIcon className="w-10 h-10 text-[#FFDE59]" />
      </div>
      <div className="absolute top-20 right-8 animate-float-reverse opacity-70 hidden sm:block">
        <Heart className="w-8 h-8 text-[#CB6CE6] fill-[#CB6CE6]" />
      </div>
      <div className="absolute bottom-24 right-6 animate-float opacity-70 hidden sm:block" style={{ animationDelay: "1.5s" }}>
        <StarBurst className="w-8 h-8 text-[#5E17EB]" />
      </div>
      <div className="absolute top-12 left-1/2 animate-spin-slow opacity-40 hidden lg:block">
        <Star className="w-6 h-6 text-[#FFDE59] fill-[#FFDE59]" />
      </div>
      <div className="absolute bottom-16 left-1/4 animate-float-reverse opacity-60 hidden lg:block" style={{ animationDelay: "2s" }}>
        <Zap className="w-7 h-7 text-[#CB6CE6] fill-[#CB6CE6]" />
      </div>
      <div className="absolute top-1/3 right-12 animate-float opacity-50 hidden lg:block" style={{ animationDelay: "0.8s" }}>
        <SparkleIcon className="w-6 h-6 text-[#5E17EB]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Text content */}
          <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">

            {/* Fun badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFDE59] border-2 border-[#262625] px-4 py-1.5 mb-6 shadow-[3px_3px_0px_#262625]">
              <div className="flex -space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 text-[#5E17EB] fill-[#5E17EB]" />
                ))}
              </div>
              <span className="font-body font-bold text-xs text-[#262625]">
                Loved by 500+ families ✨
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-[#262625] leading-[1.05] mb-6">
              Your Child Is{" "}
              <span className="relative inline-block">
                <span className="text-[#5E17EB] relative z-10">the Star</span>
                <Squiggle className="absolute -bottom-2 left-0 w-full text-[#FFDE59]" />
              </span>
              <br />
              of Their Own{" "}
              <span className="text-[#CB6CE6]">Story!</span>
            </h1>

            <p className="font-body text-lg sm:text-xl text-[#262625]/70 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Create a magical, personalized storybook your child will treasure
              forever. <strong>See a free sample of your child as the hero — no credit card needed.</strong>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/create">
                <button className="btn-chunky flex items-center gap-2.5 bg-[#FFDE59] text-[#262625] font-heading font-bold text-lg px-8 py-4">
                  <Star className="h-5 w-5 fill-[#262625]" />
                  Create Their Book
                </button>
              </Link>
              <a href="#sample-book">
                <button className="btn-chunky flex items-center gap-2 bg-[#5E17EB] text-white font-heading font-bold text-base px-6 py-4">
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
                  <span className="font-body font-bold text-sm text-[#262625]/60">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Book mockup */}
          <div className="relative flex items-center justify-center lg:justify-end">

            {/* Decorative circles behind book */}
            <div className="absolute w-72 h-72 rounded-full bg-[#FFDE59]/25 border-2 border-[#FFDE59]/40 -translate-x-4 hidden sm:block" />
            <div className="absolute w-52 h-52 rounded-full bg-[#CB6CE6]/15 translate-x-8 translate-y-8 hidden sm:block" />

            {/* The book */}
            <div className="relative group animate-bounce-gentle">

              {/* Floating stickers around book */}
              <div className="absolute -top-8 -left-6 animate-float z-20" style={{ animationDelay: "0.5s" }}>
                <div className="bg-[#FFDE59] border-2 border-[#262625] rounded-full px-2.5 py-1 shadow-[3px_3px_0px_#262625] font-body font-bold text-xs text-[#262625] whitespace-nowrap">
                  ⭐ Bestseller!
                </div>
              </div>
              <div className="absolute -top-4 right-2 animate-float-reverse z-20" style={{ animationDelay: "1s" }}>
                <StarBurst className="w-8 h-8 text-[#CB6CE6]" />
              </div>
              <div className="absolute bottom-8 -right-8 animate-float z-20" style={{ animationDelay: "1.8s" }}>
                <div className="bg-[#5E17EB] border-2 border-[#262625] rounded-xl px-2.5 py-1 shadow-[3px_3px_0px_#262625] font-body font-bold text-xs text-white">
                  🎉 Personalized!
                </div>
              </div>
              <div className="absolute -bottom-6 left-4 animate-spin-slow opacity-70">
                <StarBurst className="w-10 h-10 text-[#FFDE59]" />
              </div>

              {/* Book body */}
              <div className="relative w-64 h-80 sm:w-72 sm:h-[22rem]">
                {/* Spine */}
                <div className="absolute -left-4 inset-y-1 w-8 bg-[#3D0E99] rounded-l-2xl border-2 border-[#262625] border-r-0" />

                {/* Cover */}
                <div
                  className="relative w-full h-full rounded-r-3xl rounded-l-sm overflow-hidden"
                  style={{
                    border: "2.5px solid #262625",
                    boxShadow: "8px 8px 0px #262625",
                  }}
                >
                  <Image
                    src="/images/demo/book-cover.png"
                    alt="Sample personalized storybook cover featuring a child as the hero"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 256px, 288px"
                    priority
                  />

                  {/* Title overlay */}
                  <div className="absolute top-0 left-0 right-0 h-[35%] flex flex-col items-center justify-center px-4 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a0e08] via-[#2a1810]/95 to-transparent" />
                    <span
                      className="relative font-heading text-[#FFDE59] text-[11px] sm:text-sm tracking-[0.2em] uppercase drop-shadow-lg"
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
                <div className="absolute right-0 inset-y-2 w-3 bg-gradient-to-l from-gray-100 to-gray-200 rounded-r-sm border-y-2 border-r-2 border-[#262625]">
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
        <svg viewBox="0 0 1440 48" className="w-full" preserveAspectRatio="none" fill="#FDF5E7">
          <path d="M0,48 L0,24 Q180,0 360,24 Q540,48 720,24 Q900,0 1080,24 Q1260,48 1440,24 L1440,48 Z" />
        </svg>
      </div>
    </section>
  );
}
