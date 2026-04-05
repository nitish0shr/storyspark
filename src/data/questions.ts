import { ThemeQuestion } from "../types/theme";
import { themes } from "./themes";

/**
 * Retrieves the contextual questions for a given theme.
 * Returns an empty array if the theme is not found.
 */
export function getQuestionsForTheme(themeId: string): ThemeQuestion[] {
  const theme = themes.find((t) => t.id === themeId);
  return theme ? theme.contextualQuestions : [];
}
