"use client";

const stats = [
  { emoji: "✨", value: "500+", label: "Books Created", bg: "bg-[#FFD166]" },
  { emoji: "⭐", value: "4.9/5", label: "Star Rating", bg: "bg-[#FF6B6B] text-white" },
  { emoji: "⚡", value: "< 2 min", label: "To Create", bg: "bg-[#06D6A0]" },
  { emoji: "💯", value: "100%", label: "Happiness Guaranteed", bg: "bg-[#C3B1E1]" },
];

export default function Stats() {
  return (
    <section className="bg-[#FFFBF0] py-8 border-b-[2.5px] border-[#1a1a2e]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`${s.bg} card-chunky flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-4 py-3 text-center sm:text-left`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <div>
                <div className="font-heading font-bold text-xl text-[#1a1a2e]">{s.value}</div>
                <div className="font-body text-xs font-bold text-[#1a1a2e]/70">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
