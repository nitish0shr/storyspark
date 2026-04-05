"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type SiteTheme = "storybook" | "classic";

interface ThemeContextValue {
  theme: SiteTheme;
  setTheme: (t: SiteTheme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "storybook",
  setTheme: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>("storybook");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ss-theme") as SiteTheme | null;
    if (saved === "classic" || saved === "storybook") {
      setThemeState(saved);
      document.documentElement.setAttribute("data-site-theme", saved);
    } else {
      document.documentElement.setAttribute("data-site-theme", "storybook");
    }
    setMounted(true);
  }, []);

  const setTheme = (t: SiteTheme) => {
    setThemeState(t);
    localStorage.setItem("ss-theme", t);
    document.documentElement.setAttribute("data-site-theme", t);
  };

  const toggle = () => setTheme(theme === "storybook" ? "classic" : "storybook");

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
