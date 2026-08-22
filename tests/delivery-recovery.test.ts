import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  isUsableLinkedDeliveryGrant,
  type LinkedDeliveryGrantEvidence,
} from "../src/lib/delivery-recovery";

const NOW = Date.parse("2026-08-20T18:00:00.000Z");

function usableGrant(
  overrides: Partial<LinkedDeliveryGrantEvidence> = {},
): LinkedDeliveryGrantEvidence {
  return {
    id: "grant-1",
    orderId: "order-1",
    bookId: "book-1",
    versionId: "version-1",
    accessKind: "full_book",
    tokenHash: "hashed-secret",
    verifiedAt: "2026-08-20T17:59:00.000Z",
    revokedAt: null,
    expiresAt: null,
    ...overrides,
  };
}

function decision(grant: LinkedDeliveryGrantEvidence | null): boolean {
  return isUsableLinkedDeliveryGrant({
    grant,
    accessGrantId: "grant-1",
    orderId: "order-1",
    bookId: "book-1",
    versionId: "version-1",
    nowMs: NOW,
  });
}

describe("sent delivery replay grant evidence", () => {
  test("accepts only the exact verified usable linked capability", () => {
    assert.equal(decision(usableGrant()), true);
  });

  test("rejects missing, unlinked, or wrong-identity grants", () => {
    assert.equal(decision(null), false);
    assert.equal(
      isUsableLinkedDeliveryGrant({
        grant: usableGrant(),
        accessGrantId: null,
        orderId: "order-1",
        bookId: "book-1",
        versionId: "version-1",
        nowMs: NOW,
      }),
      false,
    );
    assert.equal(decision(usableGrant({ id: "grant-2" })), false);
    assert.equal(decision(usableGrant({ orderId: "order-2" })), false);
    assert.equal(decision(usableGrant({ bookId: "book-2" })), false);
    assert.equal(decision(usableGrant({ versionId: "version-2" })), false);
  });

  test("rejects revoked, expired, unverified, or tokenless grants", () => {
    assert.equal(
      decision(usableGrant({ revokedAt: "2026-08-20T17:59:30.000Z" })),
      false,
    );
    assert.equal(
      decision(usableGrant({ expiresAt: "2026-08-20T18:00:00.000Z" })),
      false,
    );
    assert.equal(decision(usableGrant({ expiresAt: "not-a-timestamp" })), false);
    assert.equal(decision(usableGrant({ verifiedAt: null })), false);
    assert.equal(decision(usableGrant({ tokenHash: "  " })), false);
  });

  test("rejects capabilities that are not full-book delivery grants", () => {
    assert.equal(decision(usableGrant({ accessKind: "preview" })), false);
  });
});