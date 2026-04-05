"use client";

import { Camera, BookOpen, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Upload a Photo",
    description: "Just one clear photo of your child's face",
    gradient: "from-violet-500 to-violet-600",
    shadow: "shadow-violet-200/60",
  },
  {
    icon: BookOpen,
    title: "Pick an Adventure",
    description: "Choose from 6 magical themes",
    gradient: "from-violet-500 to-pink-500",
    shadow: "shadow-pink-200/60",
  },
  {
    icon: Sparkles,
    title: "Get Their Book",
    description: "AI creates a beautiful storybook in minutes",
    gradient: "from-pink-500 to-pink-600",
    shadow: "shadow-pink-200/60",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600 mb-3">
            Simple as 1-2-3
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            It takes less than 2 minutes to create a personalized storybook.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5">
            <div className="w-full h-full bg-gradient-to-r from-violet-300 via-pink-300 to-pink-300 rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-300 via-pink-300 to-pink-300 rounded-full blur-sm opacity-40" />
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center group"
              >
                {/* Step number badge */}
                <div className="absolute -top-2 -right-2 md:top-0 md:right-auto md:left-[calc(50%+20px)] w-7 h-7 rounded-full bg-white border-2 border-violet-200 flex items-center justify-center z-10 shadow-sm">
                  <span className="text-xs font-bold text-violet-600">
                    {index + 1}
                  </span>
                </div>

                {/* Icon circle */}
                <div
                  className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-5 shadow-lg ${step.shadow} group-hover:scale-110 transition-transform duration-300`}
                >
                  <step.icon className="h-9 w-9 text-white" />
                  <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Text */}
                <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm max-w-[200px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
