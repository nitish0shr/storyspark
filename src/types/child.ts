/**
 * Structured Character Profile for a child, built once from the uploaded photo.
 * The four original fields remain required for backwards compatibility with
 * existing rows; all richer fields are optional.
 */
export interface AppearanceProfile {
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  hairLength?: string;
  hairTexture?: string;
  faceShape?: string;
  facialFeatures?: string;
  eyeShape?: string;
  approximateAge?: string;
  freckles?: string;
  glasses?: string;
  distinctiveFeatures?: string;
  /** 1-2 sentence prose summary from the photo analysis. */
  description?: string;
  /** Canonical Character Reference Sheet image URL (generated once, reused for every page). */
  referenceSheetUrl?: string | null;
}

export interface ChildProfile {
  id: string;
  userId: string;
  name: string;
  age: number; // -1 for pre-birth, 0-12 for actual age
  gender: "boy" | "girl" | "neutral";
  photoUrl: string | null;
  photoProcessedUrl: string | null;
  appearanceProfile: AppearanceProfile | null;
  createdAt: string;
  updatedAt: string;
}
