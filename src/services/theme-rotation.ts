import { themes } from "@/data/themes";

const STANDARD_THEME_IDS = themes
  .filter((t) => t.category !== "seasonal")
  .map((t) => t.id);

export function getNextThemeForSubscriber(usedThemeIds: string[]): string | null {
  const available = STANDARD_THEME_IDS.filter(
    (id) => !usedThemeIds.includes(id)
  );

  if (available.length > 0) {
    return available[0];
  }

  if (STANDARD_THEME_IDS.length > 0) {
    return STANDARD_THEME_IDS[usedThemeIds.length % STANDARD_THEME_IDS.length];
  }

  return null;
}

export function getAllThemeIds(): string[] {
  return STANDARD_THEME_IDS;
}
