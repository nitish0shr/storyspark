# Starmee status workflows

There are **two independent state machines**: one on `books` (the creative
pipeline) and one on `orders` (the payment pipeline). They are linked only by
`orders.book_id`. This document is the source of truth for both.

> Naming note: an earlier brief referred to `pending_generation` and
> `awaiting_approval`. **Those strings do not exist in this codebase.** The real
> equivalents are `preview_generating` / `generating` and `pending_review`.

---

## books.status

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

## orders.status

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

## How the two machines meet

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

Today the free-preview half runs in production. Everything from the `orders`
row onward is implemented but unproven, because Stripe credentials are absent.
