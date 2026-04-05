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

## Design System

- **Colors**: Deep cosmic dark (`#0D0720`) for hero/nav, warm cream (`#FFFBF5`) for content
- **Brand**: Violet (#7C3AED) + Pink (#EC4899) gradient
- **Typography**: Playfair Display (headings) + Inter (body)
- **Animations**: Float, twinkle, drift, book-float, gradient-shift — defined in globals.css

## Replit Configuration

- Runs on port 5000 with `-H 0.0.0.0`
- Workflow: "Start application" → `npm run dev`
- Cross-origin dev origins configured in `next.config.mjs`
