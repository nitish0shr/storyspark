"use client";

import Link from "next/link";
import { Star, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-200/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-pink-200/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-violet-400/40 animate-pulse" />
        <div className="absolute top-1/4 right-1/3 w-1.5 h-1.5 rounded-full bg-pink-400/40 animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-amber-400/40 animate-pulse [animation-delay:2s]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            {/* Social proof pill */}
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100/80 backdrop-blur-sm border border-violet-200/60 px-4 py-1.5 mb-6">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-violet-800">
                Join families creating magical stories
              </span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
              Your Child Is the{" "}
              <span className="relative">
                <span className="gradient-text">Star</span>
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 200 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 8C40 3 80 2 100 4C120 6 160 8 198 3"
                    stroke="url(#underline-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient
                      id="underline-gradient"
                      x1="0"
                      y1="0"
                      x2="200"
                      y2="0"
                    >
                      <stop stopColor="#7C3AED" />
                      <stop offset="1" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>{" "}
              of Their Own Storybook
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Upload a photo, pick an adventure, and AI creates a beautiful
              personalized storybook — ready in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <Link href="/create">
                <Button
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white font-semibold text-base px-8 py-6 shadow-xl shadow-violet-300/40 border-0 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-300/50 hover:-translate-y-0.5"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Their Book
                </Button>
              </Link>
              <a href="#sample-book">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 font-medium text-base px-6 py-6 transition-all duration-200"
                >
                  See a Sample
                  <ChevronDown className="h-4 w-4 ml-1.5" />
                </Button>
              </a>
            </div>
          </div>

          {/* Right: Book Mockup */}
          <div className="relative flex items-center justify-center lg:justify-end">
            {/* Glow behind the book */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-violet-300/30 to-pink-300/30 blur-3xl" />
            </div>

            {/* Book shape */}
            <div className="relative group">
              {/* Floating sparkles */}
              <div className="absolute -top-4 -left-4 animate-float">
                <div className="w-6 h-6 rounded-full bg-amber-300/60 blur-sm" />
              </div>
              <div className="absolute -top-2 right-8 animate-float [animation-delay:1.5s]">
                <Sparkles className="h-5 w-5 text-violet-400/70" />
              </div>
              <div className="absolute bottom-8 -left-6 animate-float [animation-delay:3s]">
                <Star className="h-4 w-4 text-pink-400/70 fill-pink-400/70" />
              </div>
              <div className="absolute -bottom-2 right-4 animate-float [animation-delay:2s]">
                <div className="w-4 h-4 rounded-full bg-violet-300/60 blur-sm" />
              </div>

              {/* Book cover */}
              <div className="relative w-64 h-80 sm:w-72 sm:h-[22rem] [transform:perspective(800px)_rotateY(-8deg)_rotateX(2deg)] group-hover:[transform:perspective(800px)_rotateY(-4deg)_rotateX(1deg)] transition-transform duration-700 ease-out">
                {/* Spine shadow */}
                <div className="absolute -left-3 inset-y-0 w-6 bg-gradient-to-r from-violet-950 to-violet-900 rounded-l-md shadow-lg" />

                {/* Cover */}
                <div className="relative w-full h-full rounded-r-lg rounded-l-sm overflow-hidden shadow-2xl shadow-violet-900/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#EC4899]" />

                  {/* Cover art */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    {/* Stars decorations */}
                    <div className="absolute top-4 left-4">
                      <Star className="h-3 w-3 text-white/30 fill-white/30" />
                    </div>
                    <div className="absolute top-8 right-6">
                      <Star className="h-2 w-2 text-white/25 fill-white/25" />
                    </div>
                    <div className="absolute bottom-12 left-8">
                      <Star className="h-2.5 w-2.5 text-white/20 fill-white/20" />
                    </div>

                    {/* Child character illustration */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/15 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center mb-5">
                      <svg viewBox="0 0 80 80" className="w-16 h-16 sm:w-20 sm:h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <radialGradient id="heroSkin" cx="40%" cy="35%">
                            <stop offset="0%" stopColor="#FED7AA" />
                            <stop offset="100%" stopColor="#FECACA" />
                          </radialGradient>
                          <radialGradient id="heroStarGlow" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="#FEF3C7" />
                            <stop offset="50%" stopColor="#FDE68A" />
                            <stop offset="100%" stopColor="#F59E0B" />
                          </radialGradient>
                          <linearGradient id="heroShirt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#C4B5FD" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                          </linearGradient>
                        </defs>
                        {/* Glowing star companion */}
                        <circle cx="60" cy="18" r="12" fill="#FBBF24" opacity="0.08" />
                        <circle cx="60" cy="18" r="8" fill="#FBBF24" opacity="0.12" />
                        <path d="M60 10L61.5 15.5L67 14L62 17.5L65 23L60 19.5L55 23L58 17.5L53 14L58.5 15.5Z" fill="url(#heroStarGlow)" />
                        <path d="M60 12L61 15.5L64 14.5L62 17L63.5 20L60 18L56.5 20L58 17L56 14.5L59 15.5Z" fill="#FEF3C7" opacity="0.4" />
                        <circle cx="58" cy="16" r="1" fill="#92400E" />
                        <circle cx="62" cy="16" r="1" fill="#92400E" />
                        <circle cx="58.5" cy="15.5" r="0.3" fill="white" />
                        <circle cx="62.5" cy="15.5" r="0.3" fill="white" />
                        <path d="M59 19C59 19 60 20 61 19" stroke="#92400E" strokeWidth="0.5" strokeLinecap="round" />
                        {/* Child head with 3D shading */}
                        <circle cx="36" cy="30" r="12" fill="url(#heroSkin)" />
                        <circle cx="32" cy="26" r="4" fill="white" opacity="0.08" />
                        {/* Hair with volume */}
                        <path d="M24 28C24 20 30 16 36 16C42 16 48 20 48 28C48 26 44 22 36 22C28 22 24 26 24 28Z" fill="#7C2D12" />
                        <path d="M26 27C26 21 31 18 36 18C41 18 46 21 46 27C46 25 42 23 36 23C30 23 26 25 26 27Z" fill="#92400E" />
                        <path d="M30 20Q33 18 36 19" fill="#A16207" opacity="0.2" />
                        {/* Eyes with highlights */}
                        <circle cx="32" cy="30" r="1.8" fill="#1E1B4B" />
                        <circle cx="40" cy="30" r="1.8" fill="#1E1B4B" />
                        <circle cx="32.5" cy="29.5" r="0.5" fill="white" />
                        <circle cx="40.5" cy="29.5" r="0.5" fill="white" />
                        {/* Rosy cheeks */}
                        <circle cx="28" cy="33" r="2.5" fill="#F9A8D4" opacity="0.35" />
                        <circle cx="44" cy="33" r="2.5" fill="#F9A8D4" opacity="0.35" />
                        {/* Smile */}
                        <path d="M33 35C33 35 36 38 39 35" stroke="#1E1B4B" strokeWidth="1" strokeLinecap="round" fill="none" />
                        {/* Shirt with 3D gradient */}
                        <path d="M24 45C24 39 30 42 36 42C42 42 48 39 48 45L50 62L22 62L24 45Z" fill="url(#heroShirt)" />
                        <path d="M26 45C26 40 31 42.5 36 42.5C38 42.5 40 42 42 41.5L42 52L26 52Z" fill="white" opacity="0.08" />
                        {/* Arms reaching up */}
                        <path d="M24 47L16 38" stroke="#FECACA" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M48 47L56 38" stroke="#FECACA" strokeWidth="4.5" strokeLinecap="round" />
                        {/* Hands with 3D */}
                        <circle cx="15" cy="37" r="3.5" fill="#FED7AA" />
                        <circle cx="14" cy="36" r="1.2" fill="white" opacity="0.12" />
                        <circle cx="57" cy="37" r="3.5" fill="#FED7AA" />
                        <circle cx="56" cy="36" r="1.2" fill="white" opacity="0.12" />
                        {/* Legs */}
                        <rect x="28" y="60" width="6" height="12" rx="3" fill="#6D28D9" opacity="0.8" />
                        <rect x="29" y="61" width="2" height="10" rx="1" fill="#7C3AED" opacity="0.3" />
                        <rect x="38" y="60" width="6" height="12" rx="3" fill="#6D28D9" opacity="0.8" />
                        <rect x="39" y="61" width="2" height="10" rx="1" fill="#7C3AED" opacity="0.3" />
                        {/* Shoes with 3D shine */}
                        <ellipse cx="31" cy="73" rx="5.5" ry="3" fill="#DC2626" />
                        <ellipse cx="30" cy="72" rx="2.5" ry="1.2" fill="#EF4444" opacity="0.4" />
                        <ellipse cx="41" cy="73" rx="5.5" ry="3" fill="#DC2626" />
                        <ellipse cx="40" cy="72" rx="2.5" ry="1.2" fill="#EF4444" opacity="0.4" />
                        {/* Sparkle trails from star */}
                        <circle cx="52" cy="25" r="1.5" fill="#FDE68A" opacity="0.5" />
                        <circle cx="52" cy="25" r="3" fill="#FDE68A" opacity="0.08" />
                        <circle cx="48" cy="22" r="1" fill="#FDE68A" opacity="0.4" />
                        <circle cx="45" cy="19" r="0.7" fill="#FDE68A" opacity="0.3" />
                      </svg>
                    </div>

                    <h3 className="font-heading text-white text-lg sm:text-xl font-bold leading-tight mb-1.5">
                      Your Child&apos;s
                      <br />
                      Adventure
                    </h3>
                    <div className="w-12 h-0.5 bg-white/30 rounded-full mb-2" />
                    <p className="text-white/60 text-xs font-medium tracking-wider uppercase">
                      A StorySpark Book
                    </p>
                  </div>

                  {/* Glossy reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                </div>

                {/* Pages edge */}
                <div className="absolute right-0 inset-y-2 w-2 bg-gradient-to-l from-gray-100 to-gray-200 rounded-r-sm">
                  <div className="absolute inset-0 flex flex-col justify-evenly px-px">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-px bg-gray-300/60" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating animation keyframes */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(3deg);
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
