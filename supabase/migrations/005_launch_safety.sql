-- Migration 005: Launch safety contracts
-- Adds the minimal database fields needed for private gift links and reliable
-- buyer email lookup in admin/payment flows.

-- =============================================================================
-- profiles: keep the authenticated user's email for server-side display/email use
-- =============================================================================
alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- =============================================================================
-- orders: private gift access token for recipient links
-- =============================================================================
alter table public.orders
  add column if not exists gift_access_token text;

create unique index if not exists idx_orders_gift_access_token
  on public.orders(gift_access_token)
  where gift_access_token is not null;

create unique index if not exists idx_orders_stripe_checkout_unique
  on public.orders(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- =============================================================================
-- book_pages: allow generation pipeline to refresh existing page rows safely
-- =============================================================================
alter table public.book_pages
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_book_pages_updated_at on public.book_pages;
create trigger set_book_pages_updated_at
  before update on public.book_pages
  for each row execute function public.handle_updated_at();
