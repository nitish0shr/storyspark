import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  canExposeDeliveredArtefacts,
  decideBookAccess,
  isExactVerifiedPayment,
} from "../src/lib/book-access";

describe("exact-version customer book access", () => {
  test("a preview token permits only selected pages before payment", () => {
    assert.deepEqual(
      decideBookAccess({
        stage: "Ready for Purchase",
        isOwner: false,
        grantKind: "preview",
        grantBoundToVerifiedPayment: false,
      }),
      { canPreview: true, canReadFullBook: false },
    );
  });

  test("a preview token never becomes a full-book key after purchase", () => {
    assert.deepEqual(
      decideBookAccess({
        stage: "Purchased",
        isOwner: false,
        grantKind: "preview",
        grantBoundToVerifiedPayment: false,
      }),
      { canPreview: false, canReadFullBook: false },
    );
  });

  test("a paid-order-bound full-book token unlocks the purchased version", () => {
    assert.deepEqual(
      decideBookAccess({
        stage: "Purchased",
        isOwner: false,
        grantKind: "full_book",
        grantBoundToVerifiedPayment: true,
      }),
      { canPreview: true, canReadFullBook: true },
    );
  });

  test("an unbound full-book token is rejected", () => {
    assert.equal(
      decideBookAccess({
        stage: "Delivered",
        isOwner: false,
        grantKind: "full_book",
        grantBoundToVerifiedPayment: false,
      }).canReadFullBook,
      false,
    );
  });

  test("the authenticated owner can read only after purchase", () => {
    assert.equal(
      decideBookAccess({
        stage: "Ready for Purchase",
        isOwner: true,
        grantKind: null,
        grantBoundToVerifiedPayment: false,
      }).canReadFullBook,
      false,
    );
    assert.equal(
      decideBookAccess({
        stage: "Purchased",
        isOwner: true,
        grantKind: null,
        grantBoundToVerifiedPayment: false,
      }).canReadFullBook,
      true,
    );
  });
});

describe("delivered artefact access", () => {
  test("requires an exact verified payment", () => {
    assert.equal(
      isExactVerifiedPayment({
        approvedVersionId: "version-a",
        orderVersionId: "version-a",
        orderStatus: "paid",
        paymentVerifiedAt: "2026-08-20T12:00:00Z",
      }),
      true,
    );
    assert.equal(
      isExactVerifiedPayment({
        approvedVersionId: "version-a",
        orderVersionId: "version-b",
        orderStatus: "paid",
        paymentVerifiedAt: "2026-08-20T12:00:00Z",
      }),
      false,
    );
  });

  test("never emits final artefacts before Delivered", () => {
    assert.equal(
      canExposeDeliveredArtefacts({
        stage: "Purchased",
        approvedVersionId: "version-a",
        hasExactVerifiedPayment: true,
      }),
      false,
    );
    assert.equal(
      canExposeDeliveredArtefacts({
        stage: "Delivered",
        approvedVersionId: "version-a",
        hasExactVerifiedPayment: true,
      }),
      true,
    );
  });
});