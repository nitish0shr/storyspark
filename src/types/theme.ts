export interface ThemeQuestion {
  id: string;
  question: string; // use {name} placeholder for child's name
  type: "select" | "text";
  options?: string[];
}

export interface Theme {
  id: string;
  name: string;
  titleTemplate: string; // "[Child] Explores the Galaxy" — use [Child] placeholder
  description: string;
  icon: string; // Lucide icon name
  colorScheme: {
    gradient: string; // tailwind gradient classes
    bg: string;
    border: string;
    accent: string;
    coverGradient: string;
  };
  ageRange: string;
  scenes: string[]; // 5 scene descriptions for illustrations
  contextualQuestions: ThemeQuestion[];
}
