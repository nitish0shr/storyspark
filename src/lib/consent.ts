/**
 * Single source of truth for Starmee's consent copy and versioning.
 *
 * The version string is stored on every order (books.consent_version) so we
 * can always tell which wording a customer actually agreed to. Bump it
 * whenever the notice or the marketing wording below changes materially.
 */

export const CONSENT_VERSION = "2026-08-03";

/** How long order information is generally retained. */
export const RETENTION_PERIOD = "2 years";

/** Where privacy requests go. Configurable, never invented. */
export function privacyContactEmail(): string {
  return process.env.PRIVACY_CONTACT_EMAIL || "hello@starmeestories.com";
}

/** Shown next to the order form. */
export const PRIVACY_NOTICE =
  "We use your email and personalization details to create, review, and deliver " +
  "your Starmee story. Please see our Privacy Policy for more information.";

/** Optional marketing opt-in. Must never be pre-ticked or required. */
export const MARKETING_CONSENT_LABEL =
  "I agree to receive occasional news, offers, and updates from Starmee. " +
  "I can unsubscribe at any time.";

/** Required adult confirmation. */
export const ADULT_CONFIRMATION_LABEL =
  "I confirm that I am 18 or older and authorized to provide the " +
  "personalization details for this order.";
