# Starmee

Personalized AI-generated children's storybooks. Parents answer a few questions about their child, upload a photo, pick a theme, and get a 12-page illustrated book delivered as a print-ready PDF.

**Live:** [starmee.com](https://starmee.com) · **Stack:** Next.js 14 · Supabase · Stripe · OpenAI · Replicate · Resend · Railway

---

## How it works

1. **Wizard** (`/create`) — child info → photo → theme → contextual questions → email capture
2. **Preview generation** — OpenAI writes 5 preview pages, Replicate illustrates them
3. **Checkout** (`/checkout`) — Stripe Checkout, 3 tiers ($9.99 / $19.99 / $34.99)
4. **Full book generation** — Stripe webhook triggers the remaining 7 pages + cover
5. **Admin review** (`/admin/review`) — you approve before the customer gets the PDF
6. **Delivery** — Resend emails the PDF link

---

## Local setup

```bash
git clone git@github.com:nitish0shr/storyspark.git starmee
cd starmee
npm install
cp .env.local.example .env.local   # fill in real values (see below)
npm run dev                        # starts on http://localhost:5000
```

### Required env vars

Every var in `.env.local.example` must be set in both local `.env.local` **and** Railway dashboard for production.

| Var | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Developers → Webhooks → your endpoint |
| `OPENAI_API_KEY` | platform.openai.com |
| `REPLICATE_API_TOKEN` | replicate.com/account/api-tokens |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | resend.com/api-keys (verify domain first) |
| `NEXT_PUBLIC_APP_URL` | `https://starmee.com` in prod, `http://localhost:5000` in dev |
| `ADMIN_EMAILS`, `ADMIN_NOTIFICATION_EMAIL` | Your email (comma-separated list for multi-admin) |
| `PRICE_BASE`, `PRICE_MID`, `PRICE_PREMIUM` | Prices in cents (999 / 1999 / 3499) |

### Supabase migrations

Run in order against your Supabase project (SQL editor → paste + run):

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_add_missing_columns.sql
supabase/migrations/003_fix_book_status_constraint.sql
supabase/migrations/004_cost_tracking.sql
```

Also create a Storage bucket named `child-photos` (public = false).

### Stripe webhook

Point a webhook at `https://starmee.com/api/webhooks/stripe` listening for:
- `checkout.session.completed`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

---

## Deployment

Railway is wired to auto-deploy on every push to `main`. Flow:

```bash
git add .
git commit -m "..."
git push origin main    # Railway picks it up within ~60s
```

Healthcheck: `GET /api/health` returns `{ ok: true }`. Railway watches it.

To deploy a change without rebuilding: push an empty commit (`git commit --allow-empty -m "redeploy"`).

---

## Admin

Any email in `ADMIN_EMAILS` can access `/admin`. Key views:
- `/admin` — stats, orders, revenue
- `/admin/review` — approve books before customer delivery
- `/admin/books` — all books
- `/admin/users` — all users
- `/admin/failed` — generation failures needing manual retry

---

## Testing the full flow locally

1. Start dev server (`npm run dev`)
2. Log in via magic link at `/auth/login`
3. Walk through `/create` → preview
4. Use Stripe test card `4242 4242 4242 4242` at checkout
5. Forward webhooks locally: `stripe listen --forward-to localhost:5000/api/webhooks/stripe`
6. Approve the book at `/admin/review`
7. Confirm delivery email arrives

---

## Cost monitoring

Every order writes `cost_cents` (OpenAI + Replicate actual spend). Check gross margin:

```sql
select
  tier,
  count(*) as orders,
  sum(amount_cents)/100.0 as revenue,
  sum(cost_cents)/100.0 as cost,
  (sum(amount_cents) - sum(cost_cents))/100.0 as gross_margin
from orders
where status = 'paid'
group by tier;
```

If margin dips below 60% on any tier, investigate before running ads.

---

## Known limitations

- Admin review is a manual bottleneck (scales to ~10 orders/day before it hurts)
- No automated COPPA flow — delete requests go through `/api/delete-profile`
- No test coverage — smoke-test changes manually before pushing to main
