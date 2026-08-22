/**
 * Immutable book version management.
 *
 * A BookVersion is a point-in-time snapshot of a book's content: story pages +
 * illustration URLs. Once created it is never mutated. The books table carries
 * three version pointers:
 *   current_version_id   – the version currently being shown / under review
 *   review_version_id    – the specific snapshot a reviewer is evaluating
 *   approved_version_id  – the snapshot that a human approved
 *
 * All DB writes go through supabaseAdmin; this module owns the version schema
 * and exposes pure helper functions alongside the DB-touching create/fetch ops.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BookPage, BookVersion, BookVersionPage } from "@/types/book";
import crypto from "crypto";

// ─── Content hash (for duplicate detection) ────────────────────────────────────

/**
 * Produces a stable, order-sensitive hash of all page texts + illustration URLs.
 * Two snapshots with identical content will produce identical hashes, so the
 * revision engine can reject no-op revisions before storing them.
 */
export function computeVersionContentHash(
  pages: Array<{ pageNumber: number; textContent: string | null; illustrationUrl: string | null }>,
): string {
  const sorted = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const payload = sorted
    .map((p) => `${p.pageNumber}|${p.textContent ?? ""}|${p.illustrationUrl ?? ""}`)
    .join("\n");
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

/**
 * Jaccard-similarity based text similarity between two strings, normalised [0,1].
 * Used to detect near-duplicate revisions (identical meaning, trivially different wording).
 */
export function textSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const tokenise = (s: string): Set<string> => {
    const tokens = new Set<string>();
    const words = s.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (w.length > 2) tokens.add(w);
    }
    return tokens;
  };
  const setA = tokenise(a);
  const setB = tokenise(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  const aArr = Array.from(setA);
  for (const w of aArr) {
    if (setB.has(w)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

// ─── Internal row shapes ───────────────────────────────────────────────────────

interface VersionRow {
  id: string;
  book_id: string;
  version_number: number;
  predecessor_id: string | null;
  title: string | null;
  page_count: number;
  input_snapshot: Record<string, unknown> | null;
  content_hash: string | null;
  is_complete: boolean;
  story_text: unknown;
  illustration_urls: unknown;
  pdf_url: string | null;
  pdf_print_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface VersionPageRow {
  id: string;
  version_id: string;
  page_number: number;
  text_content: string | null;
  illustration_url: string | null;
  audio_url: string | null;
  is_preview: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ─── Row -> domain mappers ─────────────────────────────────────────────────────

function rowToVersion(row: VersionRow): BookVersion {
  return {
    id: row.id,
    bookId: row.book_id,
    versionNumber: row.version_number,
    predecessorId: row.predecessor_id,
    title: row.title,
    pageCount: row.page_count,
    inputSnapshot: row.input_snapshot,
    contentHash: row.content_hash,
    isComplete: row.is_complete ?? false,
    storyText: Array.isArray(row.story_text) ? (row.story_text as BookPage[]) : null,
    illustrationUrls: Array.isArray(row.illustration_urls)
      ? (row.illustration_urls as string[])
      : null,
    pdfUrl: row.pdf_url,
    pdfPrintUrl: row.pdf_print_url,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

function rowToPage(row: VersionPageRow): BookVersionPage {
  return {
    id: row.id,
    versionId: row.version_id,
    pageNumber: row.page_number,
    textContent: row.text_content,
    illustrationUrl: row.illustration_url,
    audioUrl: row.audio_url,
    isPreview: row.is_preview ?? false,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

// ─── Create an immutable version snapshot ─────────────────────────────────────

export interface CreateVersionInput {
  bookId: string;
  storyPages: BookPage[];
  illustrationUrls: (string | null)[];
  title?: string | null;
  predecessorVersionId?: string | null;
  inputSnapshot?: Record<string, unknown> | null;
  previewPageNumbers?: number[];
  metadata?: Record<string, unknown> | null;
}

export interface CreateVersionResult {
  ok: boolean;
  versionId: string | null;
  versionNumber: number | null;
  contentHash: string | null;
  error?: string;
}

/**
 * Creates an immutable book_version snapshot and inserts one book_version_page
 * row per story page. The caller must supply all pages and their illustration
 * URLs (null is allowed — the completeness check will flag it later).
 *
 * Returns the new version's id and version_number on success.
 */
export async function createBookVersion(
  input: CreateVersionInput,
): Promise<CreateVersionResult> {
  const {
    bookId,
    storyPages,
    illustrationUrls,
    title,
    predecessorVersionId,
    inputSnapshot,
    previewPageNumbers,
    metadata,
  } = input;

  if (!storyPages || storyPages.length === 0) {
    return { ok: false, versionId: null, versionNumber: null, contentHash: null, error: "No story pages provided" };
  }
  if (
    storyPages.some((page, index) => {
      return (
        !page.text?.trim() ||
        !illustrationUrls[index] ||
        !String(illustrationUrls[index]).trim()
      );
    })
  ) {
    return {
      ok: false,
      versionId: null,
      versionNumber: null,
      contentHash: null,
      error: "Every page requires non-empty text and an illustration before versioning",
    };
  }
  const pageNumbers = storyPages
    .map((page) => page.pageNumber)
    .sort((a, b) => a - b);
  if (
    pageNumbers.some(
      (pageNumber, index) =>
        !Number.isInteger(pageNumber) || pageNumber !== index + 1,
    )
  ) {
    return {
      ok: false,
      versionId: null,
      versionNumber: null,
      contentHash: null,
      error: "Version pages must be numbered contiguously from 1",
    };
  }

  // Compute content hash for duplicate detection
  const pageHashInputs = storyPages.map((p, i) => ({
    pageNumber: p.pageNumber,
    textContent: p.text,
    illustrationUrl: illustrationUrls[i] ?? null,
  }));
  const contentHash = computeVersionContentHash(pageHashInputs);

  const selectedPreviewPages = new Set(
    (previewPageNumbers?.length
      ? previewPageNumbers
      : [...storyPages]
          .sort((a, b) => a.pageNumber - b.pageNumber)
          .slice(0, 2)
          .map((page) => page.pageNumber)
    ).slice(0, 2),
  );
  const pageRows = storyPages.map((page, i) => ({
    page_number: page.pageNumber,
    text_content: page.text,
    illustration_url: illustrationUrls[i],
    audio_url: null,
    is_preview: selectedPreviewPages.has(page.pageNumber),
    metadata: null,
  }));

  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
    "create_book_version_snapshot",
    {
      p_book_id: bookId,
      p_predecessor_id: predecessorVersionId ?? null,
      p_title: title ?? null,
      p_input_snapshot: inputSnapshot ?? null,
      p_story_text: storyPages,
      p_illustration_urls: illustrationUrls,
      p_content_hash: contentHash,
      p_metadata: metadata ?? null,
      p_pages: pageRows,
    },
  );

  if (rpcError) {
    return {
      ok: false,
      versionId: null,
      versionNumber: null,
      contentHash: null,
      error: "Failed to create immutable version snapshot: " + rpcError.message,
    };
  }

  const result = rpcData as {
    ok?: boolean;
    error?: string;
    message?: string;
    version_id?: string;
    version_number?: number;
  } | null;
  if (!result?.ok || !result.version_id || !result.version_number) {
    return {
      ok: false,
      versionId: null,
      versionNumber: null,
      contentHash: null,
      error:
        result?.message ??
        result?.error ??
        "Database rejected the immutable version snapshot",
    };
  }

  return {
    ok: true,
    versionId: result.version_id,
    versionNumber: result.version_number,
    contentHash,
  };
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────────

export async function fetchBookVersion(versionId: string): Promise<BookVersion | null> {
  const { data, error } = await supabaseAdmin
    .from("book_versions")
    .select("*")
    .eq("id", versionId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToVersion(data as VersionRow);
}

export async function fetchVersionPages(versionId: string): Promise<BookVersionPage[]> {
  const { data, error } = await supabaseAdmin
    .from("book_version_pages")
    .select("*")
    .eq("version_id", versionId)
    .order("page_number", { ascending: true });

  if (error || !data) return [];
  return (data as VersionPageRow[]).map(rowToPage);
}

// ─── Page findings persistence ─────────────────────────────────────────────────

/**
 * Persists quality findings as metadata against individual version pages.
 * The findings array replaces whatever was there before (idempotent).
 */
export async function persistPageFindings(
  versionId: string,
  pageNumber: number | null,
  findings: Array<{
    code: string;
    detail: string;
    severity?: "minor" | "major" | "blocker";
    source?: "text" | "image" | "both";
  }>,
): Promise<void> {
  let deleteQuery = supabaseAdmin
    .from("book_quality_findings")
    .delete()
    .eq("version_id", versionId);
  deleteQuery =
    pageNumber === null
      ? deleteQuery.is("page_number", null)
      : deleteQuery.eq("page_number", pageNumber);
  const { error: deleteError } = await deleteQuery;

  if (deleteError) {
    console.error(
      `[book-versions] Failed to replace findings for version ${versionId} page ${pageNumber}:`,
      deleteError.message,
    );
    throw new Error(deleteError.message);
  }
  if (findings.length === 0) return;

  const { error: insertError } = await supabaseAdmin
    .from("book_quality_findings")
    .insert(
      findings.map((finding) => ({
        version_id: versionId,
        page_number: pageNumber,
        code: finding.code,
        explanation: finding.detail,
        severity: finding.severity ?? "major",
        source: finding.source ?? "both",
      })),
    );
  if (insertError) {
    console.error(
      `[book-versions] Failed to persist findings for version ${versionId} page ${pageNumber}:`,
      insertError.message,
    );
    throw new Error(insertError.message);
  }
}

/** Atomically replaces the persisted automated findings for one version. */
export async function replaceVersionFindings(
  versionId: string,
  findings: Array<{
    pageNumber?: number | null;
    code: string;
    detail: string;
    severity?: "minor" | "major" | "blocker";
    source?: "text" | "image" | "both";
  }>,
): Promise<void> {
  const { error: deleteError } = await supabaseAdmin
    .from("book_quality_findings")
    .delete()
    .eq("version_id", versionId);
  if (deleteError) {
    throw new Error(
      `Failed to clear findings for version ${versionId}: ${deleteError.message}`,
    );
  }
  if (findings.length === 0) return;
  const { error: insertError } = await supabaseAdmin
    .from("book_quality_findings")
    .insert(
      findings.map((finding) => ({
        version_id: versionId,
        page_number: finding.pageNumber ?? null,
        code: finding.code,
        explanation: finding.detail,
        severity: finding.severity ?? "major",
        source: finding.source ?? "both",
      })),
    );
  if (insertError) {
    throw new Error(
      `Failed to persist findings for version ${versionId}: ${insertError.message}`,
    );
  }
}

// ─── Version pointer updates on books table ────────────────────────────────────

export async function setCurrentVersionId(bookId: string, versionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("books")
    .update({ current_version_id: versionId, updated_at: new Date().toISOString() })
    .eq("id", bookId);

  if (error) {
    console.error(`[book-versions] Failed to set current_version_id for book ${bookId}:`, error.message);
  }
}

export async function setReviewVersionId(bookId: string, versionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("books")
    .update({ review_version_id: versionId, updated_at: new Date().toISOString() })
    .eq("id", bookId);

  if (error) {
    console.error(`[book-versions] Failed to set review_version_id for book ${bookId}:`, error.message);
  }
}

export async function setApprovedVersionId(bookId: string, versionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("books")
    .update({ approved_version_id: versionId, updated_at: new Date().toISOString() })
    .eq("id", bookId);

  if (error) {
    console.error(`[book-versions] Failed to set approved_version_id for book ${bookId}:`, error.message);
  }
}

/**
 * Compatibility helper for old callers. Version snapshots are immutable, so
 * rendered files are stored as separate product artefacts.
 */
export async function updateVersionPdfUrls(
  versionId: string,
  pdfUrl: string | null,
  pdfPrintUrl: string | null,
): Promise<void> {
  if (pdfUrl || pdfPrintUrl) {
    throw new Error(
      `Refusing to persist raw PDF URLs for immutable version ${versionId}; record private storage identity in product_artefacts instead`,
    );
  }
}
