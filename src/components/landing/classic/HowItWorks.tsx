"use client";

import { Camera, Palette, BookOpen } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Upload a Photo",
    description:
      "Just one clear photo of your child's face. Our AI analyzes their features — hair color, skin tone, eye color — to create illustrations that actually look like them.",
    accent: "from-violet-500 to-violet-700",
    glow: "shadow-violet-200",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    numColor: "text-violet-200",
    tag: "30 seconds",
  },
  {
    number: "02",
    icon: Palette,
    title: "Pick an Adventure",
    description:
      "Choose from 6 magical themes: Space Explorer, Dino World, Ocean Depths, Enchanted Castle, Superhero City, or Magic Forest. Then personalize the story with your child's details.",
    accent: "from-pink-500 to-violet-600",
    glow: "shadow-pink-200",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    numColor: "text-pink-200",
    tag: "1 minute",
  },
  {
    number: "03",
    icon: BookOpen,
    title: "Get Their Book",
    description:
      "AI writes a unique 12-page story and generates beautiful illustrations with your child as the star. Download, share, or print your personalized storybook instantly.",
    accent: "from-amber-400 to-pink-500",
    glow: "shadow-amber-200",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    numColor: "text-amber-200",
    tag: "Instant PDF",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative bg-[#FFFBF5]">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700">
              Simple as 1-2-3
            </span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            How It Works
          </h2>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            From photo to personalized storybook in under 2 minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-[4.5rem] left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px">
            <div className="w-full h-full bg-gradient-to-r from-violet-300 via-pink-300 to-amber-300 opacity-40" />
            <div
              className="absolute inset-0 bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 opacity-20 blur-sm"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative group">
                {/* Card */}
                <div className="relative rounded-2xl bg-white border border-gray-100/80 p-7 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/40 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                  {/* Background number watermark */}
                  <div
                    className="absolute -top-4 -right-2 font-heading font-bold text-[7rem] leading-none select-none pointer-events-none"
                    style={{ color: "rgba(124,58,237,0.04)" }}
                  >
                    {step.number}
                  </div>

                  {/* Step number + Icon row */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center shadow-lg ${step.glow} group-hover:scale-110 transition-transform duration-300`}
                      >
                        <step.icon className="h-6 w-6 text-white" />
                      </div>
                      {/* Step number badge */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center shadow-sm">
                        <span className="text-[10px] font-bold text-gray-600">{index + 1}</span>
                      </div>
                    </div>
                    {/* Tag chip */}
                    <div className={`text-xs font-semibold ${step.iconColor} ${step.iconBg} rounded-full px-3 py-1`}>
                      {step.tag}
                    </div>
                  </div>

                  <h3 className="font-heading text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {step.description}
                  </p>

                  {/* Bottom accent line on hover */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${step.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            No account needed to start
          </div>
          <div className="hidden sm:block w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Works on any device
          </div>
          <div className="hidden sm:block w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            Photo kept private & secure
          </div>
        </div>
      </div>
    </section>
  );
}
