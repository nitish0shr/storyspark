"use client";

import { Star, Quote, Heart } from "lucide-react";

const testimonials = [
  {
    quote:
      "My daughter couldn't believe she was in the story! She made us read it every single night for a week.",
    name: "Sarah M.",
    role: "Mom of a 4-year-old",
    initials: "SM",
    from: "New York",
    theme: "Magic Forest",
    stars: 5,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    quote:
      "The illustrations are incredible — they actually look like my son! Best birthday gift I've ever given.",
    name: "David L.",
    role: "Dad of a 6-year-old",
    initials: "DL",
    from: "California",
    theme: "Space Adventure",
    stars: 5,
    gradient: "from-pink-500 to-rose-600",
  },
  {
    quote:
      "I bought one for each of my grandkids. They're fighting over who has the best adventure story!",
    name: "Linda K.",
    role: "Grandma of 3",
    initials: "LK",
    from: "Texas",
    theme: "Enchanted Castle",
    stars: 5,
    gradient: "from-amber-400 to-orange-500",
  },
  {
    quote:
      "I was skeptical but the quality blew me away. The story felt hand-written for my kid specifically.",
    name: "Jessica R.",
    role: "Mom of a 5-year-old",
    initials: "JR",
    from: "Florida",
    theme: "Ocean Depths",
    stars: 5,
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    quote:
      "My son kept pointing at the illustrations saying 'that's me! that's me!' Absolutely magical moment.",
    name: "Marcus T.",
    role: "Dad of a 7-year-old",
    initials: "MT",
    from: "Illinois",
    theme: "Superhero City",
    stars: 5,
    gradient: "from-red-500 to-pink-600",
  },
  {
    quote:
      "Perfect gift idea. My niece has read her book so many times the pages are starting to wear out.",
    name: "Amy C.",
    role: "Auntie of a 3-year-old",
    initials: "AC",
    from: "Washington",
    theme: "Dino World",
    stars: 5,
    gradient: "from-emerald-500 to-green-600",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-[#FFFBF5] to-violet-50/30 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-violet-100/40 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-pink-100/40 blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-4 py-1.5 mb-5">
            <Heart className="h-3.5 w-3.5 text-pink-500 fill-pink-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-pink-700">
              Happy Families
            </span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            Parents Love Starmee
          </h2>
          {/* Aggregate stars */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <p className="text-sm text-gray-500">
            4.9 out of 5 · Based on 500+ books created
          </p>
        </div>

        {/* Testimonial grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="group relative rounded-2xl bg-white border border-gray-100 p-6 hover:border-violet-200/60 hover:shadow-xl hover:shadow-violet-100/30 transition-all duration-400 hover:-translate-y-0.5"
            >
              {/* Gradient accent line */}
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${t.gradient} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Quote mark */}
              <Quote className="h-7 w-7 text-violet-100 mb-4 fill-violet-100" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.stars)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 leading-relaxed text-sm mb-5 flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Theme tag */}
              <div className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${t.gradient} px-3 py-1 mb-4`}>
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                  {t.theme}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-xs font-bold text-white shadow-md flex-shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role} · {t.from}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
