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
