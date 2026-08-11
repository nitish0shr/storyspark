-- 009: Secure, self-service password reset.
-- Strictly additive and safe to re-run.

-- ---------------------------------------------------------------
-- 1. Expiring, single-use password reset tokens
-- ---------------------------------------------------------------
-- Only a SHA-256 hash of the token is stored, so a database leak does not
-- hand out working reset links. used_at enforces single use.
create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_tokens_user
  on public.password_reset_tokens(user_id);

-- Service-role only: no anon/authenticated policies are created, so this
-- table is unreachable from the browser client.
alter table public.password_reset_tokens enable row level security;

-- ---------------------------------------------------------------
-- 2. Look up a user id by email (service-role only)
-- ---------------------------------------------------------------
-- auth.users is not readable through PostgREST, so the forgot-password
-- endpoint uses this definer function. Execution is revoked from anon and
-- authenticated roles: only the service role may call it.
create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke execute on function public.get_user_id_by_email(text) from public;
revoke execute on function public.get_user_id_by_email(text) from anon;
revoke execute on function public.get_user_id_by_email(text) from authenticated;
grant execute on function public.get_user_id_by_email(text) to service_role;
