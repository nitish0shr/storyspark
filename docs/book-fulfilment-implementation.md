# Book fulfilment: implementation and operations report

**Status: canonical.** This document is the single source of truth for the
Starmee book fulfilment lifecycle, its data contract, configuration, and
operational recovery procedures. Where any older document (including the
historical `books.status` / `orders.status` guidance in
[status-workflows.md](./status-workflows.md)) conflicts with this report, **this
report wins.** The legacy `status` columns are retained for compatibility only.

---

## 1. The eight-stage lifecycle

Every book that flows through the canonical pipeline occupies exactly one of
eight customer-facing lifecycle stages, stored in `books.lifecycle_stage`. The
values are exact, title-cased strings and are enforced by the
`books_lifecycle_stage_check` constraint and independently re-validated by the
`transition_book_lifecycle` RPC:

```
Generated → Under Review → Changes Requested → Revised
          → Approved → Ready for Purchase → Purchased → Delivered
```

Lifecycle stage is **separate** from operational concerns. Generation,
storage, email, and payment failure states live in `books.operational_state` /
`books.operational_error` and `operational_failures`, never in
`lifecycle_stage`. A failed email does not move a book out of its lifecycle
stage.

### 1.1 Stage semantics

| Stage | Meaning | Entry preconditions (enforced by the RPC) |
|---|---|---|
| **Generated** | A complete, immutable version exists: every ordered page has text and an illustration. | A `book_versions` row with a non-empty `content_hash`, `is_complete = true`, contiguous pages 1…`page_count`, and no blank text/illustration. |
| **Under Review** | The exact `review_version_id` is with a human reviewer, with all findings visible. | Complete version with every ordered text/illustration pair. Blocker findings are shown to the reviewer rather than hiding the version. Binds `review_version_id`. |
| **Changes Requested** | A reviewer rejected or requested changes; exactly one structured `revision_requests` row (plus `revision_request_items`) is open. | Reached only from Under Review. |
| **Revised** | A successor immutable version, materially different from its predecessor, satisfies the request. | Complete version; no `blocker` findings; the revision engine confirmed material difference and non-duplication. |
| **Approved** | A human approved the exact reviewed version. Binds `approved_version_id`. | Reached from Under Review or Revised; a non-null `review_version_id` must exactly match the approved version. |
| **Ready for Purchase** | The "Preview and Complete Your Purchase" invitation for the exact approved version was durably confirmed sent. | `approved_version_id` matches; the confirmed `approval_invitation_attempts` row is linked to an unrevoked, unexpired, token-bearing `preview` grant for that exact version. |
| **Purchased** | Stripe payment for the exact approved version was verified. | A paid/fulfilled `orders` row for the exact version with `stripe_payment_intent_id` **and** `payment_verified_at`. |
| **Delivered** (terminal) | The final product is durably stored, access is verified, and a delivery notification was confirmed sent. | See §1.3. |

### 1.2 Legal transition matrix

Enforced identically in SQL (`transition_book_lifecycle`) and in TypeScript
(`src/lib/book-lifecycle.ts`, `LEGAL_TRANSITIONS`), which must be kept in sync:

```
(null)             → Generated
Generated          → Under Review
Under Review       → Approved | Changes Requested
Changes Requested  → Revised | Generated
Revised            → Changes Requested | Approved
Approved           → Ready for Purchase
Ready for Purchase → Purchased
Purchased          → Delivered
Delivered          → (terminal)
```

Every accepted transition is **atomic**, **timestamped** (into the matching
`stage_*_at` column, set only on first entry), increments the optimistic-lock
counter `books.lifecycle_revision`, and appends one row to `lifecycle_events`
keyed by a unique `idempotency_key`. Stale/concurrent updates are rejected with
`stage_conflict` or `revision_conflict`; illegal moves with `illegal_transition`.

### 1.3 Delivered is the strictest gate

`Purchased → Delivered` is refused unless **all** of the following are true for
the **exact approved version** (`transition_book_lifecycle` step 10, mirrored by
`checkVersionCompleteness`/`checkDeliveryPrerequisites` for pre-flight):

1. A `product_artefacts` row of kind `pdf_digital` or `epub` with a non-empty,
   exact-version `storage_path` in the private `final-books` bucket (proved by
   artefact metadata), a non-blank verified customer-route `access_url`, plus
   both `durable_verified_at` and `access_verified_at`. The durable `url` stores
   only `private://final-books/...` object identity; no public or signed object
   URL is persisted.
2. Exactly one paid/verified order exists for the book/version.
3. A `delivery_attempts` row with `status = 'sent'`, `notification_sent_at`,
   and `access_verified_at` is linked by `access_grant_id` to the **same**
   usable, unrevoked, unexpired, verified full-book/download/gift grant sent to
   the customer, and that grant is bound to the exact order/version.
4. `approved_version_id` equals the version being delivered.

Only that proven order becomes `fulfilled` (`fulfilled_at` set) on transition.
Delivery is **never** inferred from provider acceptance or from unrelated grant
and attempt rows.

---

## 2. Immutable version binding

- `book_versions` and `book_version_pages` are **immutable after insert**:
  `reject_version_mutation()` triggers raise on direct UPDATE/DELETE. Nested
  foreign-key cascades remain permitted so intended book/profile deletion does
  not strand immutable children.
- New versions are created only via the `create_book_version_snapshot` RPC,
  which validates every page (positive page number, non-blank text and
   illustration, a content hash, and contiguous page numbers from 1) and
   requires any predecessor to belong to the same book. It serialises version
   numbering per book with an advisory transaction lock. A partial or
   incomplete version can never become visible to review.
- Successor versions carry a `predecessor_id`; the durable count of versions
  with a predecessor is the revision attempt counter (no mutable column).
- Review, approval, checkout, payment, access, and delivery are all bound to a
  single immutable version id. The RPC re-checks version identity server-side:
  approval requires the version to equal `review_version_id`; Ready for
  Purchase / Purchased / Delivered require it to equal `approved_version_id`.
- `book_review_tokens.version_id` references the exact immutable snapshot.
  Canonical token creation never falls back to an unbound token; persistence
  failure is recorded as an operational error and can be retried while the book
  remains Under Review. An Under Review/Revised row missing
  `review_version_id` is routed to reconciliation and never substitutes
  `current_version_id`.
- `books` carries three version pointers — `current_version_id`,
  `review_version_id`, `approved_version_id` — plus `lifecycle_revision`.

---

## 3. Migration 010: application order and compatibility mappings

Migration file: `supabase/migrations/010_canonical_book_fulfilment.sql`. It is
**additive, data-preserving, and safe to re-run**. It does not rewrite
historical migrations (001–009). It does replace/add selected constraints,
indexes, policies, triggers, and function definitions where required to enforce
the canonical contract. Apply it **after** all earlier migrations, in numeric
order. It is prepared and statically verified by this change, but is not applied
automatically by application startup.

### 3.1 Internal application order (single file, runs top to bottom)

1. `books` additive columns: `lifecycle_stage` (+ CHECK), operational state,
   the eight `stage_*_at` timestamps, version pointers, `lifecycle_revision`.
2. Immutable tables `book_versions`, `book_version_pages` (+ immutability
   triggers), exact-version binding for `book_review_tokens`, and
   `book_quality_findings`.
3. `revision_requests`, `revision_request_items`, `lifecycle_events`,
    `product_artefacts`; the private `final-books` storage bucket is created or
    repaired with service-role-only object access.
4. `orders` additive columns (`version_id`, `checkout_idempotency_key`,
   `checkout_reservation_expires_at`, `payment_verified_at`,
   `purchaser_email`, `fulfilled_at`, etc.), relaxation of `user_id` NOT NULL,
   and the `orders_customer_identity_check` (a row must have a `user_id` **or**
   a non-blank `purchaser_email`).
5. Idempotency/attempt tables: `stripe_webhook_events`, `checkout_attempts`,
   `access_grants`, `approval_invitation_attempts`, `delivery_attempts`,
   `operational_failures`.
6. Deferred foreign keys from `books`/`orders` version pointers to
   `book_versions` (added once the table exists).
7. **Conservative legacy backfill** (§3.2).
8. RLS enablement + least-privilege policies. Authenticated ownership alone
   cannot read full immutable snapshots/pages or final artefact locations:
   those require an exact verified paid-order grant. Before payment, only
   selected preview pages can pass the linked restricted-preview-grant policy.
   Service-role-only tables have no anon/authenticated write policy.
9. Hardened privileged functions: `reject_version_mutation`,
    `create_book_version_snapshot`,
   `transition_book_lifecycle`, `record_verified_payment_and_purchase`, and
    `create_revision_request_and_transition`. Each uses `search_path = ''`,
    explicitly qualified application objects, deterministic `postgres`
    ownership, rerun-safe ACL repair, and service-role-only execution.

Re-run safety: every table uses `IF NOT EXISTS`; policies and triggers are
DO-block guarded; column additions use `ADD COLUMN IF NOT EXISTS`; the
`stripe_webhook_events` block re-upgrades an earlier draft's shape idempotently.

### 3.2 Conservative compatibility mappings (backfill)

Rules are deliberately conservative: **stage is never inferred from
`books.status` alone**, and financial history is fully preserved.

1. **Compatibility snapshot.** Build a single immutable version (`version_number
   = 1`, `is_complete = true`) **only** where the legacy JSON demonstrably has
    the same non-zero number of ordered text and image pages, each JSON page's
    explicit `pageNumber` matches its 1-based position, no text/illustration is
    blank, and a deterministic content hash can be recorded. Otherwise no
    snapshot is built.
2. **Version pointers.** Set `current_version_id` to that complete snapshot.
3. **Order binding.** Bind only when the compatibility snapshot is the only
   immutable version for the book and there is exactly one historical financial
   row that already has `status in ('paid','fulfilled')`, a
   `stripe_payment_intent_id`, and `payment_verified_at`. A legacy
   `payment_confirmed_at` value is never upgraded into verified-payment
   evidence. Every order row and amount is retained.
4. **Purchased** — only from **exact paid-order evidence**: a paid/fulfilled
   order for `current_version_id` with a `stripe_payment_intent_id` and
   `payment_verified_at`. Sets `approved_version_id = current_version_id`.
   Purchased is never derived from a book status.
5. **Approved** — `status = 'approved'` **and** `reviewed_at` set **and** a
   complete snapshot exists (and not already mapped Purchased).
6. **Under Review** — `status = 'pending_review'` with a complete snapshot;
   binds `review_version_id`.
7. **Generated** — `status in ('complete','preview_ready')` with a complete
   snapshot (content demonstrably exists).
8. **All other rows** are left with `lifecycle_stage = NULL`: ambiguous /
    recoverable, in a non-terminal state. Advanced-looking rows get an
    unresolved `legacy_reconciliation_required` operational failure so they are
    visible to operators rather than guessed.
9. **No inferred Delivered — ever.** The legacy schema never recorded an actual
   successful access response, so a stored PDF URL plus provider acceptance is
   **insufficient proof**. Paid legacy rows stay at Purchased and must pass the
   canonical finalisation/access verification before they can reach Delivered.
10. `stage_delivered_at` is never inferred from a legacy timestamp. Approved
    timestamps are retained only for records that passed the Approved/Purchased
    evidence gates; a compatibility `lifecycle_events` row is appended once per
    mapped book (idempotent by key).
11. Active review tokens are retained only when they are bound to the exact
    complete `review_version_id` of a canonical Under Review/Revised book.
    Unbound, incomplete, mismatched, or lifecycle-null legacy tokens are marked
    used, expired immediately, and surfaced as
    `legacy_review_token_sealed`; they are never rebound by inference.

### 3.3 Live legacy reconciliation inventory (2026-08-20)

The pre-rollout read-only reconciliation found **28/28 legacy books
snapshot-ineligible**: 18 `preview_ready`, 4 `pending_review`, 5 `failed`, and 1
legacy row falsely labelled `delivered`. None has a provable complete immutable
page set, so the expected migration result is **zero compatibility versions and
zero canonical lifecycle promotions** for this inventory.

Three active review tokens belong to the incomplete `pending_review` rows.
Migration 010 seals those links instead of guessing a version. The false
Delivered row remains lifecycle-null and is ineligible for generation,
Purchased, or Delivered promotion until its financial/delivery evidence is
separately reconciled.

---

## 4. Required configuration

| Variable | Purpose | Notes |
|---|---|---|
| Supabase URL + service-role key | DB access; the fulfilment RPCs are `service_role`-only. | Server-only. Never exposed to the client. |
| `STRIPE_SECRET_KEY` | Stripe API. Use a **test-mode** key in all non-production work. | `isStripeConfigured()` gates checkout/webhook. |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook signatures. | Webhook returns 503 if absent. |
| `EMAIL_MODE` | Runtime email policy. | Non-production accepts only `suppress` (default) or `capture`; production must explicitly set `provider`. |
| `SENDGRID_API_KEY` | Production outbound provider credential. | Ignored for delivery in non-production. Required with production `EMAIL_MODE=provider`. |
| `EMAIL_FROM` | Verified production SendGrid sender. | Required with production `EMAIL_MODE=provider`; there is no implicit production fallback. |
| `INTERNAL_API_SECRET` | Authenticates the internal generic email endpoint. | Endpoint fails closed with 503 when absent. |
| `NEXT_PUBLIC_APP_URL` | Builds review/preview/delivery links. | Used by review-workflow and pipeline. |
| `PREVIEW_TOKEN_TTL_DAYS` | Lifetime of the approval preview access grant. | Defaults to 30. |
| `REVIEW_EMAIL` / `ADMIN_EMAIL` | Reviewer inbox for "story waiting for review". | First non-empty wins. |

---

## 5. Stripe test-mode procedure

- Use a **test-mode** `STRIPE_SECRET_KEY` (and the matching test
  `STRIPE_WEBHOOK_SECRET`). Never use a live key in development, tests, or
  manual acceptance.
- Drive payments with Stripe test cards (e.g. `4242 4242 4242 4242`) or the
  Stripe CLI to forward/replay webhook events locally.
- The webhook (`/api/webhooks/stripe`) verifies the signature, then atomically
  **claims** the event in `stripe_webhook_events` before any side effect. Only
  `record_verified_payment_and_purchase` may mark an order paid and transition
  Ready for Purchase → Purchased, and only after amount/currency/identity and
  exact-version checks pass.
- Automated tests never contact Stripe: they exercise
  `webhook-idempotency.ts` decision logic and the RPC contract directly. No test
  charges a real card.

## 6. Email modes and fail-closed provider policy

- In every environment where `NODE_ENV != production`, outbound email is
  non-networking by construction. The default mode is suppression; set
  `EMAIL_MODE=capture` to use the internal capture result. Even if a SendGrid
  credential is present or `EMAIL_MODE=provider` is requested, no provider
  request is made and no real recipient is addressed.
- Suppression returns `{ sent: false, reason: "suppressed_not_sent" }`; capture
  returns `{ sent: false, provider: "capture", reason: "captured_not_sent" }`.
  Capture means accepted by the local adapter, **not sent**.
- Production fails closed unless all three conditions are explicit:
  `EMAIL_MODE=provider`, `SENDGRID_API_KEY`, and `EMAIL_FROM`. Missing any one
  returns an unavailable/unsent result without a provider call. Resend is not a
  fulfilment provider path; purchase, gift, subscription, reviewer, password
  reset, and delivery messages all route through `sendEmail()`.
- Callers treat `sent: false` as "not delivered" and never advance the
  lifecycle on it: an unsent approval invitation keeps the book at Approved and
  records an operational failure; an unsent delivery email keeps the book at
  Purchased. Purchase confirmation is non-essential: its failure is recorded
  durably but does not prevent exact-version access/artefact finalisation from
  running. Admins can retry failed approval invitations and purchase
  confirmations from the Books screen. The automated suite proves that a
  non-production process cannot invoke a configured provider.
- Provider delivery is not part of non-production acceptance. Production
  readiness must be reviewed separately with a verified sender and explicit
  provider mode before rollout.

## 6.1 Private final-book links

- Migration 010 must be applied before canonical fulfilment so the
  `final-books` bucket exists and is private. The service role is the only role
  with object access; authenticated and anonymous clients receive no storage
  policy.
- Artefact rows persist the bucket/object identity only. The status and checkout
  success surfaces mint a new URL with a maximum 15-minute TTL after confirming
  Delivered, exact approved version, exact verified payment, and owner or
  paid-order-bound access authorisation.
- Signed URLs are bearer capabilities. Do not log, persist, analytics-tag, or
  forward them. Refresh by repeating the authorised status request; never reuse
  an expired URL or fall back to a public object URL.

---

## 7. Rollback and reconciliation limits

- **No historical migration is rewritten.** Before applying 010, take a database
  backup. After canonical application code is active, do not drop 010 objects
  without rolling the application code back in lockstep: the new code requires
  the canonical columns/RPCs. Financial history remains in `orders`; immutable
  versions and lifecycle evidence must be preserved during any rollback.
- Immutable versions/pages **cannot be edited or deleted** in place (triggers
  block it); "rollback" of content is achieved by generating a new successor
  version, never by mutating an existing one.
- **Delivered is terminal** and is never reversed by reconciliation. It is only
  ever reached through the verified path.
- Reconciliation **never recharges a customer**. Every operator procedure below
  is read-mostly or advances an already-paid book toward delivery using
  idempotent RPCs — it never creates a checkout session or payment intent.
- Ambiguous legacy rows (`lifecycle_stage IS NULL`) are recoverable but remain
  non-terminal until an operator supplies the missing evidence. They are listed
  explicitly on `/admin/books`, are never auto-regenerated, and are never
  auto-promoted to Purchased or Delivered.

---

## 8. Idempotent retries and reconciliation

All of the following are safe to re-run; re-running never double-charges,
double-generates, or double-fulfils.

- **Generation** (`book-pipeline.generatePreview`): resumable; the immutable
  snapshot must be created before any transition, and incomplete pages abort
  before snapshotting. Attempts/errors are recorded; re-running an already
  Generated/Under Review book is a quiet no-op.
- **Controlled legacy generation** (`/admin/books`): available only to
  allow-listed reviewer/admin users for lifecycle-null, unpaid
  `preview_ready`/`pending_review`/`failed` rows with no complete immutable
  version. It requires the book-specific typed confirmation plus a checkbox
  acknowledging one story and 12 illustration generations. The route claims
  the row before AI work, revokes stale review tokens, requires a contiguous
  12-page skeleton and 12-page output, and disables automatic validation-gate
  regeneration. Success creates a new immutable version and enters Generated,
  then Under Review; no existing version is mutated. The public preview endpoint
  accepts only a newly created lifecycle-null `draft`, and the generation
  service independently rejects every other legacy/default invocation, so owner
  or anonymous requests cannot bypass the admin claim and cost controls.
- **Revision** (`revision-engine.applyRevision`): bounded to
  `MAX_REVISION_ATTEMPTS = 2` via the durable successor count; duplicate/
  near-duplicate output (content hash + text similarity ≥ 0.95) is rejected and
  recorded; only a materially different, valid successor transitions to Revised.
- **Webhook claims** (`stripe_webhook_events`): an event is atomically claimed
  with a bounded lease; concurrent deliveries get 503; already-sealed events
  short-circuit; transient failures release the claim and return 503 so Stripe
  retries.
- **Payment** (`record_verified_payment_and_purchase`): the order update and
  Purchased transition commit together; a replay of an already-paid,
  already-Purchased book returns `idempotent_replay = true` and does not
  re-charge, re-generate, or duplicate the transition. Reusing an idempotency
  key with a different checkout/payment/version identity fails closed.
- **Checkout reservation**: a pending order is persisted before Stripe. If a
  process stops before Stripe creation or before session binding, retry reuses
  that same order and an order-scoped Stripe idempotency key. An unbound
  reservation is not released merely because its operational lease elapsed;
  only a definite request/authentication/permission rejection releases it. A
  duplicate concurrent insert recovers only the exact same operation's winning
  reservation before Stripe; it never attaches to another buyer's attempt.
- **Artefacts** (`finalisePurchasedBook`): reuses an existing exact-version
  private `pdf_digital` object when a freshly minted bounded URL is reachable;
  otherwise rebuilds and re-verifies. Stored artefacts carry only private
  bucket/object identity; the immutable version row is never mutated.
- **Access** grants: full-book grants are minted per attempt with a fresh raw
  token, and the customer route/authorisation is verified deterministically
  before `verified_at` is set; stale unsent grants are revoked before reminting.
- **Invitation** (`sendApprovalInvitation`): the attempt is durably reserved as
  `pending` before provider work. A unique key serialises concurrent requests;
  a confirmed `sent` attempt short-circuits, while an ambiguous `pending`
  attempt is not automatically resent and requires reconciliation. Failed
  attempts on Approved books can be retried from the authenticated admin Books
  screen.
- **Purchase confirmation** (`attemptPurchaseConfirmation`): uses a conditional
  pending claim and records sent/failed/ambiguous provider outcomes on the
  order. Failure never blocks paid-book finalisation; an authenticated admin
  retry is available for Purchased/Delivered books and never touches payment.
- **Delivery** (`delivery_attempts` + `finalisePurchasedBook`): one exact
  order/version/channel attempt is reserved as `pending` **before any full-book
  grant is revoked or minted**. The attempt is then bound to that specific
  verified grant before provider work. A prior confirmed `sent` attempt replays
  the Delivered transition only while its linked grant remains usable; an
  ambiguous pending attempt requires reconciliation rather than a duplicate
  notification.

---

## 9. Operator queries and procedures (never recharge)

> All queries below are read-only diagnostics. The recovery *actions* advance an
> already-paid book toward delivery via idempotent service-role RPCs and never
> create a Stripe session, payment intent, or charge.

**Stuck at Purchased (awaiting delivery):**
```sql
select b.id, b.lifecycle_stage, b.approved_version_id, of.error_code, of.error_detail
from public.books b
left join public.operational_failures of
  on of.book_id = b.id and of.resolved_at is null
where b.lifecycle_stage = 'Purchased'
order by b.updated_at asc;
```
Recovery: re-run `finalisePurchasedBook(bookId, approvedVersionId, orderId)`.
It is idempotent, no-ops when the order is already fulfilled, and only advances
to Delivered once artefact/access/notification are verified.

**Stuck at Approved (invitation failed):** use **Retry invitation** on
`/admin/books`. The POST-only action re-authenticates the allow-listed admin,
requires Approved plus an exact `approved_version_id`, and reuses the idempotent
invitation/Ready-for-Purchase workflow.

**Failed purchase confirmation:** use **Retry purchase email** on
`/admin/books`. The POST-only action requires an allow-listed admin and a
verified paid/fulfilled order. It retries only the notification claim and never
creates a checkout, payment intent, or payment transition.

**Ambiguous legacy rows to reconcile (never auto-promoted):**
```sql
select b.id, b.status, b.current_version_id, b.reviewed_at,
       of.error_code, of.error_detail, of.context
from public.books b
left join public.operational_failures of
  on of.book_id = b.id
 and of.error_code = 'legacy_reconciliation_required'
 and of.resolved_at is null
where b.lifecycle_stage is null
order by b.created_at asc;
```
Recovery: confirm a complete immutable version exists; only then use
`transition_book_lifecycle` to place the book at the correct **non-financial**
stage. Never map to Purchased/Delivered without exact paid-order and verified
access evidence.

For a snapshot-ineligible, unpaid row, use **Controlled legacy recovery** on
`/admin/books`. The page lists every lifecycle-null record outside the normal
100-book table limit and explains why each is eligible or blocked. An eligible
recovery requires typing `REGENERATE <first-8-book-id>`, acknowledging the
12-page AI cost, and submitting the admin-only POST. It performs one generation
attempt only; retrying after a definite failure requires another explicit
confirmation. Rows with payment evidence, an existing complete version, a
canonical stage, an active generation, a non-12-page theme, or legacy status
`delivered` are blocked.

**Paid but never Purchased (payment/transition mismatch):**
```sql
select o.id as order_id, o.book_id, o.version_id, o.payment_verified_at, b.lifecycle_stage
from public.orders o
join public.books b on b.id = o.book_id
where o.status in ('paid','fulfilled')
  and o.stripe_payment_intent_id is not null
  and o.payment_verified_at is not null
  and b.lifecycle_stage in ('Ready for Purchase');
```
Recovery: re-invoke the payment/purchase reconciliation for the existing
verified order — it replays idempotently and never re-charges.

**Delivered audit (timestamps + private object identity):**
```sql
select b.id, b.stage_delivered_at, pa.kind, pa.storage_path,
       pa.metadata->>'storage_bucket' as storage_bucket,
       pa.durable_verified_at, pa.access_verified_at
from public.books b
join public.product_artefacts pa on pa.book_id = b.id and pa.version_id = b.approved_version_id
where b.lifecycle_stage = 'Delivered';
```

---

## 10. Retiring legacy paths

- Legacy webhook writes for `pending_approval` are removed; the canonical
  webhook only advances via `record_verified_payment_and_purchase`.
- Old GET approval/rejection routes no longer mutate records; all lifecycle
  changes go through `transition_book_lifecycle`.
- Legacy `books.status`/`orders.status` columns remain for read compatibility
  only (see the compatibility mapping in `src/lib/book-lifecycle.ts`
  `LEGACY_STATUS_TO_STAGE`, used only when `lifecycle_stage` is NULL).

---

## 11. Test evidence

| Item | Command | Result |
|---|---|---|
| Unit + integration suite | `npm test` | **Passed: 308 tests, 0 failures** |
| TypeScript | `npx tsc --noEmit` | **Passed** |
| Production build | `npm run build` | **Passed**; existing non-blocking lint/dynamic-render diagnostics remain in build output |
| Safe browser smoke | Playwright desktop | **Passed**: homepage rendered; fake preview returned the safe not-found UI; unauthorised book-status/generate-PDF requests returned safe 4xx responses without private paths |
| Independent implementation review | Architect review of migration/lifecycle/review/checkout/webhook/access/delivery | **Passed** after the concurrent delivery-grant identity race and its stale assertion were corrected |
| Security scans | Dependency audit + SAST + privacy/dataflow scan | **SAST/dataflow: 0 findings; dependency audit: 0 critical, 18 high advisories** in the existing Next.js 14/dev-toolchain dependency graph. The direct Next.js fixes require a major framework upgrade and are tracked separately; resolve before production rollout. |
| Controlled-data manual acceptance | [book-fulfilment-manual-acceptance.md](./book-fulfilment-manual-acceptance.md) | **Pending** in an isolated database after applying migration 010, with Stripe test mode and suppressed/captured email |

The migration was not applied to the configured database in this task. The
automated tests used synthetic data and did not contact Stripe or an email
provider. No real customer email was sent, no card was charged, and nothing was
published.
