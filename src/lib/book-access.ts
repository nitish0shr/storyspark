export type CustomerBookStage =
  | "Ready for Purchase"
  | "Purchased"
  | "Delivered"
  | string
  | null;

export interface BookAccessDecision {
  canPreview: boolean;
  canReadFullBook: boolean;
}

export function isExactVerifiedPayment(params: {
  approvedVersionId: string | null;
  orderVersionId: string | null;
  orderStatus: string | null;
  paymentVerifiedAt: string | null;
}): boolean {
  return Boolean(
    params.approvedVersionId &&
      params.orderVersionId === params.approvedVersionId &&
      (params.orderStatus === "paid" || params.orderStatus === "fulfilled") &&
      params.paymentVerifiedAt,
  );
}

export function canExposeDeliveredArtefacts(params: {
  stage: CustomerBookStage;
  approvedVersionId: string | null;
  hasExactVerifiedPayment: boolean;
}): boolean {
  return Boolean(
    params.stage === "Delivered" &&
      params.approvedVersionId &&
      params.hasExactVerifiedPayment,
  );
}

export function canIssueFinalBookSignedLink(params: {
  stage: CustomerBookStage;
  bookId: string;
  approvedVersionId: string | null;
  artefactVersionId: string | null;
  storagePath: string | null;
  storageBucket: string | null;
  hasExactVerifiedPayment: boolean;
  hasAccessAuthorisation: boolean;
}): boolean {
  const expectedPrefix =
    params.approvedVersionId &&
    `books/${params.bookId}/versions/${params.approvedVersionId}/`;
  return Boolean(
    canExposeDeliveredArtefacts(params) &&
      params.hasAccessAuthorisation &&
      params.artefactVersionId === params.approvedVersionId &&
      params.storageBucket === "final-books" &&
      params.storagePath &&
      expectedPrefix &&
      params.storagePath.startsWith(expectedPrefix),
  );
}

/**
 * Pure access rule for an exact approved version.
 *
 * A preview capability is deliberately never promoted into full-book access
 * when somebody pays. Full access requires either the authenticated owner or a
 * separately issued, paid-order-bound full-book capability.
 */
export function decideBookAccess(params: {
  stage: CustomerBookStage;
  isOwner: boolean;
  grantKind: string | null;
  grantBoundToVerifiedPayment: boolean;
}): BookAccessDecision {
  const { stage, isOwner, grantKind, grantBoundToVerifiedPayment } = params;
  if (stage === "Ready for Purchase") {
    return {
      canPreview: isOwner || grantKind === "preview",
      canReadFullBook: false,
    };
  }
  if (stage === "Purchased" || stage === "Delivered") {
    const fullCapability =
      grantBoundToVerifiedPayment &&
      (grantKind === "full_book" ||
        grantKind === "download" ||
        grantKind === "gift");
    return {
      canPreview: isOwner || fullCapability,
      canReadFullBook: isOwner || fullCapability,
    };
  }
  return { canPreview: false, canReadFullBook: false };
}