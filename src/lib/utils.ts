import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns subject/possessive/object pronouns for a given gender.
 */
export function getPronouns(gender: string): {
  pronoun: string;
  possessive: string;
  object: string;
} {
  switch (gender) {
    case "boy":
      return { pronoun: "he", possessive: "his", object: "him" };
    case "girl":
      return { pronoun: "she", possessive: "her", object: "her" };
    default:
      return { pronoun: "they", possessive: "their", object: "them" };
  }
}

/**
 * Formats a price in cents to a USD currency string (e.g. 999 -> "$9.99").
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/**
 * Returns the canonical app URL from the environment.
 * Priority:
 *  1. NEXT_PUBLIC_APP_URL (explicit production/staging override)
 *  2. window.location.origin (browser context)
 *  3. REPLIT_DEV_DOMAIN (Replit preview proxy — set automatically by Replit)
 *  4. localhost:5000 (local fallback)
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Server-side: use Replit's public dev domain when available
  const replitDomain = process.env.REPLIT_DEV_DOMAIN;
  if (replitDomain) {
    return `https://${replitDomain}`;
  }
  return "http://localhost:5000";
}
