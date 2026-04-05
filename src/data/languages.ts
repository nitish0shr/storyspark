export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  script: "latin" | "devanagari" | "cjk" | "cyrillic";
}

export const supportedLanguages: SupportedLanguage[] = [
  { code: "en", name: "English", nativeName: "English", script: "latin" },
  { code: "es", name: "Spanish", nativeName: "Español", script: "latin" },
  { code: "fr", name: "French", nativeName: "Français", script: "latin" },
  { code: "de", name: "German", nativeName: "Deutsch", script: "latin" },
  { code: "pt", name: "Portuguese", nativeName: "Português", script: "latin" },
  { code: "it", name: "Italian", nativeName: "Italiano", script: "latin" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", script: "devanagari" },
  { code: "zh", name: "Mandarin", nativeName: "中文", script: "cjk" },
];

export function getLanguageByCode(code: string): SupportedLanguage | undefined {
  return supportedLanguages.find((l) => l.code === code);
}

export function getLanguageName(code: string): string {
  return getLanguageByCode(code)?.name ?? "English";
}

export const supportedLanguageCodes = supportedLanguages.map((l) => l.code);

export function isValidLanguageCode(code: string): boolean {
  return supportedLanguageCodes.includes(code);
}
