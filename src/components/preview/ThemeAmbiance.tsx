"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ThemeAmbianceProps {
  themeId?: string;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  drift: number;
  char: string;
}

const THEME_PARTICLES: Record<string, { chars: string[]; colors: string[] }> = {
  "space-adventure": {
    chars: ["✦", "★", "✧", "·"],
    colors: ["#818CF8", "#A78BFA", "#C4B5FD", "#E0E7FF"],
  },
  "dinosaur-discovery": {
    chars: ["🌿", "✿", "❋", "·"],
    colors: ["#34D399", "#6EE7B7", "#A7F3D0", "#D1FAE5"],
  },
  "under-the-sea": {
    chars: ["○", "◦", "·", "◯"],
    colors: ["#67E8F9", "#22D3EE", "#A5F3FC", "#CFFAFE"],
  },
  "royal-quest": {
    chars: ["✦", "♦", "✧", "·"],
    colors: ["#FCD34D", "#FBBF24", "#FDE68A", "#FEF3C7"],
  },
  "superhero-origin": {
    chars: ["⚡", "✦", "★", "·"],
    colors: ["#F87171", "#FB923C", "#FBBF24", "#FCA5A5"],
  },
  "kindness-courage": {
    chars: ["♥", "✿", "✦", "·"],
    colors: ["#F9A8D4", "#F472B6", "#FBCFE8", "#FCE7F3"],
  },
  "pirate-treasure": {
    chars: ["⚓", "✦", "◆", "·"],
    colors: ["#FCD34D", "#F59E0B", "#FBBF24", "#FEF3C7"],
  },
  "fairy-garden": {
    chars: ["✿", "❀", "✦", "·"],
    colors: ["#C084FC", "#A78BFA", "#E9D5FF", "#F5F3FF"],
  },
  "safari-adventure": {
    chars: ["✦", "◆", "❋", "·"],
    colors: ["#FB923C", "#FDBA74", "#FED7AA", "#FFEDD5"],
  },
  "time-travel": {
    chars: ["⚙", "✦", "◷", "·"],
    colors: ["#5EEAD4", "#2DD4BF", "#99F6E4", "#CCFBF1"],
  },
  "christmas-magic": {
    chars: ["❄", "★", "✦", "·"],
    colors: ["#FCA5A5", "#86EFAC", "#FCD34D", "#FECACA"],
  },
  "halloween-adventure": {
    chars: ["🎃", "★", "✦", "·"],
    colors: ["#FB923C", "#C084FC", "#FCD34D", "#FDBA74"],
  },
};

const THEME_GRADIENTS: Record<string, string> = {
  "space-adventure": "from-indigo-950/40 via-purple-950/20 to-blue-950/30",
  "dinosaur-discovery": "from-green-950/30 via-emerald-950/15 to-lime-950/20",
  "under-the-sea": "from-cyan-950/30 via-blue-950/20 to-teal-950/25",
  "royal-quest": "from-amber-950/25 via-yellow-950/15 to-orange-950/20",
  "superhero-origin": "from-red-950/30 via-rose-950/15 to-pink-950/20",
  "kindness-courage": "from-pink-950/25 via-rose-950/15 to-fuchsia-950/20",
  "pirate-treasure": "from-yellow-950/30 via-amber-950/20 to-orange-950/25",
  "fairy-garden": "from-violet-950/30 via-fuchsia-950/15 to-pink-950/20",
  "safari-adventure": "from-orange-950/30 via-amber-950/15 to-yellow-950/20",
  "time-travel": "from-teal-950/30 via-cyan-950/15 to-sky-950/20",
  "christmas-magic": "from-red-950/30 via-green-950/20 to-red-950/25",
  "halloween-adventure": "from-orange-950/35 via-purple-950/20 to-amber-950/25",
};

export default function ThemeAmbiance({ themeId, className }: ThemeAmbianceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const config = THEME_PARTICLES[themeId || ""] || THEME_PARTICLES["space-adventure"];
  const gradient = THEME_GRADIENTS[themeId || ""] || THEME_GRADIENTS["space-adventure"];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const count = 20;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      size: 6 + Math.random() * 12,
      speed: 0.15 + Math.random() * 0.35,
      opacity: 0.15 + Math.random() * 0.35,
      drift: (Math.random() - 0.5) * 0.4,
      char: config.chars[Math.floor(Math.random() * config.chars.length)],
    }));

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        p.y -= p.speed;
        p.x += p.drift + Math.sin(p.y * 0.01) * 0.3;

        if (p.y < -20) {
          p.y = h + 20;
          p.x = Math.random() * w;
        }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;

        const color = config.colors[Math.floor(Math.random() * config.colors.length)];
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(p.char, p.x, p.y);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [config, themeId]);

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-60 transition-all duration-1000",
          gradient,
          className
        )}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.6 }}
      />
    </>
  );
}
