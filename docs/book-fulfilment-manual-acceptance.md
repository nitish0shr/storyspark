# Book fulfilment: manual acceptance checklist

**Mocks / test-mode only.** Do this entire checklist with email suppressed
(`SENDGRID_API_KEY` **unset**) and Stripe in **test mode** (test
`STRIPE_SECRET_KEY` + test `STRIPE_WEBHOOK_SECRET`). Never charge a real card,
never send to a real customer inbox, never publish.

Canonical lifecycle and semantics are defined in
[book-fulfilment-implementation.md](./book-fulfilment-implementation.md); this
checklist verifies them by hand. Tick each box and record the observed result.

Legend: **Expect** = required behaviour. `[ ]` = pass/fail box.

---

## Repository verification status (2026-08-20)

Completed without external side effects:

- `npm test`: 271 passed, 0 failed.
- TypeScript no-emit check: passed.
- Production build: passed with existing non-blocking warnings/diagnostics.
- Safe desktop/mobile browser smoke: passed for the homepage, retired admin GET
  routes, invalid review token, and invalid preview fail-closed behaviour.
- Independent implementation review: passed after replay and access findings
  were corrected.

Not executed here:

- Applying migration 010 to the configured database.
- Controlled-data review/revision/payment/delivery scenarios below.
- Stripe Checkout or webhook requests, even in test mode.
- Any real or captured SendGrid delivery.

Those scenarios require an isolated migrated database and explicit test-mode
provider setup. Unchecked items below must not be interpreted as passed.

---

## A. Review — read-only exact version

- [ ] Open the reviewer link for a book in **Under Review**.
  **Expect:** every ordered page shows its text paired with its illustration,
  in order, for the exact `review_version_id`, plus any page-specific quality
  warnings. Opening the link changes nothing.
- [ ] Confirm no approve/reject happens merely by viewing.
  **Expect:** stage stays Under Review until a decision is made.

## B. Reject / request changes

- [ ] Submit **Request Changes** with empty feedback / no affected pages.
  **Expect:** blocked with a clear message; nothing recorded.
- [ ] Submit **Request Changes** with mandatory feedback, ≥1 affected page, and
  a scope of text / illustration / both.
  **Expect:** exactly one `revision_requests` row (decision
  `request_changes`) + per-page `revision_request_items`; single transition
  Under Review → Changes Requested; review tokens revoked.
- [ ] Repeat with **Reject**.
  **Expect:** same structure with decision `reject`; single transition.
- [ ] After a successful successor reaches **Revised**, request another targeted
  correction and replay the same submission once.
  **Expect:** Revised → Changes Requested; exactly one new request and item set;
  the replay returns the original request without duplicating rows.

## C. Scope-targeted revision

- [ ] Trigger a revision targeting only specific pages/fields (e.g. text on
  page 3, illustration on page 5).
  **Expect:** unaffected pages retained byte-for-byte; only targeted fields
  regenerated; a **new immutable** successor version with a `predecessor_id`.
- [ ] Confirm the successor cannot become **Revised** unless it materially
  differs and resolves the request.
  **Expect:** a duplicate/near-duplicate output (content hash identical or text
  similarity ≥ 0.95) is rejected and recorded in `operational_failures`; the
  book stays Changes Requested with an actionable error.
- [ ] Exhaust attempts (2).
  **Expect:** `revision_retry_exhausted` recorded; no infinite loop; no
  transition to Revised.

## D. Before / after and quality findings

- [ ] Inspect the before/after diff for a successful revision.
  **Expect:** changed pages and text/illustration deltas are visible.
- [ ] Confirm quality findings persist version, page, code, explanation,
  severity, and text/image/both source.
  **Expect:** harmless fantasy / dinosaur / fictional-monster contexts are
  advisory or accepted (reduced false positives); genuine safety/anatomy/
  distortion checks still fire.
- [ ] Confirm `blocker` findings remain visible when the complete version enters
  Under Review, but block a requested successor from becoming Revised.
  **Expect:** reviewers see the finding; the unresolved revision transition is
  rejected with `blocking_quality_findings`.

## E. Approval binds the exact version

- [ ] Approve using a review link whose version ≠ `review_version_id`.
  **Expect:** rejected ("different version…"); no approval.
- [ ] Approve the exact reviewed version.
  **Expect:** Under Review/Revised → Approved; `approved_version_id` bound;
  review tokens revoked; a fresh **preview** access grant minted (never the
  review token reused).

## F. Restricted preview + invitation

- [ ] Confirm the approval invitation email body's main action reads exactly
  **"Preview and Complete Your Purchase"** and links to the approved version
  without exposing secrets. (With email suppressed, verify the composed message
  / attempt row rather than an inbox.)
- [ ] Open the customer preview before payment.
  **Expect:** only one or two explicitly selected approved pages are visible,
  with the configured price and a clear purchase button.
- [ ] Click the invitation link repeatedly.
  **Expect:** safe/idempotent; no duplicate invitation; only one `sent`
  `approval_invitation_attempts` row per (book, version).
- [ ] Confirm the book only reaches **Ready for Purchase** after the invitation
  is confirmed sent. With email suppressed, the book stays **Approved** and an
  operational failure is recorded.
- [ ] After a failed invitation, sign in as an allow-listed admin and use
  **Retry invitation** on the Books screen with a mock successful provider.
  **Expect:** the exact approved version is reused; one confirmed invitation;
  Approved → Ready for Purchase without a fresh review decision.

## G. Checkout blocking (stale / unapproved)

- [ ] Attempt checkout on a book **not** in Ready for Purchase (e.g. Under
  Review, Approved-only, already Purchased/Delivered).
  **Expect:** blocked (409); no Stripe session created.
- [ ] Attempt checkout on a **legacy** book with `lifecycle_stage = NULL`.
  **Expect:** blocked with "must be reconciled to an approved version".
- [ ] Attempt checkout supplying a `versionId` that ≠ `approved_version_id`.
  **Expect:** version-mismatch rejection.

## H. Anonymous vs account ownership

- [ ] As the authenticated owner, start checkout.
  **Expect:** allowed; order carries `user_id`.
- [ ] As an anonymous visitor with a valid exact-version preview token, start
  checkout **with** `purchaserEmail`.
  **Expect:** allowed; order carries `purchaser_email`, `user_id` null.
- [ ] Anonymous without a valid token, or token for a stale version, or missing
  `purchaserEmail`.
  **Expect:** rejected (401/400 as appropriate); no session.

## I. Payment replay and concurrency

- [ ] Replay the same test `checkout.session.completed` event twice.
  **Expect:** second delivery short-circuits (`idempotent = true` / sealed
  event); Purchased recorded once; no second charge, no duplicate transition.
- [ ] Simulate concurrent delivery of the same event.
  **Expect:** one worker claims it; the other receives 503; no double
  processing.
- [ ] Deliver `checkout.session.expired` after the completed-payment event.
  **Expect:** the paid/fulfilled order is not downgraded to failed.
- [ ] Feed an event whose amount/currency/identity/version mismatches the order.
  **Expect:** rejected as non-retryable; order not marked paid.
- [ ] Suppress only the purchase-confirmation send and process a verified
  payment.
  **Expect:** confirmation status/error recorded, but full-access/artefact
  finalisation still runs. The notification can later be retried from the
  authenticated admin Books screen without replaying payment.

## J. Full access after payment

- [ ] After a verified test payment, confirm the book is **Purchased** and a
  full-book/download access grant exists for the exact approved version.
  **Expect:** exact-version unlock; complete book/download access available.

## K. Artefact and access checks before delivery

- [ ] Confirm a `pdf_digital`/`epub` `product_artefacts` row with both
  a non-empty `storage_path`, `durable_verified_at`, and `access_verified_at`.
- [ ] Confirm the access grant is verified (`verified_at` set) via the actual
  customer route, not a trusted URL string.
- [ ] Attempt to force Delivered while any prerequisite is missing.
  **Expect:** transition rejected (`artefact_not_verified` /
  `access_grant_not_verified` / `delivery_not_confirmed`); book stays Purchased.

## L. Email failure / retry (delivery)

- [ ] With email suppressed, run finalisation.
  **Expect:** book **remains Purchased**; a `delivery_attempts` row with
  `status = 'failed'` and an `operational_failures` row are recorded; **not**
  Delivered.
- [ ] Re-run finalisation after "enabling" a mock successful send.
  **Expect:** it retries safely, records a `sent` attempt, and only then
  transitions Purchased → Delivered; the order becomes `fulfilled`.

## M. Delivery replay

- [ ] Re-run finalisation on an already-Delivered book.
  **Expect:** idempotent no-op (order already fulfilled); no duplicate email,
  artefact, grant, or fulfilment; stage stays Delivered.
- [ ] With a prior `sent` delivery attempt present, re-run.
  **Expect:** Delivered replay transition succeeds idempotently.

## N. Legacy recovery (never recharge)

- [ ] Take a legacy paid row mapped to **Purchased** by migration 010.
  **Expect:** it is **not** Delivered (no inferred delivery); it can only reach
  Delivered by passing canonical artefact/access/notification verification.
- [ ] Take an ambiguous legacy row (`lifecycle_stage = NULL`).
  **Expect:** it is non-terminal and requires operator reconciliation; it is
  never auto-promoted to Purchased or Delivered.
- [ ] Run any operator reconciliation procedure from the implementation report.
  **Expect:** no Stripe session/charge is ever created; the customer is never
  recharged; only idempotent lifecycle advancement occurs.

---

### Sign-off

| Section | Pass? | Notes |
|---|---|---|
| A–N controlled-data acceptance | _Pending_ | Requires isolated migrated database plus explicit Stripe/email test setup. |
| Automated tests | **Pass** | 271/271 |
| TypeScript | **Pass** | No-emit check |
| Production build | **Pass** | Existing non-blocking diagnostics only |
| Safe browser smoke | **Pass** | Desktop and mobile |

Confirm at completion: **no real email sent, no real card charged, nothing
published.**
