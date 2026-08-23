-- 011: Durable generation recovery foundation.
-- Additive, data-preserving, and safe to re-run.
-- DDL uses IF NOT EXISTS and guarded DO blocks throughout.
-- Does not rewrite any historical migration.

-- ============================================================
-- 1. books: generation attempt / heartbeat columns
--
-- generation_attempt_started_at (nullable):
--   Set when a generation claim is first taken (operational boundary).
--   Reset to NULL when generation succeeds (operational_state = 'idle')
--   or permanently fails. The sweep identifies stale rows where this is
--   non-null and no heartbeat has been received within the stale window.
--
-- generation_heartbeat_at (nullable):
--   Updated periodically by the running generation worker to prove
--   liveness. If the worker crashes the heartbeat goes stale.
--   Nullable so existing rows are unaffected.
--
-- generation_retry_at (nullable):
--   Earliest time a new durable worker attempt may be claimed after the
--   OpenAI SDK exhausts its own bounded transient retry budget.
--
-- generation_recovery_attempts (int, default 0):
--   Monotonically incremented every time the recovery sweep reclaims
--   this book. The sweep stops reclaiming once this reaches
--   MAX_GENERATION_RECOVERY_ATTEMPTS (3). After that the book is
--   considered permanently failed and human intervention is required.
-- ============================================================
alter table public.books
  add column if not exists generation_attempt_started_at timestamptz;

alter table public.books
  add column if not exists generation_heartbeat_at timestamptz;

alter table public.books
  add column if not exists generation_retry_at timestamptz;

alter table public.books
  add column if not exists generation_recovery_attempts integer not null default 0;

-- Partial index to make the recovery sweep fast: only live/stale generation
-- rows need to be scanned (lifecycle_stage IS NULL and attempt started).
create index if not exists idx_books_stale_generation
  on public.books(status, generation_retry_at, generation_heartbeat_at, generation_attempt_started_at)
  where
    lifecycle_stage is null
    and current_version_id is null
    and status = 'preview_generating';

-- ============================================================
-- 2. Character reference sheets: dedicated private bucket
--
-- This does not alter the live privacy setting of the existing illustration
-- bucket. New identity references use this private, service-role-only bucket;
-- authenticated server reads continue to support legacy references.
-- ============================================================
insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'character-reference-sheets',
  'character-reference-sheets',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update
  set file_size_limit     = excluded.file_size_limit,
      allowed_mime_types  = excluded.allowed_mime_types;

drop policy if exists "Service role manages character reference sheets" on storage.objects;

create policy "Service role manages character reference sheets"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'character-reference-sheets')
  with check (bucket_id = 'character-reference-sheets');
