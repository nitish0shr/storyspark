# Starmee Roadmap

**Current:** v1.0 launch candidate (2026-04-17)

---

## v1.0 — Launch (this week)
**Theme:** Ship the MVP and sell to the first 10 customers.

- [x] Rename StorySpark → Starmee everywhere
- [x] Cut scope: promo codes, feedback form, rate limit, Sentry, PostHog
- [x] Auth, wizard, preview, checkout, generation, admin review, delivery all wired
- [x] Terms + Privacy live
- [x] Cost tracking columns (migration 004) — unblocks margin monitoring
- [ ] Push `7f3f73a` to origin/main → Railway deploys
- [ ] Run migrations 003 + 004 in Supabase prod
- [ ] Fill real env vars in Railway; switch Stripe test → live
- [ ] DNS cutover to starmee.com; Resend verify sending domain
- [ ] End-to-end smoke test on production with a real $0.50 order, refund after
- [ ] Send preview link to 5 beta testers (Justin, Selina, Chrissy + 2)

---

## v1.1 — First Iteration (weeks 2–4 post-launch)
**Theme:** Fix what beta testers complained about. Make the top of funnel work.

- [ ] Gift card / promo code — single-use codes for beta testers and press
- [ ] UptimeRobot or Better Stack on `/api/health` (pages when down)
- [ ] Add one more theme based on tester votes
- [ ] Admin email receives cost breakdown per order (watch for margin drift)
- [ ] FAQ expansion based on support emails received
- [ ] Add Instagram-ready preview card (OpenGraph image per book for easy sharing)
- [ ] A/B: does the full 12-page preview convert better than 5 pages?

---

## v1.2 — Reduce Manual Work (month 2)
**Theme:** Admin review is the bottleneck. Automate what's safe.

- [ ] Auto-approve when illustration confidence + content-filter both pass
- [ ] Add Sentry for error tracking (30-day trial, then paid if ROI clear)
- [ ] Basic analytics: funnel from landing → wizard start → preview → checkout → paid
- [ ] Reprint / re-generate flow for customers who aren't happy (1 free regen per order)
- [ ] Receipt PDF emailed with every order

---

## v2.0 — Real Product (month 3–6)
**Theme:** Go from "sells" to "grows."

- [ ] **Physical print + ship** (integrate Lulu xPress or RPI Print API) — this is the real margin tier
- [ ] **Subscription / book club** — new book per month per child, $14.99/mo
- [ ] **Multi-child books** — siblings, cousins in one story
- [ ] **Parent + child co-author mode** — parent provides the plot beats, AI fills in
- [ ] **Language expansion** — Spanish first (big gifting market), then French
- [ ] **Referral program** — give $10, get $10
- [ ] **Audiobook narration** — ElevenLabs voice for each book, streamed on a `/listen` page

---

## v3.0 — Platform (month 6+)
**Theme:** Durable moat: memory book across a child's life.

- [ ] Recurring "milestone books" — automatic reminders at birthdays, first day of school, graduations
- [ ] Family-shared accounts (multiple parents, grandparents can add photos/moments)
- [ ] Video companion (short animated reel matching one scene from the book)
- [ ] Partner integrations: Shutterfly, Tinybeans, BabyCenter co-marketing
- [ ] B2B: daycares + schools order a book per student at end of year

---

## Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-17 | Renamed StorySpark → Starmee | Brand ownership, better memorability |
| 2026-04-17 | Cut Sentry/PostHog/promo/feedback/rate-limit from v1 | Shipping friction > measurement value at pre-revenue |
| 2026-04-17 | One-time purchase, 3 tiers — not subscription | Gifting is one-shot; subscription is v2.0 |
| 2026-04-17 | No physical print in v1 | Fulfillment ops = full-time job; digital-only proves demand first |
| 2026-04-17 | Admin manual review required | Brand risk of a bad book > scaling cost of reviewing |
