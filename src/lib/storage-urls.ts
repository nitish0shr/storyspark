/**
 * Short-lived signed URLs for book illustrations.
 *
 * Illustrations used to live in a PUBLIC bucket, so anyone holding a book id
 * could fetch a story's artwork straight from storage - including a story that
 * had not been approved yet. The bucket is now private and every display path
 * goes through here to mint a signed URL that expires.
 *
 * Existing rows store a full public URL rather than an object path, so this
 * accepts either form and converts on the fly. No historical data is rewritten.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export const ILLUSTRATION_BUCKET = "book-illustrations";

/** How long a signed illustration URL stays valid. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60;

const PUBLIC_MARKER = "/storage/v1/object/public/" + ILLUSTRATION_BUCKET + "/";
const SIGNED_MARKER = "/storage/v1/object/sign/" + ILLUSTRATION_BUCKET + "/";

/**
 * Turn a stored value into a bucket object path.
 * Accepts a bare path ("<bookId>/page-1.png"), a legacy public URL, or an
 * already-signed URL. Returns null for anything that is not ours.
 */
export function objectPathFromStored(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const value = String(stored);

  for (const marker of [PUBLIC_MARKER, SIGNED_MARKER]) {
    const at = value.indexOf(marker);
    if (at !== -1) {
      const rest = value.slice(at + marker.length);
      const path = rest.split("?")[0];
      return path || null;
    }
  }

  // Not a URL at all - treat it as a bare object path.
  if (!value.includes("://")) return value.replace(/^\/+/, "") || null;

  return null;
}

/**
 * Sign many stored values at once, preserving order.
 * Anything we cannot sign is returned unchanged so a display never goes blank
 * because of a storage hiccup.
 */
export async function toViewableUrls(
  stored: Array<string | null | undefined>,
): Promise<Array<string | null>> {
  const out: Array<string | null> = stored.map((s) => (s ? String(s) : null));

  const jobs: Array<{ index: number; path: string }> = [];
  stored.forEach((value, index) => {
    const path = objectPathFromStored(value);
    if (path) jobs.push({ index, path });
  });
  if (!jobs.length) return out;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(ILLUSTRATION_BUCKET)
      .createSignedUrls(jobs.map((j) => j.path), SIGNED_URL_TTL_SECONDS);
    if (error || !data) return out;
    data.forEach((row, i) => {
      if (row?.signedUrl) out[jobs[i].index] = row.signedUrl;
    });
  } catch {
    // Fall through and return the originals.
  }
  return out;
}

/** Single-value convenience wrapper. */
export async function toViewableUrl(
  stored: string | null | undefined,
): Promise<string | null> {
  const [url] = await toViewableUrls([stored]);
  return url ?? null;
}
