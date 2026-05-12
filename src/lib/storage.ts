import { isAdminConfigured, supabaseAdmin } from "@/lib/supabase/admin";

export const PHOTO_BUCKET = "child-photos";
export const BOOK_BUCKET = "books";

export function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export async function createSignedPhotoUrl(
  photoPathOrUrl: string | null | undefined,
  expiresInSeconds = 60 * 60
): Promise<string | null> {
  if (!photoPathOrUrl) return null;
  if (isExternalUrl(photoPathOrUrl)) return photoPathOrUrl;
  if (!isAdminConfigured()) return null;

  const { data, error } = await supabaseAdmin.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(photoPathOrUrl, expiresInSeconds);

  if (error) {
    console.error("Failed to sign child photo URL:", error);
    return null;
  }

  return data.signedUrl;
}
