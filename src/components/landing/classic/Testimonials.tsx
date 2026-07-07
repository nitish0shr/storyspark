"use client";

import { Shield, Clock, CreditCard } from "lucide-react";

const trustPoints = [
  {
    icon: Clock,
    title: "Preview in about 2 minutes",
    description: "See your child's personalised preview before you commit to anything.",
    gradient: "from-violet-500 to-purple-600",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    icon: Shield,
    title: "Photo stays private",
    description: "Your child's photo is used only for illustrations and is never shared.",
    gradient: "from-pink-500 to-rose-600",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    icon: CreditCard,
    title: "No credit card needed",
    description: "Get a free preview first. Only pay when you love the result.",
    gradient: "from-amber-400 to-orange-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-[#FFFBF5] to-violet-50/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-violet-100/40 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-pink-100/40 blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700">
              Why Parents Love It
            </span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            Built for Families
          </h2>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            Every kid deserves to be the star of their own story!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className="group relative rounded-2xl bg-white border border-gray-100 p-8 hover:border-violet-200/60 hover:shadow-xl hover:shadow-violet-100/30 transition-all duration-400 hover:-translate-y-0.5 text-center"
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${point.gradient} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className={`w-14 h-14 rounded-2xl ${point.iconBg} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <point.icon className={`h-6 w-6 ${point.iconColor}`} />
              </div>

              <h3 className="font-heading text-lg font-bold text-gray-900 mb-3">
                {point.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
