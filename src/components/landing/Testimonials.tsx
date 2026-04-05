"use client";

import { Shield, Clock, CreditCard } from "lucide-react";

const trustPoints = [
  {
    icon: Clock,
    title: "Preview in about 2 minutes",
    description: "See your child's personalized preview before you commit to anything.",
    bg: "bg-[#FFD166]",
  },
  {
    icon: Shield,
    title: "Photo stays private",
    description: "Your child's photo is used only for illustrations and is never shared.",
    bg: "bg-[#DCFBF2]",
  },
  {
    icon: CreditCard,
    title: "No credit card needed",
    description: "Get a free preview first. Only pay when you love the result.",
    bg: "bg-[#C3B1E1]",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 sm:py-28 bg-[#FFF9E6] bg-dots relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-block bg-[#06D6A0] border-2 border-[#1a1a2e] rounded-full px-5 py-1.5 shadow-[3px_3px_0px_#1a1a2e] mb-5">
            <span className="font-body font-bold text-sm text-[#1a1a2e]">Why parents love it 💛</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a2e] mb-4">
            Built for Families
          </h2>
          <p className="font-body text-lg text-[#1a1a2e]/60 max-w-md mx-auto">
            Every kid deserves to be the star of their own story!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className={`${point.bg} card-chunky p-6 flex flex-col items-center text-center gap-4`}
            >
              <div className="w-14 h-14 rounded-full bg-white border-2 border-[#1a1a2e] flex items-center justify-center shadow-[3px_3px_0px_#1a1a2e]">
                <point.icon className="h-6 w-6 text-[#1a1a2e]" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#1a1a2e]">
                {point.title}
              </h3>
              <p className="font-body text-sm text-[#1a1a2e]/70 leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 48" className="w-full" preserveAspectRatio="none" fill="#C3B1E1">
          <path d="M0,48 L0,20 Q360,50 720,20 Q1080,-10 1440,30 L1440,48 Z" />
        </svg>
      </div>
    </section>
  );
}
