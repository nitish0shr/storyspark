"use client";

const steps = [
  {
    number: "1",
    emoji: "📸",
    title: "Upload a Photo",
    description:
      "Just one clear, happy photo of your child's face. Our AI studies their features — hair color, eye color, skin tone — to make the book look just like them!",
    bg: "bg-[#FFD166]",
    border: "border-[#1a1a2e]",
    numBg: "bg-[#FF9F1C]",
  },
  {
    number: "2",
    emoji: "🗺️",
    title: "Pick an Adventure",
    description:
      "Choose from 6 magical worlds: Space Explorer, Dino Land, Ocean Adventure, Enchanted Castle, Superhero City, or Magic Forest. Then add your child's name and fun details!",
    bg: "bg-[#C3B1E1]",
    border: "border-[#1a1a2e]",
    numBg: "bg-[#7B2D8B]",
  },
  {
    number: "3",
    emoji: "🎉",
    title: "Get Their Book!",
    description:
      "In just 2 minutes, AI writes a unique 12-page story and creates beautiful illustrations with your child as the star. Download, print, or share instantly!",
    bg: "bg-[#DCFBF2]",
    border: "border-[#1a1a2e]",
    numBg: "bg-[#06D6A0]",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-[#FFFBF0] relative">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-[#FF6B6B] border-2 border-[#1a1a2e] rounded-full px-5 py-1.5 shadow-[3px_3px_0px_#1a1a2e] mb-5">
            <span className="font-body font-bold text-sm text-white">Super simple! 🎈</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a2e] mb-4">
            How It Works
          </h2>
          <p className="font-body text-lg text-[#1a1a2e]/60 max-w-md mx-auto">
            From upload to storybook in under 2 minutes. Promise! 🤞
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Connector arrow (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 -right-4 z-10 font-heading text-3xl font-bold text-[#1a1a2e]/30">
                  →
                </div>
              )}

              <div
                className={`${step.bg} card-chunky p-6 flex flex-col items-center text-center h-full`}
              >
                {/* Number bubble */}
                <div
                  className={`${step.numBg} w-14 h-14 rounded-full border-2 border-[#1a1a2e] flex items-center justify-center mb-4 shadow-[3px_3px_0px_#1a1a2e] -mt-2`}
                >
                  <span className="font-heading font-bold text-2xl text-white">{step.number}</span>
                </div>

                {/* Big emoji */}
                <div className="text-5xl mb-4 animate-bounce-gentle" style={{ animationDelay: `${i * 0.4}s` }}>
                  {step.emoji}
                </div>

                <h3 className="font-heading font-bold text-xl text-[#1a1a2e] mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-[#1a1a2e]/70 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white border-2 border-dashed border-[#1a1a2e]/30 rounded-2xl px-6 py-3">
            <span className="text-lg">🎁</span>
            <span className="font-body font-bold text-sm text-[#1a1a2e]/60">
              No account needed to get started! Just jump right in.
            </span>
          </div>
        </div>
      </div>

      {/* Wave to next section */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 48" className="w-full" preserveAspectRatio="none" fill="#FFF4CC">
          <path d="M0,48 L0,30 Q360,0 720,30 Q1080,60 1440,20 L1440,48 Z" />
        </svg>
      </div>
    </section>
  );
}
