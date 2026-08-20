# Starmee status workflows (legacy / compatibility-only)

> **⚠️ Not canonical.** The authoritative fulfilment lifecycle is the
> eight-stage `books.lifecycle_stage` model documented in
> **[book-fulfilment-implementation.md](./book-fulfilment-implementation.md)**,
> which is the single source of truth. Where anything in this file conflicts
> with that report, **the report wins.**
>
> The `books.status` and `orders.status` columns described below are **retained
> for backward-compatibility only**. They are no longer the source of truth for
> the customer lifecycle and must not be used to drive approval, payment, access,
> or delivery decisions. `books.status` is mapped to a canonical stage **only**
> when `lifecycle_stage` is NULL (legacy rows), via `LEGACY_STATUS_TO_STAGE` in
> `src/lib/book-lifecycle.ts`. Canonical rules — atomic, version-bound
> transitions, verified payment, and verified delivery — are enforced by the
> `transition_book_lifecycle` / `record_verified_payment_and_purchase` RPCs and
> migration 010, **not** by the tables below.

Historically there were **two independent state machines**: one on `books` (the
creative pipeline) and one on `orders` (the payment pipeline), linked only by
`orders.book_id`. They are documented here for reference and legacy-row
interpretation.

> Naming note: an earlier brief referred to `pending_generation` and
> `awaiting_approval`. **Those strings do not exist in this codebase.** The real
> equivalents are `preview_generating` / `generating` and `pending_review`.

---

## books.status (legacy / compatibility-only)

Enforced by the `books_status_check` constraint (migration 008).

| Status | Meaning | Set by |
|---|---|---|
| `draft` | Row created, nothing generated | `api/create-book` |
| `preview_generating` | Free preview being generated | `book-pipeline.generatePreview` |
| `preview_ready` | Free 3-page preview available | `book-pipeline` |
| `generating` | Full paid book being generated | `book-pipeline` |
| `pending_review` | Passed automated checks, waiting on a human | `review-workflow.submitForReview` |
| `needs_regeneration` | Rejected by a human, or failed checks twice | `review-workflow.rejectBook`, `review-gate` |
| `approved` | A person approved this exact version | `review-workflow.approveBook` |
| `delivered` | Sent to the customer, confirmed | `review-workflow.deliverBook` |
| `complete` | Legacy terminal state (pre-review pipeline) | legacy |
| `failed` | Generation failed | `book-pipeline` |

### Transitions

```
draft
  -> preview_generating -> preview_ready        (free preview)
  -> generating                                  (after payment)

generating
  -> pending_review        validation passed
  -> needs_regeneration    validation failed twice (MAX_GENERATION_ATTEMPTS = 2)
  -> failed                generation threw

pending_review
  -> approved              human approve   (POST /api/review/action)
  -> needs_regeneration    human reject    (POST /api/review/action)

needs_regeneration
  -> preview_generating    auto-retry, seeded with the reviewer's words

approved
  -> delivered             only after a confirmed email send
```

**Guarantees**

- Every transition is a conditional update (`.eq("status", expected)` plus a
  row-count check), so two reviewers cannot both act on the same book.
- `delivered` is only ever set after `sendEmail` reports success.
- Books are never deleted; `book_review_events` keeps an append-only audit trail.

---

## orders.status (legacy / compatibility-only)

> The canonical order outcome is derived from the lifecycle: an order becomes
> `fulfilled` (with `fulfilled_at`) only on the verified `Purchased → Delivered`
> transition. See the canonical report for the authoritative payment/delivery
> rules. The table below documents the legacy column values only.

| Status | Meaning | Set by |
|---|---|---|
| `pending` | Order row created at checkout initiation | `api/checkout` |
| `paid` | Stripe confirmed payment | `api/webhooks/stripe` |
| `fulfilled` | Book delivered to the customer | delivery path |
| `refunded` | Refunded in Stripe | webhook |
| `failed` | Checkout expired or payment failed | webhook |

### Transitions

```
(no row)
  -> pending     order row is created BEFORE the checkout URL is returned.
                 If the insert fails the request 500s and no Stripe session is
                 handed to the customer, so a payment can never exist without
                 an order row.

pending
  -> paid        checkout.session.completed  (signature verified)
  -> failed      checkout.session.expired

paid
  -> fulfilled   after delivery
  -> refunded    refund in Stripe
```

**Replay protection.** Stripe retries webhooks and can redeliver an event.
`decideCheckoutProcessing()` (`src/lib/webhook-idempotency.ts`) refuses to act
when the order is already in a terminal state (`paid`, `fulfilled`, `refunded`)
or when no order row matches the session. The order row *is* the idempotency
record, so no extra table is required.

---

## How the two machines met (legacy view)

> **Superseded.** The diagram below describes the pre-canonical flow and is kept
> only to interpret legacy rows. The authoritative flow — generate a complete
> immutable version → review/revise the exact version → approve → invite to
> preview & purchase → verified payment → verified delivery — is defined in
> **[book-fulfilment-implementation.md](./book-fulfilment-implementation.md)**.

```
customer submits form
  -> books row (draft -> preview_ready)          free preview, no payment
  -> [customer chooses to buy]
  -> orders row (pending) + Stripe Checkout Session
  -> webhook: orders pending -> paid
  -> books: generating -> pending_review
  -> human approves
  -> books: approved -> delivered
  -> orders: paid -> fulfilled
```

This legacy shape does not enforce immutable version binding or verified
delivery. Do not rely on it for new work.
