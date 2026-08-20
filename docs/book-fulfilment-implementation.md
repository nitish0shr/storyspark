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
| **Generated** | A complete, immutable version exists: every ordered page has text and an illustration. | A `book_versions` row with `is_complete = true`, page count matching `book_version_pages`, and no blank text/illustration. |
| **Under Review** | The exact `review_version_id` is with a human reviewer, with all findings visible. | Complete version with every ordered text/illustration pair. Blocker findings are shown to the reviewer rather than hiding the version. Binds `review_version_id`. |
| **Changes Requested** | A reviewer rejected or requested changes; exactly one structured `revision_requests` row (plus `revision_request_items`) is open. | Reached only from Under Review. |
| **Revised** | A successor immutable version, materially different from its predecessor, satisfies the request. | Complete version; no `blocker` findings; the revision engine confirmed material difference and non-duplication. |
| **Approved** | A human approved the exact reviewed version. Binds `approved_version_id`. | Reached from Under Review or Revised; the approved version must equal `review_version_id` when set. |
| **Ready for Purchase** | The "Preview and Complete Your Purchase" invitation for the exact approved version was durably confirmed sent. | `approved_version_id` matches; a confirmed `approval_invitation_attempts` row (`status = 'sent'`, `notification_sent_at` set) exists for that exact version. |
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
Revised            → Under Review | Approved
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

1. A `product_artefacts` row of kind `pdf_digital` or `epub` with a non-empty
   `storage_path`, plus both `durable_verified_at` and `access_verified_at` set
   (storage **and** the customer access URL verified by real responses).
2. A usable `access_grant` (`full_book`/`download`/`gift`), not revoked, not
   expired, with `verified_at` set, joined to a paid/verified order.
3. A `delivery_attempts` row with `status = 'sent'`, `notification_sent_at`,
   and `access_verified_at`, joined to the same paid/verified order.
4. `approved_version_id` equals the version being delivered.

Only on this transition does the order become `fulfilled` (`fulfilled_at` set).
Delivery is **never** inferred from provider acceptance alone.

---

## 2. Immutable version binding

- `book_versions` and `book_version_pages` are **immutable after insert**:
  `reject_version_mutation()` triggers raise on any UPDATE/DELETE.
- New versions are created only via the `create_book_version_snapshot` RPC,
  which validates every page (positive page number, non-blank text and
  illustration, no duplicate page numbers) and serialises version numbering per
  book with an advisory transaction lock. A partial or incomplete version can
  never become visible to review.
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
   `product_artefacts`.
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
8. RLS enablement + owner-scoped policies; service-role-only tables left with
   no anon/authenticated policies.
9. SECURITY DEFINER RPCs: `create_book_version_snapshot`,
   `transition_book_lifecycle`, `record_verified_payment_and_purchase`, and
   `create_revision_request_and_transition`, each revoked from
   public/anon/authenticated and granted to `service_role` only.

Re-run safety: every table uses `IF NOT EXISTS`; policies and triggers are
DO-block guarded; column additions use `ADD COLUMN IF NOT EXISTS`; the
`stripe_webhook_events` block re-upgrades an earlier draft's shape idempotently.

### 3.2 Conservative compatibility mappings (backfill)

Rules are deliberately conservative: **stage is never inferred from
`books.status` alone**, and financial history is fully preserved.

1. **Compatibility snapshot.** Build a single immutable version (`version_number
   = 1`, `is_complete = true`) **only** where the legacy JSON demonstrably has
   the same non-zero number of ordered text and image pages, with no blank text
   and no blank illustration URL. Otherwise no snapshot is built.
2. **Version pointers.** Set `current_version_id` to that complete snapshot.
3. **Order binding.** Bind historical paid orders
   (`status in ('paid','fulfilled')` with a `stripe_payment_intent_id`) to the
   compatibility version and set `payment_verified_at` from the best available
   existing timestamp. Every order row and amount is retained.
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
   recoverable, in a non-terminal state, to be reconciled by an operator.
9. **No inferred Delivered — ever.** The legacy schema never recorded an actual
   successful access response, so a stored PDF URL plus provider acceptance is
   **insufficient proof**. Paid legacy rows stay at Purchased and must pass the
   canonical finalisation/access verification before they can reach Delivered.
10. Stage timestamps are backfilled from existing columns (`delivered_at`,
    `reviewed_at`) only where present; a compatibility `lifecycle_events` row is
    appended once per mapped book (idempotent by key).

---

## 4. Required configuration

| Variable | Purpose | Notes |
|---|---|---|
| Supabase URL + service-role key | DB access; the fulfilment RPCs are `service_role`-only. | Server-only. Never exposed to the client. |
| `STRIPE_SECRET_KEY` | Stripe API. Use a **test-mode** key in all non-production work. | `isStripeConfigured()` gates checkout/webhook. |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook signatures. | Webhook returns 503 if absent. |
| `SENDGRID_API_KEY` | Enables outbound email (`isEmailConfigured()`). | **Leave unset to suppress all email** (§6). |
| `EMAIL_FROM` | From address for SendGrid. | Optional; defaults to `hello@starmeestories.com`. |
| `NEXT_PUBLIC_APP_URL` | Builds review/preview/delivery links. | Used by review-workflow and pipeline. |
| `PREVIEW_TOKEN_TTL_DAYS` | Lifetime of the approval preview access grant. | Defaults to 30. |
| `REVIEW_EMAIL` / `ADMIN_EMAIL` | Reviewer inbox for "story waiting for review". | First non-empty wins. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Gift-notification email path only. | Optional; gift email is best-effort. |

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

## 6. Email suppression procedure

- Email is suppressed when `SENDGRID_API_KEY` is unset:
  `sendEmail()` logs and returns `{ sent: false, reason: "not_configured" }`
  without contacting any provider and **never throws**.
- Callers treat `sent: false` as "not delivered" and never advance the
  lifecycle on it: an unsent approval invitation keeps the book at Approved and
  records an operational failure; an unsent delivery email keeps the book at
  Purchased. Before any manual acceptance run, verify the isolated environment
  does not expose a SendGrid key. The automated suite uses synthetic decision
  logic and never invokes a configured provider.
- To exercise real delivery in a controlled environment, set `SENDGRID_API_KEY`
  and address only inboxes you own.

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
  non-terminal until an operator supplies the missing evidence
  (complete version, verified access) — they are never auto-promoted to
  Purchased or Delivered.

---

## 8. Idempotent retries and reconciliation

All of the following are safe to re-run; re-running never double-charges,
double-generates, or double-fulfils.

- **Generation** (`book-pipeline.generatePreview`): resumable; the immutable
  snapshot must be created before any transition, and incomplete pages abort
  before snapshotting. Attempts/errors are recorded; re-running an already
  Generated/Under Review book is a quiet no-op.
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
  re-charge, re-generate, or duplicate the transition.
- **Checkout reservation**: a pending order is persisted before Stripe. If a
  process stops before Stripe creation or before session binding, retry reuses
  that same order and an order-scoped Stripe idempotency key. An unbound
  reservation is not released merely because its operational lease elapsed;
  only a definite request/authentication/permission rejection releases it.
- **Artefacts** (`finalisePurchasedBook`): reuses an existing durable-verified
  `pdf_digital` artefact when its URL is reachable; otherwise rebuilds and
  re-verifies. Artefacts live in `product_artefacts`; the immutable version row
  is never mutated.
- **Access** grants: full-book grants are minted per attempt with a fresh raw
  token, and the customer route/authorisation is verified deterministically
  before `verified_at` is set; stale unsent grants are revoked before reminting.
- **Invitation** (`sendApprovalInvitation`): the attempt is durably reserved as
  `pending` before provider work. A unique key serialises concurrent requests;
  a confirmed `sent` attempt short-circuits, while an ambiguous `pending`
  attempt is not automatically resent and requires reconciliation.
- **Delivery** (`delivery_attempts` + `finalisePurchasedBook`): the attempt is
  reserved as `pending` before provider work. A prior confirmed `sent` attempt
  replays the Delivered transition idempotently; an ambiguous pending attempt
  requires reconciliation rather than a duplicate notification.

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

**Ambiguous legacy rows to reconcile (never auto-promoted):**
```sql
select id, status, current_version_id, reviewed_at
from public.books
where lifecycle_stage is null
order by created_at asc;
```
Recovery: confirm a complete immutable version exists; only then use
`transition_book_lifecycle` to place the book at the correct **non-financial**
stage. Never map to Purchased/Delivered without exact paid-order and verified
access evidence.

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

**Delivered audit (timestamps + durable links):**
```sql
select b.id, b.stage_delivered_at, pa.kind, pa.access_url, pa.durable_verified_at
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
| Unit + integration suite | `npm test` | **Passed: 257 tests, 0 failures** |
| TypeScript | `npx tsc --noEmit --incremental false -p tsconfig.json` | **Passed** |
| Production build | `npm run build` | **Passed**; existing non-blocking lint/dynamic-render diagnostics remain in build output |
| Safe browser smoke | Playwright desktop/mobile | **Passed**: homepage, retired admin GET routes, invalid review token, invalid preview fail-closed |
| Independent implementation review | Architect review of migration/lifecycle/review/checkout/webhook/access/delivery | **Passed** after checkout replay, out-of-order expiry, and artefact-link findings were corrected |
| Controlled-data manual acceptance | [book-fulfilment-manual-acceptance.md](./book-fulfilment-manual-acceptance.md) | **Pending** in an isolated database after applying migration 010, with Stripe test mode and suppressed/captured email |

The migration was not applied to the configured database in this task. The
automated tests used synthetic data and did not contact Stripe or an email
provider. No real customer email was sent, no card was charged, and nothing was
published.
