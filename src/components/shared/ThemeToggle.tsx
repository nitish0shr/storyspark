"use client";

import { useTheme } from "@/context/ThemeContext";
import { Sparkles, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  const isStorybook = theme === "storybook";

  return (
    <button
      onClick={toggle}
      title={`Switch to ${isStorybook ? "Classic" : "Storybook"} theme`}
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
      style={
        isStorybook
          ? {
              background: "#1a1a2e",
              border: "2.5px solid #FFD166",
              borderRadius: "100px",
              padding: "10px 16px",
              boxShadow: "4px 4px 0px #FFD166",
              color: "#FFD166",
              fontFamily: "var(--font-baloo)",
              fontWeight: 700,
              fontSize: "13px",
            }
          : {
              background: "linear-gradient(135deg, #7C3AED, #EC4899)",
              border: "2px solid rgba(255,255,255,0.3)",
              borderRadius: "100px",
              padding: "10px 16px",
              boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
              color: "white",
              fontFamily: "var(--font-nunito)",
              fontWeight: 700,
              fontSize: "13px",
            }
      }
    >
      {isStorybook ? (
        <>
          <Moon className="h-4 w-4" />
          Classic Mode
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Storybook Mode
        </>
      )}
    </button>
  );
}
