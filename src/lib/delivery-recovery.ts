export interface LinkedDeliveryGrantEvidence {
  id: string;
  orderId: string | null;
  bookId: string;
  versionId: string;
  accessKind: string;
  tokenHash: string | null;
  verifiedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
}

export function isUsableLinkedDeliveryGrant(params: {
  grant: LinkedDeliveryGrantEvidence | null;
  accessGrantId: string | null;
  orderId: string;
  bookId: string;
  versionId: string;
  nowMs?: number;
}): boolean {
  const { grant } = params;
  if (!grant || !params.accessGrantId || grant.id !== params.accessGrantId) {
    return false;
  }
  if (
    grant.orderId !== params.orderId ||
    grant.bookId !== params.bookId ||
    grant.versionId !== params.versionId
  ) {
    return false;
  }
  if (!["full_book", "download", "gift"].includes(grant.accessKind)) {
    return false;
  }
  if (!grant.tokenHash?.trim() || !grant.verifiedAt || grant.revokedAt) {
    return false;
  }
  if (
    grant.expiresAt
  ) {
    const expiresAtMs = new Date(grant.expiresAt).getTime();
    if (
      !Number.isFinite(expiresAtMs) ||
      expiresAtMs <= (params.nowMs ?? Date.now())
    ) {
      return false;
    }
  }
  return true;
}