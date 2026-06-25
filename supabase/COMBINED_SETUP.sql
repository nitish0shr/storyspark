-- ============================================================
-- Starmee Stories — full database setup
-- Paste this ENTIRE file into Supabase → SQL Editor → Run.
-- Safe to run once on a fresh project.
-- ============================================================

-- ---------- supabase/migrations/001_initial_schema.sql ----------
-- StorySpark Initial Schema
-- Creates core tables for child profiles, books, orders, and email captures

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- =============================================================================
-- child_profiles
-- =============================================================================
create table public.child_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  age int not null check (age >= 0 and age <= 18),
  gender text not null check (gender in ('boy', 'girl', 'neutral')),
  photo_url text,
  photo_processed_url text,
  appearance_profile jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_child_profiles_user_id on public.child_profiles(user_id);

-- =============================================================================
-- books
-- =============================================================================
create table public.books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  theme_id text not null,
  status text not null default 'draft' check (
    status in ('draft', 'preview_generating', 'preview_ready', 'generating', 'complete', 'failed')
  ),
  contextual_answers jsonb,
  story_text jsonb,
  illustration_urls jsonb,
  preview_pages jsonb,
  pdf_url text,
  pdf_print_url text,
  page_count int not null default 12,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_books_user_id on public.books(user_id);
create index idx_books_child_profile_id on public.books(child_profile_id);
create index idx_books_status on public.books(status);

-- =============================================================================
-- orders
-- =============================================================================
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'fulfilled', 'refunded', 'failed')
  ),
  amount_cents int not null,
  currency text not null default 'usd',
  tier text not null default 'base' check (tier in ('base', 'mid', 'premium')),
  is_gift boolean not null default false,
  gift_recipient_name text,
  gift_recipient_email text,
  gift_message text,
  email_delivered boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_book_id on public.orders(book_id);
create index idx_orders_stripe_checkout on public.orders(stripe_checkout_session_id);

-- =============================================================================
-- email_captures
-- =============================================================================
create table public.email_captures (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  book_id uuid references public.books(id) on delete set null,
  converted boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_email_captures_email on public.email_captures(email);

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.child_profiles enable row level security;
alter table public.books enable row level security;
alter table public.orders enable row level security;
alter table public.email_captures enable row level security;

-- child_profiles policies
create policy "Users can view own child profiles"
  on public.child_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own child profiles"
  on public.child_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own child profiles"
  on public.child_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own child profiles"
  on public.child_profiles for delete
  using (auth.uid() = user_id);

-- books policies
create policy "Users can view own books"
  on public.books for select
  using (auth.uid() = user_id);

create policy "Users can insert own books"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "Users can update own books"
  on public.books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own books"
  on public.books for delete
  using (auth.uid() = user_id);

-- orders policies
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own orders"
  on public.orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- email_captures policies (insert-only for anonymous, service role handles reads)
create policy "Anyone can insert email captures"
  on public.email_captures for insert
  with check (true);

create policy "Users can view own email captures"
  on public.email_captures for select
  using (
    exists (
      select 1 from public.books
      where books.id = email_captures.book_id
        and books.user_id = auth.uid()
    )
  );

-- =============================================================================
-- updated_at trigger function
-- =============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_child_profiles_updated_at
  before update on public.child_profiles
  for each row execute function public.handle_updated_at();

create trigger set_books_updated_at
  before update on public.books
  for each row execute function public.handle_updated_at();

-- ---------- supabase/migrations/002_add_missing_columns.sql ----------
-- StorySpark Migration 002: Add missing columns and tables
-- Adds columns/tables that frontend pages already reference but don't exist in 001

-- =============================================================================
-- Fix child_profiles age constraint to allow pre-birth (-1)
-- =============================================================================
alter table public.child_profiles drop constraint if exists child_profiles_age_check;
alter table public.child_profiles add constraint child_profiles_age_check check (age >= -1 and age <= 18);

-- =============================================================================
-- Add missing columns to books table
-- =============================================================================
alter table public.books add column if not exists child_name text;
alter table public.books add column if not exists theme_title text;
alter table public.books add column if not exists is_purchased boolean not null default false;
alter table public.books add column if not exists cover_illustration_url text;

-- =============================================================================
-- profiles table (for user display info)
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Only create trigger if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- book_pages table (individual pages with illustrations)
-- =============================================================================
create table if not exists public.book_pages (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid not null references public.books(id) on delete cascade,
  page_number int not null,
  text text,
  illustration_url text,
  scene_description text,
  created_at timestamptz not null default now()
);

create index idx_book_pages_book_id on public.book_pages(book_id);
create unique index idx_book_pages_book_page on public.book_pages(book_id, page_number);

alter table public.book_pages enable row level security;

create policy "Users can view own book pages"
  on public.book_pages for select
  using (
    exists (
      select 1 from public.books
      where books.id = book_pages.book_id
        and books.user_id = auth.uid()
    )
  );

create policy "Users can insert own book pages"
  on public.book_pages for insert
  with check (
    exists (
      select 1 from public.books
      where books.id = book_pages.book_id
        and books.user_id = auth.uid()
    )
  );

create policy "Users can update own book pages"
  on public.book_pages for update
  using (
    exists (
      select 1 from public.books
      where books.id = book_pages.book_id
        and books.user_id = auth.uid()
    )
  );

-- Service role can also manage book pages (for background generation)
create policy "Service role can manage book pages"
  on public.book_pages for all
  using (true)
  with check (true);

-- ---------- supabase/migrations/003_add_audio_url.sql ----------
-- Add audio_url column to book_pages table for TTS narration
alter table public.book_pages add column if not exists audio_url text;

-- Add audio_status column to books table to track narration generation outcome
alter table public.books add column if not exists audio_status text
  check (audio_status in ('complete', 'failed', 'skipped'));

-- ---------- supabase/migrations/003_form_submissions.sql ----------
create table if not exists public.form_submissions (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('contact', 'demo-request', 'waitlist', 'leads')),
  email text not null,
  name text,
  company text,
  phone text,
  message text,
  source text not null default 'wordpress-marketing-site',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  created_at timestamptz not null default now()
);

create index if not exists idx_form_submissions_email on public.form_submissions(email);
create index if not exists idx_form_submissions_type on public.form_submissions(type);

alter table public.form_submissions enable row level security;

create policy "Service role full access" on public.form_submissions using (true) with check (true);

-- ---------- supabase/migrations/004_add_dedication.sql ----------
-- Add dedication text field to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS dedication TEXT DEFAULT NULL;

-- ---------- supabase/migrations/005_add_language.sql ----------
ALTER TABLE books ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

-- ---------- supabase/migrations/006_add_second_child.sql ----------
ALTER TABLE books ADD COLUMN IF NOT EXISTS second_child_profile_id UUID REFERENCES child_profiles(id);

-- ---------- supabase/migrations/007_add_subscriptions.sql ----------
-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'canceled', 'past_due', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  used_theme_ids TEXT[] DEFAULT '{}',
  books_generated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Add subscription_id and stripe_invoice_id references to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);
ALTER TABLE books ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT;

-- ---------- storage bucket for uploaded child photos ----------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- allow authenticated users to upload, and public read of photos
drop policy if exists "photos_auth_upload" on storage.objects;
create policy "photos_auth_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos');
drop policy if exists "photos_public_read" on storage.objects;
create policy "photos_public_read" on storage.objects
  for select to public using (bucket_id = 'photos');
