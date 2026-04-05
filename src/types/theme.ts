export interface ThemeQuestion {
  id: string;
  question: string; // use {name} placeholder for child's name
  type: "select" | "text";
  options?: string[];
}

export type ThemeCategory = "adventure" | "fantasy" | "heartfelt" | "seasonal";

export interface SeasonalWindow {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export interface Theme {
  id: string;
  name: string;
  titleTemplate: string;
  description: string;
  icon: string;
  colorScheme: {
    gradient: string;
    bg: string;
    border: string;
    accent: string;
    coverGradient: string;
  };
  ageRange: string;
  scenes: string[];
  contextualQuestions: ThemeQuestion[];
  category: ThemeCategory;
  seasonal?: SeasonalWindow;
  badge?: string;
}

export function isThemeAvailable(theme: Theme): boolean {
  if (!theme.seasonal) return true;
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const { startMonth, startDay, endMonth, endDay } = theme.seasonal;
  const current = month * 100 + day;
  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;
  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}
