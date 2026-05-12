"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

const MESSAGES = [
  "✨ Bringing your child's adventure to life...",
  "🎨 Our AI artist is painting the scene...",
  "⭐ Adding some magic to the illustration...",
  "🖌️ Almost there — finishing the final details...",
];

export default function PreviewLoadingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [messageIdx, setMessageIdx] = useState(0);
  const [dots, setDots] = useState(".");
  const [elapsed, setElapsed] = useState(0);
  const [failed, setFailed] = useState(false);

  // Rotate messages every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx((i) => (i + 1) % MESSAGES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Poll status every 4 seconds
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 4000));
        setElapsed((e) => e + 4);

        try {
          const res = await fetch(`/api/preview-status/${id}`);
          if (!res.ok) {
            setFailed(true);
            return;
          }
          const data = await res.json();

          if (data.status === "ready") {
            router.replace(`/preview/result/${id}`);
            return;
          }
          if (data.status === "failed") {
            setFailed(true);
            return;
          }
          // pending / generating → keep polling
        } catch {
          // Network error — keep trying
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (failed) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">😟</div>
        <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">Something went wrong</h2>
        <p className="text-sm text-[#6b6b8a] mb-6 max-w-xs">
          Our artist hit a snag. No worries — try again and we'll get it right!
        </p>
        <a
          href="/preview/start"
          className="bg-[#E8417A] hover:bg-[#d43570] text-white font-bold px-8 py-3 rounded-2xl transition-colors"
        >
          Try Again
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex flex-col items-center justify-center px-4 text-center">
      {/* Stars background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {["top-10 left-8", "top-20 right-12", "top-1/3 left-4", "top-1/4 right-6",
          "bottom-1/3 left-10", "bottom-20 right-8"].map((pos, i) => (
          <span
            key={i}
            className={`absolute text-[#E8417A]/20 text-2xl animate-pulse select-none absolute ${pos}`}
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            ⭐
          </span>
        ))}
      </div>

      {/* Main spinner area */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full border-4 border-pink-100 border-t-[#E8417A] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-4xl">
          🎨
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-3">
        Creating your preview{dots}
      </h1>
      <p className="text-sm text-[#6b6b8a] max-w-xs leading-relaxed">
        {MESSAGES[messageIdx]}
      </p>

      {elapsed > 90 && (
        <p className="text-xs text-[#9a9aaa] mt-6 max-w-xs">
          Taking a little longer than usual — almost there!
        </p>
      )}

      <div className="mt-10 grid grid-cols-3 gap-3 text-xs text-[#6b6b8a] max-w-xs">
        <div className="bg-white rounded-xl p-2.5 shadow-sm text-center">
          <div className="text-base">⚡</div>Usually ~2 min
        </div>
        <div className="bg-white rounded-xl p-2.5 shadow-sm text-center">
          <div className="text-base">🔒</div>Photo private
        </div>
        <div className="bg-white rounded-xl p-2.5 shadow-sm text-center">
          <div className="text-base">💳</div>Free preview
        </div>
      </div>
    </div>
  );
}
