import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  createReviewToken,
  persistReviewTokenRecord,
  type ReviewTokenRecord,
} from "../src/lib/review-tokens";

const canonicalMigration = readFileSync(
  "supabase/migrations/010_canonical_book_fulfilment.sql",
  "utf8",
);

describe("version-bound review token schema", () => {
  test("migration adds the version column, foreign key and lookup index", () => {
    assert.match(
      canonicalMigration,
      /alter table public\.book_review_tokens\s+add column if not exists version_id uuid;/i,
    );
    assert.match(
      canonicalMigration,
      /foreign key \(version_id\)\s+references public\.book_versions\(id\)/i,
    );
    assert.match(
      canonicalMigration,
      /create index if not exists idx_book_review_tokens_version/i,
    );
  });
});

describe("canonical review token persistence", () => {
  const record: ReviewTokenRecord = {
    book_id: "book-1",
    token_hash: "hash",
    expires_at: "2026-08-27T12:00:00Z",
    version_id: "version-1",
  };

  test("persists the exact version in the only insert attempt", async () => {
    const inserted: ReviewTokenRecord[] = [];
    await persistReviewTokenRecord(record, async (value) => {
      inserted.push(value);
      return { error: null };
    });
    assert.deepEqual(inserted, [record]);
  });

  test("fails hard instead of retrying without version_id", async () => {
    let attempts = 0;
    await assert.rejects(
      persistReviewTokenRecord(record, async (value) => {
        attempts += 1;
        assert.equal(value.version_id, "version-1");
        return { error: { message: "version column unavailable" } };
      }),
      /Could not create review token: version column unavailable/,
    );
    assert.equal(attempts, 1);
  });

  test("refuses to mint any token without an exact version", async () => {
    await assert.rejects(
      createReviewToken("book-1", ""),
      /an exact version_id is required/,
    );
  });
});