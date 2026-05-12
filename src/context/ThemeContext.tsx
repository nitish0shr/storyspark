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

  useEffect(() => {
    const saved = localStorage.getItem("ss-theme") as SiteTheme | null;
    if (saved === "classic" || saved === "storybook") {
      setThemeState(saved);
      document.documentElement.setAttribute("data-site-theme", saved);
    } else {
      document.documentElement.setAttribute("data-site-theme", "storybook");
    }
  }, []);

  const setTheme = (t: SiteTheme) => {
    setThemeState(t);
    localStorage.setItem("ss-theme", t);
    document.documentElement.setAttribute("data-site-theme", t);
  };

  const toggle = () => setTheme(theme === "storybook" ? "classic" : "storybook");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
