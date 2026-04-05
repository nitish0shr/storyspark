export interface AppearanceProfile {
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
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
