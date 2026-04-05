# StorySpark

AI-powered personalized children's storybook generator. Parents upload a photo of their child, pick a magical theme, and AI generates a unique 12-page illustrated storybook with the child as the hero.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Auth & DB**: Supabase (PostgreSQL + Auth + Storage)
- **AI Story**: OpenAI
- **AI Images**: Replicate
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
      Hero.tsx            # Dark cosmic hero with animated book
      Stats.tsx           # Trust stats bar
      HowItWorks.tsx      # 3-step process cards
      ThemeShowcase.tsx   # 6 theme cards with SVG illustrations
      SampleBookViewer.tsx
      Testimonials.tsx    # 6 testimonial cards with gradient avatars
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
  data/                   # Theme definitions
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
