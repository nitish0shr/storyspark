---
name: Immutable review identity
description: Fail-closed rule for review links and decisions when an immutable review-version binding is missing.
---

Once a book enters review, only its bound immutable review version may be shown,
revised, approved, or used to mint a review token. A missing review pointer is a
reconciliation failure; never recover by substituting the current/latest version.
Expired, used, unbound, or mismatched review links must return before fetching or
rendering book content; mutable legacy fields are never a canonical fallback.

**Why:** The current version may advance independently. Substitution can let a
reviewer see or approve content other than the snapshot originally submitted.

**How to apply:** Current-version selection is valid only while entering review,
when the transition atomically establishes the review pointer. Under Review and
Revised operations must require that pointer and fail closed if it is absent.
Revised is itself an actionable re-review stage: approval may follow directly,
and another correction goes directly to Changes Requested with an idempotent
new request rather than bouncing the book back through Under Review.