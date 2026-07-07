---
name: UK English convention
description: Starmee Stories user-facing copy must use UK English spelling
---

# UK English in user-facing copy

All user-facing copy for Starmee Stories (starmeestories.com) uses **UK English**.

**Why:** UK-based children's-book brand; the owner explicitly asked to fix "uk issues" before soft launch.

**How to apply:** When writing/editing any human-readable copy (JSX text, button labels, headings, placeholders, alt text, meta titles/descriptions, toast/error messages, email templates), prefer UK forms: personalise/personalised/personalisation, colour, stylised, analyse/analysed, recognise, organise, favourite, centre (prose only), etc. Do NOT change code identifiers, Tailwind classes (e.g. `text-center`, `text-gray-500`), CSS `color`, `colorScheme`, or API route paths like `/api/analyze-photo` — those stay as-is.

**Open decision (not resolved):** Pricing is displayed in USD ($9.99/book, subscription in USD) even though the brand is UK. Currency is tied to actual Stripe charges, so changing the symbol without changing the Stripe price would mislead customers — needs an explicit business decision before switching to GBP.

**Dead code:** `src/components/landing/classic/*` and `src/components/shared/NavbarClassic.tsx` are NOT imported anywhere (home page uses the non-classic landing components). Safe to ignore or delete.
