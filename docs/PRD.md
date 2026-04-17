# Starmee — Product Requirements Document

**Version:** 1.0 (launch)
**Last updated:** 2026-04-17
**Owner:** Nitish Shrivastava
**Partners:** Justin, Selina, Chrissy

---

## 1. Problem

Parents want unique, keepsake-quality gifts that feature their child by name and likeness. Existing options (Wonderbly, Hooray Heroes, Lost My Name, Personal Creations) are slow, shallow in personalization, and expensive. Most stop at inserting the child's name — they don't generate a story around what that specific child loves, looks like, or is going through.

AI image + text models now let us personalize the **entire** book in under 10 minutes for a small fraction of the cost.

## 2. Target customer

**Primary persona — "Gifting Parent Grace"**
- 28–42 years old, parent or close relative (aunt/uncle/grandparent)
- Household income $60k+
- Shops online, uses Instagram and Pinterest for gift ideas
- Triggers: birthday, new sibling, holiday, pre-birth gender reveal, first day of school
- Willing to spend $15–$50 on a unique keepsake gift
- Frustrated by generic "insert name" books that are clearly off-the-shelf

**Secondary — "Memory Keeper Parent"**
- Wants a book to mark a life moment (first pet, new home, sibling arrival)
- More likely to convert on the $34.99 premium tier (hardcover or print-ready)

## 3. Value proposition

**In one sentence:** A one-of-a-kind illustrated storybook starring your child, generated in 10 minutes from one photo and three questions.

**vs. Wonderbly:** Starmee uses the child's actual photo as the likeness basis — not a generic avatar. Story adapts to what you tell us about the child.
**vs. Etsy custom:** Instant. No artist wait queue. Under $35.
**vs. blank journal:** Finished, illustrated, giftable same-day.

## 4. MVP scope (v1.0 — shipped)

### Must-have (shipped)
- [x] Auth: magic link + Google OAuth (Supabase)
- [x] 6-step creation wizard: child info → photo → theme → questions → summary → preview
- [x] Preview generation: 5 illustrated pages, free, no card required
- [x] Stripe Checkout with 3 tiers ($9.99 / $19.99 / $34.99)
- [x] Full 12-page book generation triggered on `checkout.session.completed` webhook
- [x] Admin review workflow before customer delivery
- [x] PDF delivery via Resend email
- [x] Gift flow: recipient name/email/message on order
- [x] Legal: Terms of Service + Privacy Policy
- [x] Landing page: theme showcase, sample viewer, pricing, FAQ

### Explicitly deferred (cut 2026-04-17)
- [ ] ~~Promo codes~~ — manual codes for 5 beta testers is enough
- [ ] ~~In-app feedback form~~ — email testers directly
- [ ] ~~PostHog / analytics~~ — Supabase + Stripe dashboards for v1
- [ ] ~~Sentry~~ — adding back at 100+ orders
- [ ] ~~Rate limiting~~ — no abuse yet, revisit at launch

## 5. Pricing tiers

| Tier | Price | What's included |
|---|---|---|
| **Base** | $9.99 | Digital PDF, 12 pages, read-only share link |
| **Mid** | $19.99 | Base + editable dedication page + higher-res PDF |
| **Premium** | $34.99 | Mid + print-ready 300dpi PDF + cover variant + family gift message card |

Physical print/ship is **not** in v1.0. Users can take the print-ready PDF to any consumer photo-book service (Shutterfly, Mixbook) themselves.

## 6. Key user flows

### 6.1 First-time buyer flow (happy path)
1. Land on `/` — scroll theme gallery, view sample book
2. Click "Create my book" → `/create`
3. Sign up via magic link (emails themselves a login link)
4. Complete 6-step wizard (~4 min)
5. Watch preview generate (~2–3 min, 5 pages illustrated)
6. Click "Get the full book" → `/checkout`
7. Select tier, complete Stripe Checkout
8. Land on `/checkout/success`, full book generates in background
9. Receive "Your book is ready!" email from Resend within 10 min
10. Click link → view/download PDF

### 6.2 Admin review flow
1. Webhook marks book `pending_review` after generation
2. Admin gets notification email
3. Admin opens `/admin/review`, reviews all 12 pages
4. Approve → customer email dispatched; or Reject → manual regeneration
5. Book moves to `complete`, order marked `fulfilled`

## 7. Success metrics (launch → 30 days)

| Metric | Target |
|---|---|
| Preview-to-purchase conversion | ≥ 8% |
| Gross margin per order (all tiers) | ≥ 60% |
| Median time-to-delivery (paid → email sent) | ≤ 15 min |
| Admin review backlog | ≤ 2 hours at peak |
| Refund rate | ≤ 5% |
| Time-on-wizard (median) | ≤ 6 min |

## 8. Non-goals (v1.0)

- Physical print + ship fulfillment
- Multi-language (English only at launch)
- Subscription / book club model
- User-to-user sharing or community features
- Mobile native apps (responsive web only)
- Multiple children per book (one child per book in v1.0)

## 9. Open questions

- At what order volume does admin review become the bottleneck? (Estimate: 10/day = 1 hour of reviews)
- Do customers want a preview of the FULL book before paying, or are 5 pages enough?
- Premium tier — does the print-ready tier convert materially better than mid, or is the mid/premium price jump too steep?

## 10. Out-of-scope risks tracked

- **AI cost spike**: tracked via migration 004 (`orders.cost_cents`). Escalate if any tier's gross margin < 60%.
- **COPPA exposure**: photos of children are stored. `/privacy` discloses it; deletion is available via `/api/delete-profile`. No formal COPPA audit done yet — low-priority unless we scale past 1,000 orders or open marketing to parents of <13 explicitly.
- **Likeness drift**: Replicate output may not match the photo well on some children. Admin review catches the worst cases.
