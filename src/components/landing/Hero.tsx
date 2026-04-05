"use client";

import Link from "next/link";
import { Sparkles, Star, ChevronDown } from "lucide-react";
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
                Loved by 500+ families
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
              personalized storybook in under 2 minutes.
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

                    {/* Child silhouette circle */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/15 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center mb-5">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                        <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white/80" />
                      </div>
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
