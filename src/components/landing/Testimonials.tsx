import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "My daughter couldn't believe she was in the story! She's made us read it every night.",
    name: "Sarah M.",
    detail: "Mom of a 4-year-old",
    stars: 5,
  },
  {
    quote:
      "The illustrations are incredible \u2014 they actually look like my son! Best birthday gift ever.",
    name: "David L.",
    detail: "Dad of a 6-year-old",
    stars: 5,
  },
  {
    quote:
      "I bought one for each of my grandkids. They're fighting over who has the best adventure!",
    name: "Linda K.",
    detail: "Grandma of 3",
    stars: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600 mb-3">
            Happy Families
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Parents Love StorySpark
          </h2>
        </div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, index) => (
            <Card
              key={index}
              className="relative group overflow-hidden border-violet-100/60 bg-white/80 backdrop-blur-sm hover:shadow-lg hover:shadow-violet-100/40 transition-all duration-300 p-6"
            >
              {/* Accent top border on hover */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Quote icon */}
              <div className="mb-4">
                <Quote className="h-8 w-8 text-violet-200" />
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.stars)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-gray-700 leading-relaxed mb-5 text-sm">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-violet-50">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-200 to-pink-200 flex items-center justify-center text-xs font-bold text-violet-700">
                  {t.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.detail}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
