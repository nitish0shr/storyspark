---
name: Fulfilment notification recovery
description: Separating non-essential notifications from fulfilment while preserving safe retries and provider ambiguity.
---

Purchase confirmation is not a prerequisite for paid-book finalisation. A
definite notification failure must be recorded and retriable without preventing
artefact/access work; final delivery notification remains a Delivered gate.

**Why:** Coupling a non-essential confirmation to finalisation stranded verified
payments whenever email was suppressed or temporarily unavailable. Separately,
provider acceptance without a durable local acknowledgement makes blind resend
unsafe.

**How to apply:** Definite failures become failed/retriable, provider-accepted
but unrecorded attempts remain pending for manual reconciliation, and operator
retry actions re-authenticate and reuse exact-version/idempotent services without
replaying payment. Approved invitation failures must remain visible and
retryable even after review tokens are consumed.