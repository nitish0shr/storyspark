import { AppearanceProfile } from "@/types/child";

const DEFAULT_PROFILE: AppearanceProfile = {
  skinTone: "warm medium",
  hairColor: "brown",
  hairStyle: "short straight",
  eyeColor: "brown",
};

/**
 * Face analysis is disabled — we no longer use child photos for likeness generation.
 * Always returns the default appearance profile so callers need no changes.
 */
export async function analyzeFace(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _photoUrl: string
): Promise<AppearanceProfile> {
  return DEFAULT_PROFILE;
}
