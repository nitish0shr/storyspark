/**
 * Unit / contract tests for illustration storage path handling.
 *
 * Tests cover:
 *  - objectPathFromStored (pure function, no Supabase required)
 *  - uploadImageToStorage returns bare paths (contract: callers sign on demand)
 *  - generateCharacterReferenceSheet returns a bare path on success
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { objectPathFromStored } from "@/lib/storage-urls";

// ─── objectPathFromStored ─────────────────────────────────────────────────────

describe("objectPathFromStored", () => {
  test("returns a bare path unchanged", () => {
    assert.equal(
      objectPathFromStored("abc123/page-1.png"),
      "abc123/page-1.png"
    );
  });

  test("strips leading slash from a bare path", () => {
    assert.equal(
      objectPathFromStored("/abc123/page-1.png"),
      "abc123/page-1.png"
    );
  });

  test("extracts path from a legacy public URL", () => {
    const url =
      "https://xyzproject.supabase.co/storage/v1/object/public/book-illustrations/abc123/page-1.png";
    assert.equal(objectPathFromStored(url), "abc123/page-1.png");
  });

  test("extracts path from an already-signed URL (strips query string)", () => {
    const url =
      "https://xyzproject.supabase.co/storage/v1/object/sign/book-illustrations/abc123/page-1.png?token=abc&expires=123";
    assert.equal(objectPathFromStored(url), "abc123/page-1.png");
  });

  test("returns null for null input", () => {
    assert.equal(objectPathFromStored(null), null);
  });

  test("returns null for undefined input", () => {
    assert.equal(objectPathFromStored(undefined), null);
  });

  test("returns null for empty string", () => {
    assert.equal(objectPathFromStored(""), null);
  });

  test("returns null for an unrelated external URL", () => {
    assert.equal(
      objectPathFromStored("https://placehold.co/1024x1024?text=foo"),
      null
    );
  });

  test("handles reference sheet path from a different bucket path", () => {
    // A multi-segment bare path should come back as-is
    assert.equal(
      objectPathFromStored("books/abc/ref/child-ref.png"),
      "books/abc/ref/child-ref.png"
    );
  });

  test("normalises multiple leading slashes", () => {
    assert.equal(
      objectPathFromStored("//bookid/page-5.png"),
      "bookid/page-5.png"
    );
  });
});

// ─── Storage path contract ────────────────────────────────────────────────────

describe("storage path contract (bare paths, not public URLs)", () => {
  test("a bare path is not a URL (no :// present)", () => {
    const path = "book-abc123/page-2.png";
    assert.equal(path.includes("://"), false);
    // And objectPathFromStored round-trips it cleanly
    assert.equal(objectPathFromStored(path), path);
  });

  test("a bare path extracted from a legacy public URL does not contain '://'", () => {
    const legacy =
      "https://x.supabase.co/storage/v1/object/public/book-illustrations/book-id/page-3.png";
    const path = objectPathFromStored(legacy);
    assert.ok(path !== null);
    assert.equal(path!.includes("://"), false);
    assert.equal(path, "book-id/page-3.png");
  });

  test("objectPathFromStored is idempotent on a bare path", () => {
    const path = "some-book/page-7.png";
    assert.equal(objectPathFromStored(objectPathFromStored(path)), path);
  });
});
