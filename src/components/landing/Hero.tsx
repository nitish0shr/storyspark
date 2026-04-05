"use client";

import Link from "next/link";
import { Star, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const floatingPages = [
  { top: "12%", left: "8%", rotate: "-12deg", delay: "0s", scale: 0.75, theme: "space" },
  { top: "60%", left: "4%", rotate: "8deg", delay: "1.5s", scale: 0.65, theme: "ocean" },
  { top: "18%", right: "6%", rotate: "10deg", delay: "0.8s", scale: 0.7, theme: "castle" },
  { top: "65%", right: "5%", rotate: "-6deg", delay: "2.2s", scale: 0.6, theme: "dino" },
];

const pageColors: Record<string, { bg: string; accent: string }> = {
  space: { bg: "from-[#1E1B4B] to-[#4C1D95]", accent: "#A78BFA" },
  ocean: { bg: "from-[#0C4A6E] to-[#0EA5E9]", accent: "#7DD3FC" },
  castle: { bg: "from-[#3B0764] to-[#7E22CE]", accent: "#E9D5FF" },
  dino: { bg: "from-[#064E3B] to-[#16A34A]", accent: "#86EFAC" },
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Deep cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D0720] via-[#160B33] to-[#1A0540]" />

      {/* Layered glow orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full bg-pink-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[300px] rounded-full bg-blue-600/8 blur-[80px] pointer-events-none" />

      {/* Animated star field */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          [8,12],[15,45],[22,28],[35,8],[42,55],[50,22],[58,40],[65,15],[72,60],[80,30],
          [88,8],[92,48],[5,72],[18,82],[30,68],[45,78],[60,72],[75,85],[85,65],[95,75],
          [12,35],[25,62],[38,18],[52,48],[68,25],[78,50],[90,20],[3,52],[48,5],[55,88],
        ].map(([x, y], i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: i % 5 === 0 ? "3px" : i % 3 === 0 ? "2px" : "1.5px",
              height: i % 5 === 0 ? "3px" : i % 3 === 0 ? "2px" : "1.5px",
              animationDelay: `${(i * 0.23) % 3}s`,
              animationDuration: `${2 + (i * 0.17) % 2}s`,
              opacity: 0.3 + (i % 4) * 0.15,
            }}
          />
        ))}
      </div>

      {/* Floating mini book pages in background */}
      {floatingPages.map((page, i) => {
        const colors = pageColors[page.theme];
        return (
          <div
            key={i}
            className="absolute hidden lg:flex animate-float-slow"
            style={{
              top: page.top,
              left: (page as { left?: string }).left,
              right: (page as { right?: string }).right,
              transform: `rotate(${page.rotate}) scale(${page.scale})`,
              animationDelay: page.delay,
              zIndex: 1,
            }}
          >
            <div
              className={`w-28 h-36 rounded-lg bg-gradient-to-br ${colors.bg} shadow-2xl border border-white/10 flex flex-col items-center justify-center gap-2 opacity-60`}
            >
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                <Sparkles className="h-4 w-4" style={{ color: colors.accent }} />
              </div>
              <div className="w-12 h-1 rounded-full bg-white/20" />
              <div className="w-8 h-0.5 rounded-full bg-white/15" />
            </div>
          </div>
        );
      })}

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Text */}
          <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 mb-8">
              <div className="flex -space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs font-semibold text-white/90 tracking-wide">
                Loved by 500+ families
              </span>
            </div>

            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
              <span className="text-white">Your Child Is</span>
              <br />
              <span className="text-white">the </span>
              <span className="relative inline-block">
                <span className="gradient-text-light bg-gradient-to-r from-violet-300 via-pink-300 to-amber-300 bg-clip-text text-transparent animate-gradient-shift">
                  Star
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 10"
                  fill="none"
                >
                  <path
                    d="M2 6C40 2 80 1 100 3C120 5 160 7 198 2"
                    stroke="url(#hero-underline)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="hero-underline" x1="0" y1="0" x2="200" y2="0">
                      <stop stopColor="#A78BFA" />
                      <stop offset="0.5" stopColor="#F9A8D4" />
                      <stop offset="1" stopColor="#FCD34D" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <br />
              <span className="text-white/90">of Their Story</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/60 leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0">
              Upload one photo. Pick a magical theme. AI creates a stunning,
              personalized storybook with your child as the hero — ready in minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/create">
                <Button
                  size="lg"
                  className="group rounded-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 text-white font-bold text-base px-8 py-7 shadow-2xl shadow-violet-900/50 border-0 transition-all duration-300 hover:shadow-violet-500/40 hover:-translate-y-0.5 hover:scale-[1.02]"
                >
                  <Sparkles className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  Create Their Book
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              <a href="#sample-book">
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-full text-white/70 hover:text-white hover:bg-white/10 font-medium text-base px-6 py-7 transition-all duration-200 border border-white/20 hover:border-white/40"
                >
                  See a Sample
                </Button>
              </a>
            </div>

            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 justify-center lg:justify-start">
              {[
                { label: "No signup required" },
                { label: "Ready in 2 minutes" },
                { label: "30-day guarantee" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-sm text-white/50">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D Book Mockup */}
          <div className="relative flex items-center justify-center lg:justify-end">
            {/* Ambient glow under book */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-80 h-80 rounded-full bg-gradient-to-br from-violet-500/25 to-pink-500/20 blur-[80px] animate-pulse-glow" />
            </div>

            {/* Book */}
            <div className="relative group animate-book-float">
              {/* Floating sparkles around book */}
              <div className="absolute -top-6 -left-8 animate-drift" style={{ animationDelay: "0.5s" }}>
                <div className="w-8 h-8 rounded-full bg-violet-400/30 blur-sm" />
              </div>
              <div className="absolute -top-3 right-6 animate-drift" style={{ animationDelay: "1.2s" }}>
                <Sparkles className="h-6 w-6 text-amber-300/80" />
              </div>
              <div className="absolute bottom-12 -left-10 animate-drift" style={{ animationDelay: "2.8s" }}>
                <Star className="h-5 w-5 text-pink-300/80 fill-pink-300/80" />
              </div>
              <div className="absolute -bottom-4 right-10 animate-drift" style={{ animationDelay: "1.8s" }}>
                <div className="w-5 h-5 rounded-full bg-pink-400/30 blur-sm" />
              </div>
              <div className="absolute top-1/3 -right-12 animate-drift" style={{ animationDelay: "3.5s" }}>
                <Star className="h-4 w-4 text-violet-300/60 fill-violet-300/60" />
              </div>

              {/* Book container with 3D perspective */}
              <div className="relative w-72 h-[22rem] sm:w-80 sm:h-96 [transform:perspective(1000px)_rotateY(-12deg)_rotateX(3deg)]">
                {/* Book spine shadow */}
                <div className="absolute -left-4 inset-y-1 w-8 bg-gradient-to-r from-[#0D0720] via-violet-950 to-violet-900 rounded-l-md shadow-2xl" />

                {/* Cover */}
                <div className="relative w-full h-full rounded-r-2xl rounded-l-sm overflow-hidden shadow-[0_40px_80px_rgba(124,58,237,0.5),0_20px_40px_rgba(0,0,0,0.6)]">
                  {/* Cover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#6D28D9] via-[#7C3AED] to-[#DB2777]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/5" />

                  {/* Cover art */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-7 text-center">
                    {/* Decorative stars */}
                    {[[16,16,3],[32,12,2],[260,20,2.5],[246,14,2]].map(([x,y,r],i) => (
                      <div
                        key={i}
                        className="absolute"
                        style={{ left: x, top: y }}
                      >
                        <Star
                          className="text-white/25 fill-white/25"
                          style={{ width: r * 4, height: r * 4 }}
                        />
                      </div>
                    ))}

                    {/* Child illustration circle */}
                    <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-white/15 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center mb-6 shadow-inner">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
                      <svg viewBox="0 0 80 80" className="w-20 h-20 sm:w-24 sm:h-24" fill="none">
                        <defs>
                          <radialGradient id="heroSkin2" cx="40%" cy="35%">
                            <stop offset="0%" stopColor="#FED7AA" />
                            <stop offset="100%" stopColor="#FECACA" />
                          </radialGradient>
                          <radialGradient id="heroStarGlow2" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="#FEF3C7" />
                            <stop offset="50%" stopColor="#FDE68A" />
                            <stop offset="100%" stopColor="#F59E0B" />
                          </radialGradient>
                          <linearGradient id="heroShirt2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#C4B5FD" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                          </linearGradient>
                        </defs>
                        <circle cx="60" cy="18" r="12" fill="#FBBF24" opacity="0.08" />
                        <path d="M60 10L61.5 15.5L67 14L62 17.5L65 23L60 19.5L55 23L58 17.5L53 14L58.5 15.5Z" fill="url(#heroStarGlow2)" />
                        <circle cx="36" cy="30" r="12" fill="url(#heroSkin2)" />
                        <path d="M24 28C24 20 30 16 36 16C42 16 48 20 48 28C48 26 44 22 36 22C28 22 24 26 24 28Z" fill="#7C2D12" />
                        <path d="M26 27C26 21 31 18 36 18C41 18 46 21 46 27C46 25 42 23 36 23C30 23 26 25 26 27Z" fill="#92400E" />
                        <circle cx="32" cy="30" r="1.8" fill="#1E1B4B" />
                        <circle cx="40" cy="30" r="1.8" fill="#1E1B4B" />
                        <circle cx="32.5" cy="29.5" r="0.5" fill="white" />
                        <circle cx="40.5" cy="29.5" r="0.5" fill="white" />
                        <circle cx="28" cy="33" r="2.5" fill="#F9A8D4" opacity="0.35" />
                        <circle cx="44" cy="33" r="2.5" fill="#F9A8D4" opacity="0.35" />
                        <path d="M33 35C33 35 36 38 39 35" stroke="#1E1B4B" strokeWidth="1" strokeLinecap="round" fill="none" />
                        <path d="M24 45C24 39 30 42 36 42C42 42 48 39 48 45L50 62L22 62L24 45Z" fill="url(#heroShirt2)" />
                        <path d="M24 47L16 38" stroke="#FECACA" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M48 47L56 38" stroke="#FECACA" strokeWidth="4.5" strokeLinecap="round" />
                        <circle cx="15" cy="37" r="3.5" fill="#FED7AA" />
                        <circle cx="57" cy="37" r="3.5" fill="#FED7AA" />
                        <rect x="28" y="60" width="6" height="12" rx="3" fill="#6D28D9" opacity="0.8" />
                        <rect x="38" y="60" width="6" height="12" rx="3" fill="#6D28D9" opacity="0.8" />
                        <ellipse cx="31" cy="73" rx="5.5" ry="3" fill="#DC2626" />
                        <ellipse cx="41" cy="73" rx="5.5" ry="3" fill="#DC2626" />
                      </svg>
                    </div>

                    <h3 className="font-heading text-white text-xl sm:text-2xl font-bold leading-tight mb-2 drop-shadow-lg">
                      Your Child&apos;s
                      <br />
                      Adventure
                    </h3>
                    <div className="w-16 h-0.5 bg-white/30 rounded-full mx-auto mb-3" />
                    <p className="text-white/50 text-xs font-semibold tracking-[0.2em] uppercase">
                      A StorySpark Book
                    </p>
                  </div>

                  {/* Glossy overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-white/3 to-transparent" />
                  {/* Shimmer sweep */}
                  <div className="absolute inset-0 animate-shimmer opacity-60" />
                </div>

                {/* Page edges */}
                <div className="absolute right-0 inset-y-2 w-3 bg-gradient-to-l from-gray-50 to-gray-100 rounded-r-sm shadow-inner">
                  <div className="absolute inset-0 flex flex-col justify-evenly px-px">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="h-px bg-gray-300/60" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Reflection / shadow */}
              <div className="absolute -bottom-8 left-4 right-8 h-12 bg-violet-900/30 blur-xl rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave transition to light */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[#FFFBF5] pointer-events-none" />
    </section>
  );
}
