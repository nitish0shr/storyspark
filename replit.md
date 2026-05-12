# StorySpark

AI-powered personalized children's storybook generator. Parents upload a photo of their child, pick a magical theme, and AI generates a unique 12-page illustrated storybook with the child as the hero.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Auth & DB**: Supabase (PostgreSQL + Auth + Storage)
- **AI Story**: OpenAI (GPT-4o-mini)
- **AI Audio**: OpenAI TTS (tts-1, "shimmer" voice)
- **AI Images**: Replicate (Flux Schnell)
- **Payments**: Stripe
- **Email**: Resend
- **Analytics**: PostHog

## Running the App

```bash
npm run dev   # starts on port 5000
npm run build
npm run start # production on port 5000
```

## Environment Variables Required

See `.env.local.example` for all required secrets:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `REPLICATE_API_TOKEN`
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_APP_URL`

The app gracefully degrades when secrets are missing (auth skipped, AI features disabled).

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    page.tsx              # Landing page
    create/               # Book creation wizard (6 steps)
    dashboard/            # User dashboard (protected)
    preview/[bookId]/     # Interactive book viewer
    checkout/             # Stripe checkout
    admin/                # Admin dashboard
    api/                  # API routes
  components/
    landing/              # Landing page sections
      Hero.tsx            # Hero with AI-generated book cover mockup
      PersonalizationShowcase.tsx  # Photo-to-storybook collage grid (boy photo + 3 book spreads)
      Stats.tsx           # Trust stats bar
      HowItWorks.tsx      # 3-step process cards
      ThemeShowcase.tsx   # 12 theme cards with SVG illustrations (6 original + 4 evergreen + 2 seasonal)
      SampleBookViewer.tsx # Interactive book spread carousel (space, dino, castle)
      Testimonials.tsx    # Trust points section (preview speed, privacy, free preview)
      Pricing.tsx
      FAQ.tsx
      Footer.tsx          # Dark CTA + footer bar
    shared/
      Navbar.tsx          # Dark sticky navbar
    create/               # Wizard step components
    dashboard/            # Dashboard components
    preview/              # Book viewer components
    ui/                   # shadcn/ui components
  lib/                    # Utilities, Supabase clients, Stripe
  services/               # AI generation services
    tts-narration.ts      # OpenAI TTS audio narration for book pages
    book-pipeline.ts      # Book generation pipeline (preview + full + audio, supports dual-child)
    story-generation.ts   # GPT-4o-mini story generation (multi-language, dual-character)
    illustration.ts       # Replicate Flux illustration generation (supports second child)
    pdf-assembly.tsx      # PDF rendering with @react-pdf/renderer (Noto Sans fonts for CJK/Devanagari)
    theme-rotation.ts     # Rotating theme selection for monthly subscribers
  data/                   # Theme definitions, languages config
    languages.ts          # Supported languages (en, es, fr, de, pt, it, hi, zh)
  types/                  # TypeScript types
```

## Subscription Model

- **Price**: $7.99/month (1 book included)
- **Minimum commitment**: 3 months — cancellation blocked via Stripe metadata (`min_commitment_end`)
- **Subscriber perks**: 15% off extra books, access to exclusive subscriber-only themes
- **Subscriber-only themes**: `pirate-treasure`, `fairy-garden` (enforced server-side in `/api/create-book`)
- **Theme flag**: `subscriberOnly?: boolean` in `Theme` type (`src/types/theme.ts`)
- **Commitment tracking**: `min_commitment_end` stored in Stripe subscription metadata, checked in `/api/subscription` PATCH (cancel action)

## Design System

- **Colors**: Deep cosmic dark (`#0D0720`) for hero/nav, warm cream (`#FFFBF5`) for content
- **Brand**: Violet (#7C3AED) + Pink (#EC4899) gradient
- **Typography**: Playfair Display (headings) + Inter (body)
- **Animations**: Float, twinkle, drift, book-float, gradient-shift — defined in globals.css

## Replit Configuration

- Runs on port 5000 with `-H 0.0.0.0`
- Workflow: "Start application" → `npm run dev`
- Cross-origin dev origins configured in `next.config.mjs`
- Iframe-friendly headers: `X-Frame-Options: ALLOWALL` + `Content-Security-Policy: frame-ancestors *;` (so the app can be embedded by the WordPress site or Replit canvas)

## WordPress / Marketing Site Integration

The marketing site at **https://starmeestories.com** (WordPress + Elementor) stays the customer-facing front door. This Next.js app is the **product engine** and should be deployed at a subdomain such as `https://app.starmeestories.com`.

### How they connect

- **Logo + nav links** in the app's Navbar/Footer point back to the marketing site (`NEXT_PUBLIC_MARKETING_URL`, default `https://starmeestories.com`). The customer feels like they never left.
- **Marketing CTAs** (WordPress buttons like "Create Their Book", "Free Preview", "Sign In") should link to the corresponding app routes:

  | WordPress button | Link to |
  |---|---|
  | Create Their Book / Get Started / Free Preview | `https://app.starmeestories.com/create` |
  | Sign In / My Books | `https://app.starmeestories.com/auth/login` |
  | Pricing → "Subscribe" | `https://app.starmeestories.com/checkout?plan=subscription` |
  | Gift a Book | `https://app.starmeestories.com/gift` |

- **Email/lead capture form** on WordPress can POST to `https://app.starmeestories.com/api/leads` (CORS-enabled for the marketing domain) — accepts JSON `{ email, source?, childName? }` and upserts into the `leads` Supabase table. Gracefully no-ops if Supabase isn't configured.
- **Stripe webhooks** stay pointed at `https://app.starmeestories.com/api/webhooks/stripe`.
- **Order confirmation + book delivery emails** are sent by the app via Resend; the customer receives a download link that opens `https://app.starmeestories.com/preview/[bookId]`.

### Deployment checklist

1. Deploy this Next.js app on Replit (Autoscale).
2. Add custom domain `app.starmeestories.com` in the deployment (CNAME provided by Replit).
3. Set production env vars: `NEXT_PUBLIC_APP_URL=https://app.starmeestories.com`, `NEXT_PUBLIC_MARKETING_URL=https://starmeestories.com`, plus all Supabase/Stripe/OpenAI/Replicate/Resend secrets.
4. In WordPress/Elementor, edit each CTA button's URL to point to the app routes above.
5. In Stripe dashboard, set the webhook endpoint to `https://app.starmeestories.com/api/webhooks/stripe`.

### Env vars for integration

- `NEXT_PUBLIC_APP_URL` — public URL of this backend app (used in emails, OG tags, share links)
- `NEXT_PUBLIC_MARKETING_URL` — public URL of the WordPress site (used by the app's logo + nav links to send users back to marketing)
