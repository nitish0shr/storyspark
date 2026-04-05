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
