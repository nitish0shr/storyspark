-- 008: Starmee MVP - order/consent capture + human review workflow.
-- Strictly additive. No existing column is dropped, renamed or rewritten.
-- Safe to re-run (all statements are IF NOT EXISTS / guarded).

-- ---------------------------------------------------------------
-- 1. Order + consent fields on books
-- ---------------------------------------------------------------
alter table public.books add column if not exists purchaser_email text;
alter table public.books add column if not exists recipient_name text;
alter table public.books add column if not exists selected_animal text;

-- Marketing consent is optional, separate from order fulfilment, and
-- must never default to true.
alter table public.books add column if not exists marketing_consent boolean not null default false;
alter table public.books add column if not exists marketing_consent_at timestamptz;
alter table public.books add column if not exists consent_version text;

-- Adult purchaser confirmation (required to place an order).
alter table public.books add column if not exists adult_confirmed boolean not null default false;
alter table public.books add column if not exists adult_confirmed_at timestamptz;

-- Generation + validation bookkeeping.
alter table public.books add column if not exists generation_attempts integer not null default 0;
alter table public.books add column if not exists validation_result jsonb;

-- Review + delivery bookkeeping.
alter table public.books add column if not exists reviewed_by text;
alter table public.books add column if not exists reviewed_at timestamptz;
alter table public.books add column if not exists review_notes text;
alter table public.books add column if not exists rejection_reason text;
alter table public.books add column if not exists delivered_at timestamptz;

-- Non-sequential public reference shown on the confirmation page, so we
-- never expose a guessable database id to the customer.
alter table public.books add column if not exists public_ref text;

-- Backfill: existing rows keep working. recipient_name mirrors child_name,
-- and every row gets a public_ref. Nothing is overwritten if already set.
update public.books set recipient_name = child_name where recipient_name is null;
update public.books set public_ref = replace(gen_random_uuid()::text, '-', '')
  where public_ref is null;

create unique index if not exists idx_books_public_ref on public.books(public_ref);

-- ---------------------------------------------------------------
-- 2. Workflow statuses
-- ---------------------------------------------------------------
-- Existing values (draft, preview_generating, preview_ready, generating,
-- complete, failed) are all preserved; we only ADD review states.
alter table public.books drop constraint if exists books_status_check;
alter table public.books add constraint books_status_check check (
  status in (
    'draft',
    'preview_generating',
    'preview_ready',
    'generating',
    'complete',
    'failed',
    'pending_review',
    'needs_regeneration',
    'approved',
    'delivered'
  )
);

create index if not exists idx_books_status_created on public.books(status, created_at desc);

-- ---------------------------------------------------------------
-- 3. Immutable review audit trail
-- ---------------------------------------------------------------
-- Every approve/reject/regenerate/deliver action is appended here.
-- The underlying book row is never deleted.
create table if not exists public.book_review_events (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  action text not null check (
    action in ('submitted', 'approved', 'rejected', 'regenerated', 'delivered', 'validation_failed')
  ),
  reviewer text,
  notes text,
  from_status text,
  to_status text,
  attempt integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_review_events_book on public.book_review_events(book_id, created_at desc);

-- ---------------------------------------------------------------
-- 4. Expiring, single-use review links
-- ---------------------------------------------------------------
-- Only a SHA-256 hash of the token is stored, so a database leak does not
-- hand out working review links. used_at enforces single use.
create table if not exists public.book_review_tokens (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_review_tokens_book on public.book_review_tokens(book_id);

-- Service-role only: no anon/authenticated policies are created, so these
-- tables are unreachable from the browser client.
alter table public.book_review_events enable row level security;
alter table public.book_review_tokens enable row level security;
