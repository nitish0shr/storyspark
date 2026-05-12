"use client";

const stats = [
  { emoji: "✨", value: "500+", label: "Books Created", bg: "bg-[#06D6A0]" },
  { emoji: "⚡", value: "~2 min", label: "Preview Ready", bg: "bg-[#CB6CE6]" },
  { emoji: "🔒", value: "Private", label: "Photo Stays Safe", bg: "bg-[#FFDE59]" },
  { emoji: "💳", value: "Free", label: "Preview First", bg: "bg-[#5E17EB] text-white" },
];

export default function Stats() {
  return (
    <section className="bg-[#FDF5E7] py-8 border-b-[2.5px] border-[#262625]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`${s.bg} card-chunky flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-4 py-3 text-center sm:text-left`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <div>
                <div className="font-heading font-bold text-xl text-[#262625]">{s.value}</div>
                <div className="font-body text-xs font-bold text-[#262625]/70">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
