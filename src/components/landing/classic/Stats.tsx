"use client";

import { Sparkles, Star, Clock, ShieldCheck } from "lucide-react";

const stats = [
  {
    icon: Sparkles,
    value: "500+",
    label: "Books Created",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Star,
    value: "4.9",
    label: "Average Rating",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Clock,
    value: "< 2 min",
    label: "To Create",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: ShieldCheck,
    value: "100%",
    label: "Satisfaction Guaranteed",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

export default function Stats() {
  return (
    <section className="bg-[#FFFBF5] py-8 border-b border-violet-100/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col sm:flex-row items-center sm:items-center gap-3 group"
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-center sm:text-left">
                <div className={`text-xl sm:text-2xl font-bold font-heading ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 leading-tight">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
