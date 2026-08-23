export const DEFAULT_MARKETING_URL = "https://starmeestories.com";

export interface CompletedBookShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Completed-book sharing is deliberately a recommendation, not a file share.
 * Keep the payload generic and reduce the configured destination to its public
 * origin so book IDs, access capabilities, signed storage paths, and child
 * details can never be included.
 */
export function createCompletedBookShareData(
  configuredMarketingUrl?: string | null,
): CompletedBookShareData {
  let url = DEFAULT_MARKETING_URL;

  try {
    const candidate = new URL(configuredMarketingUrl || DEFAULT_MARKETING_URL);
    if (candidate.protocol === "https:" || candidate.protocol === "http:") {
      url = candidate.origin;
    }
  } catch {
    // The public default is safer than sharing a malformed configured URL.
  }

  return {
    title: "Starmee Stories",
    text: "I made a personalised storybook with Starmee Stories. Create one for someone special!",
    url,
  };
}