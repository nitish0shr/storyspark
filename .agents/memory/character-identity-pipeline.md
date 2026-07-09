---
name: Character identity pipeline
description: How child likeness is preserved across book illustrations and the rules that must not be broken
---

# Character identity pipeline

Each child gets a structured Character Profile (analysed once from their photo, then the photo is deleted for privacy) and a Character Reference Sheet image (generated once, persisted inside the child row's appearance_profile jsonb as referenceSheetUrl). Every page illustration reuses the ref sheet(s) via `openai.images.edit({ model: "gpt-image-1", input_fidelity: "high" })`, falling back to gpt-image-1 generate, then dall-e-3 text-only.

**Rules that must hold:**
- The uploaded photo is analysed exactly once and never re-sent to any AI call afterwards — the profile + ref sheet are the only identity sources.
- Two-child books must never blend the children; prompts map each reference image to a named character and forbid mixing features.
- referenceSheetUrl must never be accepted from the client — it is set server-side only (create-book sanitiser whitelists profile keys and excludes it).
- Legacy books/rows: appearance_profile may be null; fall back to `__appearance_desc` / `__appearance_desc2` in books.contextual_answers, then defaults. Do not remove that fallback.

**Why:** Identity drift across pages was the core complaint the spec fixed; re-analysing photos would break the privacy promise, and client-writable referenceSheetUrl would let users inject arbitrary images into generation.

**How to apply:** Any change to prompts, illustration generation, or the create-book/analyze-photo routes must preserve these invariants. Prompt text is centralised in one prompts module — do not scatter prompt strings elsewhere.
