export interface CreatorSessionUser {
  id: string;
  is_anonymous?: boolean;
}

interface CreatorAuthResult {
  data: {
    user: CreatorSessionUser | null;
  };
  error: {
    message?: string;
  } | null;
}

export interface CreatorAuthClient {
  getUser(): Promise<CreatorAuthResult>;
  signInAnonymously(): Promise<CreatorAuthResult>;
}

export interface CreatorIdentity {
  userId: string;
  isAnonymous: boolean;
}

export function creatorIdentityFromUser(
  user: CreatorSessionUser | null | undefined,
): CreatorIdentity | null {
  if (!user?.id) return null;
  return {
    userId: user.id,
    isAnonymous: user.is_anonymous === true,
  };
}

export function isCreatorOwner(
  callerUserId: string | null | undefined,
  ownerUserId: string | null | undefined,
): boolean {
  return Boolean(
    callerUserId &&
      ownerUserId &&
      callerUserId === ownerUserId,
  );
}

export function canUseSubscriberTheme(
  identity: CreatorIdentity,
  hasActiveSubscription: boolean,
): boolean {
  return !identity.isAnonymous && hasActiveSubscription;
}

/**
 * Resolve a trusted current user or create and then re-verify an anonymous one.
 *
 * Supabase auth methods return provider failures in `error`; they do not
 * necessarily reject their promise. Both paths must therefore be checked
 * explicitly before the creator can become interactive.
 */
export async function establishCreatorSession(
  auth: CreatorAuthClient,
): Promise<CreatorIdentity> {
  const current = await auth.getUser();
  const currentIdentity =
    current.error === null
      ? creatorIdentityFromUser(current.data.user)
      : null;
  if (currentIdentity) return currentIdentity;

  const signedIn = await auth.signInAnonymously();
  const provisionalIdentity =
    signedIn.error === null
      ? creatorIdentityFromUser(signedIn.data.user)
      : null;
  if (!provisionalIdentity) {
    throw new Error(
      signedIn.error?.message || "Anonymous sign-in did not create a user.",
    );
  }

  // Re-read from the auth server so downstream API requests use a verified
  // session rather than trusting only the sign-in response.
  const verified = await auth.getUser();
  const verifiedIdentity =
    verified.error === null
      ? creatorIdentityFromUser(verified.data.user)
      : null;
  if (
    !verifiedIdentity ||
    verifiedIdentity.userId !== provisionalIdentity.userId
  ) {
    throw new Error(
      verified.error?.message || "The guest session could not be verified.",
    );
  }

  return verifiedIdentity;
}