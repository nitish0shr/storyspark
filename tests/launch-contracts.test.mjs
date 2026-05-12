import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("preview route renders generated book rows without nonexistent price_cents", () => {
  const previewPage = read("src/app/preview/[bookId]/page.tsx");
  const bookViewer = read("src/components/preview/BookViewer.tsx");
  assert.match(previewPage, /story_text/);
  assert.match(previewPage, /illustration_urls/);
  assert.doesNotMatch(previewPage, /price_cents/);
  assert.match(previewPage, /pending_review/);
  assert.match(previewPage, /viewerPages = canReadFullBook/);
  assert.match(previewPage, /\.slice\(0, PREVIEW_PAGE_COUNT\)/);
  assert.match(previewPage, /Your Book Is Being Reviewed/);
  assert.match(bookViewer, /totalPageCount/);
});

test("book pipeline persists generated pages to book_pages", () => {
  const pipeline = read("src/services/book-pipeline.ts");
  const previewRoute = read("src/app/api/generate-preview/route.ts");
  assert.match(pipeline, /upsertBookPages/);
  assert.match(pipeline, /\.from\("book_pages"\)/);
  assert.match(pipeline, /onConflict: "book_id,page_number"/);
  assert.match(previewRoute, /\["draft", "failed"\]\.includes\(book\.status\)/);
});

test("launch checkout exposes only the implemented base digital product", () => {
  const checkoutPage = read("src/app/checkout/page.tsx");
  const checkoutRoute = read("src/app/api/checkout/route.ts");
  const successPage = read("src/app/checkout/success/page.tsx");
  const stripeWebhook = read("src/app/api/webhooks/stripe/route.ts");
  const stripeConfig = read("src/lib/stripe.ts");
  const orderTypes = read("src/types/order.ts");

  assert.match(checkoutPage, /Digital PDF/);
  assert.match(checkoutPage, /book\.status !== "preview_ready"/);
  assert.doesNotMatch(checkoutPage, /Hardcover shipped/);
  assert.doesNotMatch(checkoutPage, /Audio narration/);
  assert.match(checkoutRoute, /tier !== "base"/);
  assert.match(checkoutRoute, /checkout\.sessions\.expire/);
  assert.match(checkoutRoute, /gift_access_token/);
  assert.match(successPage, /!book\.is_purchased/);
  assert.match(stripeWebhook, /Gift recipient delivery happens only after admin approval/);
  assert.doesNotMatch(stripeWebhook, /buildGiftNotificationEmail/);
  assert.doesNotMatch(stripeConfig, /PRICE_MID|PRICE_PREMIUM/);
  assert.match(orderTypes, /PricingTier = "base"/);
});

test("admin and internal email APIs have no open dev fallback", () => {
  const auth = read("src/lib/auth.ts");
  const reviewRoute = read("src/app/api/admin/review-book/route.ts");
  const reviewPage = read("src/app/admin/review/page.tsx");
  const reviewActions = read("src/app/admin/review/ReviewActions.tsx");
  const emailRoute = read("src/app/api/email/route.ts");

  assert.match(auth, /return false;/);
  assert.doesNotMatch(reviewRoute, /return true; \/\/ dev mode/);
  assert.match(reviewRoute, /Book cannot be approved until a PDF has been generated/);
  assert.match(reviewPage, /canApprove={!!book\.pdf_url}/);
  assert.match(reviewActions, /PDF Required/);
  assert.match(emailRoute, /Internal email API is not configured/);
  assert.match(emailRoute, /giftAccessToken/);
  assert.match(emailRoute, /recipientEmail and giftAccessToken are required/);
});

test("private child photo storage and gift token migration are documented", () => {
  const uploadRoute = read("src/app/api/upload-photo/route.ts");
  const createBookRoute = read("src/app/api/create-book/route.ts");
  const photoStep = read("src/components/create/StepPhotoUpload.tsx");
  const storage = read("src/lib/storage.ts");
  const migration = read("supabase/migrations/005_launch_safety.sql");
  const env = read(".env.local.example");

  assert.match(storage, /child-photos/);
  assert.match(uploadRoute, /PHOTO_BUCKET/);
  assert.doesNotMatch(uploadRoute, /\.from\("photos"\)/);
  assert.match(createBookRoute, /photoConsent !== true/);
  assert.match(createBookRoute, /Photo upload and parent\/guardian consent are required/);
  assert.doesNotMatch(photoStep, /Skip/);
  assert.match(migration, /gift_access_token/);
  assert.match(migration, /idx_orders_stripe_checkout_unique/);
  assert.match(env, /INTERNAL_API_SECRET/);
});

test("production build has no Google Fonts network dependency", () => {
  const layout = read("src/app/layout.tsx");
  const globals = read("src/app/globals.css");

  assert.doesNotMatch(layout, /next\/font\/google/);
  assert.match(globals, /--font-baloo:/);
  assert.match(globals, /--font-nunito:/);
});
