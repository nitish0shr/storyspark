// ─── Legacy operational status (unchanged) ───────────────────────────────────
export type BookStatus =
  | "draft"
  | "preview_generating"
  | "preview_ready"
  | "generating"
  | "complete"
  | "failed"
  | "pending_review"
  | "needs_regeneration"
  | "approved"
  | "delivered";

// ─── Canonical lifecycle stage ────────────────────────────────────────────────
export type LifecycleStage =
  | "Generated"
  | "Under Review"
  | "Changes Requested"
  | "Revised"
  | "Approved"
  | "Ready for Purchase"
  | "Purchased"
  | "Delivered";

// ─── Book page (legacy story text) ───────────────────────────────────────────
export interface BookPage {
  pageNumber: number;
  text: string;
}

// ─── Quality finding (structured; stored in book_quality_findings) ────────────
export type QualityFindingSource = "text" | "image" | "both";
export type QualityFindingSeverity = "minor" | "major" | "blocker";

export interface QualityFinding {
  id?: string;
  versionId: string;
  pageNumber: number | null;
  code: string;
  explanation: string | null;
  severity: QualityFindingSeverity;
  source: QualityFindingSource;
  createdAt?: string;
}

// ─── Immutable book version ───────────────────────────────────────────────────
export interface BookVersion {
  id: string;
  bookId: string;
  versionNumber: number;
  predecessorId: string | null;
  title: string | null;
  pageCount: number;
  /** Snapshot of generation inputs (contextual answers, theme, etc.) */
  inputSnapshot: Record<string, unknown> | null;
  /** SHA-256 of canonical content; used for deduplication */
  contentHash: string | null;
  /** True once all pages are recorded and version is usable for review/delivery */
  isComplete: boolean;
  storyText: BookPage[] | null;
  illustrationUrls: string[] | null;
  pdfUrl: string | null;
  pdfPrintUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Immutable book version page ─────────────────────────────────────────────
export interface BookVersionPage {
  id: string;
  versionId: string;
  pageNumber: number;
  textContent: string | null;
  illustrationUrl: string | null;
  audioUrl: string | null;
  isPreview: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Revision request ────────────────────────────────────────────────────────
export type RevisionDecision = "reject" | "request_changes";
export type RevisionStatus = "open" | "addressed" | "withdrawn";
export type RevisionScope = "text" | "illustration" | "both";
export type RevisionItemSeverity = "minor" | "major" | "blocker";

export interface RevisionRequestItem {
  id: string;
  revisionRequestId: string;
  pageNumber: number | null;
  /** Which content type is affected */
  scope: RevisionScope;
  description: string;
  /** Optional before/after values to illustrate the needed change */
  beforeValue: string | null;
  afterValue: string | null;
  severity: RevisionItemSeverity;
  createdAt: string;
}

export interface RevisionRequest {
  id: string;
  bookId: string;
  versionId: string | null;
  requestedBy: string;
  decision: RevisionDecision;
  feedback: string | null;
  reason: string | null;
  status: RevisionStatus;
  resolvedAt: string | null;
  createdAt: string;
  items?: RevisionRequestItem[];
}

// ─── Lifecycle event ──────────────────────────────────────────────────────────
export interface LifecycleEvent {
  id: string;
  bookId: string;
  versionId: string | null;
  fromStage: LifecycleStage | null;
  toStage: LifecycleStage;
  actor: string | null;
  reason: string | null;
  idempotencyKey: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Product artefact ─────────────────────────────────────────────────────────
export type ArtefactKind = "pdf_digital" | "pdf_print" | "epub" | "audio" | "other";

export interface ProductArtefact {
  id: string;
  bookId: string;
  versionId: string | null;
  kind: ArtefactKind;
  /** Path within the storage bucket (durable, provider-independent) */
  storagePath: string | null;
  /** Signed/public URL (may expire) */
  url: string;
  /** When the artefact was last confirmed present in storage */
  durableVerifiedAt: string | null;
  /** Customer-facing URL (may differ from storage url) */
  accessUrl: string | null;
  /** When the access URL was last confirmed reachable */
  accessVerifiedAt: string | null;
  sizeBytes: number | null;
  checksum: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Access grant ─────────────────────────────────────────────────────────────
export type AccessKind = "preview" | "full_book" | "download" | "gift";

export interface AccessGrant {
  id: string;
  bookId: string;
  orderId: string | null;
  versionId: string | null;
  granteeUserId: string | null;
  granteeEmail: string | null;
  tokenHash: string | null;
  expiresAt: string | null;
  usedAt: string | null;
  revokedAt: string | null;
  /** When the grant was confirmed usable (token checked, URL reachable) */
  verifiedAt: string | null;
  accessKind: AccessKind;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Delivery attempt ─────────────────────────────────────────────────────────
export type DeliveryChannel = "email" | "download" | "print" | "api";
export type DeliveryStatus = "pending" | "sent" | "failed" | "bounced";

export interface DeliveryAttempt {
  id: string;
  orderId: string;
  bookId: string;
  versionId: string | null;
  attemptNumber: number;
  idempotencyKey?: string | null;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  errorDetail: string | null;
  deliveredAt: string | null;
  /** When the email/notification was dispatched */
  notificationSentAt: string | null;
  /** When we confirmed the recipient can access the book */
  accessVerifiedAt: string | null;
  /** Provider message ID (e.g. Resend/SendGrid) for delivery tracking */
  providerMessageId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Stage timestamps ─────────────────────────────────────────────────────────
export interface StageTimestamps {
  generatedAt: string | null;
  underReviewAt: string | null;
  changesRequestedAt: string | null;
  revisedAt: string | null;
  approvedAt: string | null;
  readyForPurchaseAt: string | null;
  purchasedAt: string | null;
  deliveredAt: string | null;
}

// ─── Core Book ────────────────────────────────────────────────────────────────
export interface Book {
  id: string;
  userId: string;
  childProfileId: string;
  secondChildProfileId: string | null;
  themeId: string;
  language: string;
  /** Legacy operational status (kept for backward compat) */
  status: BookStatus;
  /** Canonical lifecycle stage (nullable; null = pre-lifecycle or legacy) */
  lifecycleStage: LifecycleStage | null;
  /** Operational state separate from lifecycle */
  operationalState: string | null;
  operationalError: Record<string, unknown> | null;
  contextualAnswers: Record<string, string> | null;
  storyText: BookPage[] | null;
  illustrationUrls: string[] | null;
  previewPages: BookPage[] | null;
  pdfUrl: string | null;
  pdfPrintUrl: string | null;
  pageCount: number;
  /** Latest submitted version */
  currentVersionId: string | null;
  /** Version currently under review */
  reviewVersionId: string | null;
  /** Version the reviewer approved */
  approvedVersionId: string | null;
  /** Optimistic-lock counter; incremented on every lifecycle transition */
  lifecycleRevision: number;
  stageTimestamps: StageTimestamps;
  createdAt: string;
  updatedAt: string;
}
