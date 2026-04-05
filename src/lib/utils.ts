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
 * Returns the canonical app URL from the environment,
 * falling back to localhost in development.
 */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000")
  );
}
