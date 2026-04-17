"use client";

import Link from "next/link";
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
              Upload one photo of your child, pick a magical adventure, and watch AI
              create a <strong>beautiful personalized storybook</strong> with them
              as the hero — ready in minutes! 🚀
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
                { emoji: "🔒", text: "Photo stays private" },
                { emoji: "⚡", text: "Ready in 2 min" },
                { emoji: "💯", text: "30-day guarantee" },
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
                  {/* Cover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#9B59B6] via-[#7B2D8B] to-[#5A1E73]" />

                  {/* Polka dots pattern */}
                  <div className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: "radial-gradient(circle, white 2px, transparent 2px)",
                      backgroundSize: "18px 18px",
                    }}
                  />

                  {/* Cover content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    {/* Rainbow arc at top */}
                    <div className="absolute top-4 left-0 right-0 flex justify-center">
                      <svg viewBox="0 0 200 40" className="w-40 h-8 opacity-40" fill="none">
                        <path d="M10 35 Q100 -10 190 35" stroke="#FF6B6B" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M18 35 Q100 0 182 35" stroke="#FFD166" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M26 35 Q100 8 174 35" stroke="#06D6A0" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M34 35 Q100 16 166 35" stroke="#4FC3F7" strokeWidth="6" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Child avatar circle */}
                    <div className="relative w-28 h-28 rounded-full bg-white/20 border-3 border-white/40 flex items-center justify-center mb-4"
                      style={{ border: "3px solid rgba(255,255,255,0.5)" }}
                    >
                      <svg viewBox="0 0 80 80" className="w-20 h-20" fill="none">
                        <defs>
                          <radialGradient id="skin" cx="40%" cy="35%">
                            <stop offset="0%" stopColor="#FED7AA" />
                            <stop offset="100%" stopColor="#FECACA" />
                          </radialGradient>
                          <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FFD166" />
                            <stop offset="100%" stopColor="#FF9F1C" />
                          </linearGradient>
                        </defs>
                        <circle cx="36" cy="30" r="13" fill="url(#skin)" />
                        <path d="M23 28C23 19 30 15 36 15C42 15 49 19 49 28C49 26 44 22 36 22C28 22 23 26 23 28Z" fill="#7C2D12" />
                        <circle cx="31" cy="30" r="2" fill="#1E1B4B" />
                        <circle cx="41" cy="30" r="2" fill="#1E1B4B" />
                        <circle cx="31.5" cy="29.5" r="0.6" fill="white" />
                        <circle cx="41.5" cy="29.5" r="0.6" fill="white" />
                        <circle cx="27" cy="33" r="3" fill="#F9A8D4" opacity="0.4" />
                        <circle cx="45" cy="33" r="3" fill="#F9A8D4" opacity="0.4" />
                        <path d="M32 36C32 36 36 40 40 36" stroke="#1E1B4B" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                        <path d="M22 46C22 40 29 43 36 43C43 43 50 40 50 46L52 64L20 64L22 46Z" fill="url(#shirt)" />
                        <path d="M22 48L14 38" stroke="#FECACA" strokeWidth="5" strokeLinecap="round" />
                        <path d="M50 48L58 38" stroke="#FECACA" strokeWidth="5" strokeLinecap="round" />
                        <circle cx="13" cy="37" r="4" fill="#FED7AA" />
                        <circle cx="59" cy="37" r="4" fill="#FED7AA" />
                        <rect x="27" y="62" width="7" height="13" rx="3.5" fill="#7B2D8B" />
                        <rect x="38" y="62" width="7" height="13" rx="3.5" fill="#7B2D8B" />
                        <ellipse cx="30.5" cy="75" rx="6" ry="3.5" fill="#FF6B6B" />
                        <ellipse cx="41.5" cy="75" rx="6" ry="3.5" fill="#FF6B6B" />
                        {/* Cape */}
                        <path d="M22 46 Q18 58 16 70 Q28 65 36 68 Q44 65 56 70 Q54 58 50 46" fill="#FF6B6B" opacity="0.7" />
                      </svg>
                    </div>

                    {/* Stars row */}
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-[#FFD166] fill-[#FFD166]" />
                      ))}
                    </div>

                    <h3 className="font-heading text-white text-lg font-bold leading-tight mb-1">
                      Your Child&apos;s<br />Adventure
                    </h3>
                    <div className="w-12 h-1 bg-white/40 rounded-full mx-auto mb-2" />
                    <p className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase">
                      A Starmee Book
                    </p>
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
