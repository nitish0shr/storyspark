import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const retryRoute = readFileSync(
  "src/app/api/admin/retry-approval-invitation/route.ts",
  "utf8",
);
const adminBooksPage = readFileSync("src/app/admin/books/page.tsx", "utf8");
const confirmationRetryRoute = readFileSync(
  "src/app/api/admin/retry-purchase-confirmation/route.ts",
  "utf8",
);

describe("Approved invitation recovery", () => {
  test("exposes only a POST, admin-authenticated exact-version retry", () => {
    assert.match(retryRoute, /export async function POST/);
    assert.doesNotMatch(retryRoute, /export async function GET/);
    assert.match(retryRoute, /supabase\.auth\.getUser\(\)/);
    assert.match(retryRoute, /isAdminEmail\(user\.email\)/);
    assert.match(retryRoute, /book\.lifecycle_stage !== "Approved"/);
    assert.match(retryRoute, /versionId: book\.approved_version_id/);
    assert.match(retryRoute, /approveBook\(/);
  });

  test("Approved rows show an operator retry action", () => {
    assert.match(
      adminBooksPage,
      /book\.lifecycle_stage === "Approved"[\s\S]*action="\/api\/admin\/retry-approval-invitation"[\s\S]*Retry invitation/,
    );
  });
});

describe("purchase confirmation recovery", () => {
  test("provides an authenticated paid-order retry without changing payment", () => {
    assert.match(confirmationRetryRoute, /export async function POST/);
    assert.match(confirmationRetryRoute, /isAdminEmail\(user\.email\)/);
    assert.match(
      confirmationRetryRoute,
      /book\.lifecycle_stage !== "Purchased"/,
    );
    assert.match(confirmationRetryRoute, /payment_verified_at/);
    assert.match(confirmationRetryRoute, /attemptPurchaseConfirmation\(/);
    assert.doesNotMatch(
      confirmationRetryRoute,
      /record_verified_payment_and_purchase|stripe\.checkout/,
    );
    assert.match(
      adminBooksPage,
      /action="\/api\/admin\/retry-purchase-confirmation"[\s\S]*Retry purchase email/,
    );
  });
});