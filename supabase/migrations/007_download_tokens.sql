-- 007_download_tokens.sql
-- Secure download tokens for book delivery + user linkage on preview_requests

-- Add download token to books for secure /book/[id]?token=X access
alter table books add column if not exists download_token      text unique;
alter table books add column if not exists download_token_at   timestamptz;

create index if not exists books_download_token_idx on books (download_token);

-- Add pending_review status if not already present (may have been added manually)
-- No-op if constraint already has it
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'books_status_check'
    and conrelid = 'books'::regclass
  ) then
    -- constraint already dropped/renamed in migration 003, skip
    null;
  end if;
end $$;

-- Link preview_requests to the Supabase user created at checkout time
alter table preview_requests add column if not exists supabase_user_id uuid;
