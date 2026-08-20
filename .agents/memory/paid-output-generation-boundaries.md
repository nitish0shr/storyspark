---
name: Paid output generation boundaries
description: Durable lifecycle and privacy rules for generation entrypoints and final customer artefacts.
---

Paid output generation is internal to the canonical Purchased workflow and must
use the exact approved immutable version plus verified payment. Lifecycle-null
legacy records may generate only through confirmed, claimed admin recovery.
Fresh subscription books may generate previews but must not chain into full
fulfilment. Direct PDF/audio output routes fail closed.

Public narration remains disabled until audio has the same private,
exact-payment access controls as final PDFs.

**Why:** Status-based legacy routes and overlooked subscription callers bypassed
the recovery claim and could generate output or incur AI cost. Public audio and
durable signed PDF URLs also exposed bearer capabilities outside the authorised
delivery path.

**How to apply:** Whenever a generation or rendering entrypoint changes,
inventory every API, webhook, subscription, retry, and service caller. Check
both route-level and service-level lifecycle gates, then inspect every durable
object-identity and URL write. Signed links must be short-lived responses after
exact payment/version/access checks, never stored as artefact identity.