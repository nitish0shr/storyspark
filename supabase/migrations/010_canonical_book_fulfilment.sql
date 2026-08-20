-- 010: Canonical book fulfilment data contract.
-- Additive, data-preserving, and safe to re-run.
-- DDL uses IF NOT EXISTS, guarded DO blocks, or deliberate constraint replacement.
-- Does not rewrite any historical migration.
-- CREATE POLICY IF NOT EXISTS is unsupported in older Postgres versions;
-- every policy is guarded with a DO block instead.

-- ============================================================
-- 1. books: lifecycle_stage (nullable, exact 8 values)
-- ============================================================
alter table public.books
  add column if not exists lifecycle_stage text;

alter table public.books
  drop constraint if exists books_lifecycle_stage_check;

alter table public.books
  add constraint books_lifecycle_stage_check check (
    lifecycle_stage is null or lifecycle_stage in (
      'Generated',
      'Under Review',
      'Changes Requested',
      'Revised',
      'Approved',
      'Ready for Purchase',
      'Purchased',
      'Delivered'
    )
  );

-- ============================================================
-- 2. books: operational state / error (separate from lifecycle)
-- ============================================================
alter table public.books add column if not exists operational_state text;
alter table public.books add column if not exists operational_error  jsonb;

-- ============================================================
-- 3. books: stage timestamps (8, one per stage)
-- ============================================================
alter table public.books add column if not exists stage_generated_at          timestamptz;
alter table public.books add column if not exists stage_under_review_at       timestamptz;
alter table public.books add column if not exists stage_changes_requested_at  timestamptz;
alter table public.books add column if not exists stage_revised_at            timestamptz;
alter table public.books add column if not exists stage_approved_at           timestamptz;
alter table public.books add column if not exists stage_ready_for_purchase_at timestamptz;
alter table public.books add column if not exists stage_purchased_at          timestamptz;
alter table public.books add column if not exists stage_delivered_at          timestamptz;

-- ============================================================
-- 4. books: version pointers
--    current_version_id  = latest submitted version
--    review_version_id   = version currently under review
--    approved_version_id = version the reviewer approved
--    lifecycle_revision  = optimistic-lock counter (incremented on every transition)
-- ============================================================
alter table public.books add column if not exists current_version_id  uuid;
alter table public.books add column if not exists review_version_id   uuid;
alter table public.books add column if not exists approved_version_id uuid;
alter table public.books add column if not exists lifecycle_revision  integer not null default 0;

-- ============================================================
-- 5. book_versions (immutable after insert)
-- ============================================================
create table if not exists public.book_versions (
  id               uuid        primary key default gen_random_uuid(),
  book_id          uuid        not null references public.books(id) on delete cascade,
  version_number   integer     not null,
  predecessor_id   uuid        references public.book_versions(id) on delete set null,
  title            text,
  page_count       integer     not null default 0,
  -- Snapshot of inputs used during generation (contextual answers, theme, etc.)
  input_snapshot   jsonb,
  -- SHA-256 of canonical content for deduplication
  content_hash     text,
  -- True once all pages are recorded and the version is usable for review/delivery.
  is_complete      boolean     not null default false,
  story_text       jsonb,
  illustration_urls jsonb,
  pdf_url          text,
  pdf_print_url    text,
  metadata         jsonb,
  created_at       timestamptz not null default now(),
  unique (book_id, version_number)
);

create index if not exists idx_book_versions_book_id
  on public.book_versions(book_id, version_number desc);

create index if not exists idx_book_versions_content_hash
  on public.book_versions(content_hash) where content_hash is not null;

-- ============================================================
-- 6. book_version_pages (immutable after insert)
-- ============================================================
create table if not exists public.book_version_pages (
  id               uuid        primary key default gen_random_uuid(),
  version_id       uuid        not null references public.book_versions(id) on delete cascade,
  page_number      integer     not null,
  text_content     text,
  illustration_url text,
  audio_url        text,
  is_preview       boolean     not null default false,
  metadata         jsonb,
  created_at       timestamptz not null default now(),
  unique (version_id, page_number)
);

create index if not exists idx_book_version_pages_version
  on public.book_version_pages(version_id, page_number);

create index if not exists idx_book_version_pages_preview
  on public.book_version_pages(version_id, is_preview) where is_preview = true;

-- Review links must bind the exact immutable version the reviewer sees.
alter table public.book_review_tokens
  add column if not exists version_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'book_review_tokens_version_id_fkey'
      and conrelid = 'public.book_review_tokens'::regclass
  ) then
    alter table public.book_review_tokens
      add constraint book_review_tokens_version_id_fkey
      foreign key (version_id)
      references public.book_versions(id)
      on delete set null;
  end if;
end
$$;

create index if not exists idx_book_review_tokens_version
  on public.book_review_tokens(version_id)
  where version_id is not null;

-- ============================================================
-- 7. book_quality_findings (separate table, version-scoped)
-- ============================================================
create table if not exists public.book_quality_findings (
  id          uuid        primary key default gen_random_uuid(),
  version_id  uuid        not null references public.book_versions(id) on delete cascade,
  page_number integer,                -- null = whole-book finding
  code        text        not null,   -- machine-readable finding code
  explanation text,
  severity    text        not null default 'minor'
              check (severity in ('minor', 'major', 'blocker')),
  source      text        not null default 'both'
              check (source in ('text', 'image', 'both')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_book_quality_findings_version
  on public.book_quality_findings(version_id, severity);

-- ============================================================
-- 8. Immutability triggers for book_versions and book_version_pages
-- ============================================================
create or replace function public.reject_version_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Preserve immutable records during direct UPDATE/DELETE, while allowing the
  -- database's intended parent cascades (for example deleting a book/profile)
  -- to remove their dependent versions and pages.
  if TG_OP = 'DELETE' and pg_catalog.pg_trigger_depth() > 1 then
    return OLD;
  end if;
  raise exception 'Mutations to % are not permitted after insert (immutable record)', TG_TABLE_NAME;
end;
$$;

alter function public.reject_version_mutation() owner to postgres;
revoke execute on function public.reject_version_mutation()
  from public, anon, authenticated;
grant execute on function public.reject_version_mutation() to service_role;

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_schema = 'public'
      and event_object_table = 'book_versions'
      and trigger_name = 'trg_book_versions_immutable'
  ) then
    create trigger trg_book_versions_immutable
      before update or delete on public.book_versions
      for each row execute function public.reject_version_mutation();
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_schema = 'public'
      and event_object_table = 'book_version_pages'
      and trigger_name = 'trg_book_version_pages_immutable'
  ) then
    create trigger trg_book_version_pages_immutable
      before update or delete on public.book_version_pages
      for each row execute function public.reject_version_mutation();
  end if;
end;
$$;

-- ============================================================
-- 9. revision_requests
-- ============================================================
create table if not exists public.revision_requests (
  id           uuid        primary key default gen_random_uuid(),
  book_id      uuid        not null references public.books(id) on delete cascade,
  version_id   uuid        references public.book_versions(id) on delete set null,
  requested_by text        not null,   -- reviewer identifier / email
  -- decision: what the reviewer decided
  decision     text        not null default 'request_changes'
               check (decision in ('reject', 'request_changes')),
  feedback     text,
  reason       text,                   -- kept for backward compat
  status       text        not null default 'open'
               check (status in ('open', 'addressed', 'withdrawn')),
  idempotency_key text,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.revision_requests
  add column if not exists idempotency_key text;

create index if not exists idx_revision_requests_book
  on public.revision_requests(book_id, created_at desc);

create unique index if not exists uq_revision_requests_idempotency
  on public.revision_requests(idempotency_key)
  where idempotency_key is not null;

-- ============================================================
-- 10. revision_request_items
-- ============================================================
create table if not exists public.revision_request_items (
  id                  uuid        primary key default gen_random_uuid(),
  revision_request_id uuid        not null references public.revision_requests(id) on delete cascade,
  page_number         integer,            -- null = whole-book comment
  -- scope: which content type is affected
  scope               text        not null default 'both'
                      check (scope in ('text', 'illustration', 'both')),
  description         text        not null,
  -- before/after: optional snippets to illustrate the change needed
  before_value        text,
  after_value         text,
  severity            text        not null default 'major'
                      check (severity in ('minor', 'major', 'blocker')),
  created_at          timestamptz not null default now()
);

create index if not exists idx_revision_items_request
  on public.revision_request_items(revision_request_id);

-- ============================================================
-- 11. lifecycle_events (append-only audit)
-- ============================================================
create table if not exists public.lifecycle_events (
  id              uuid        primary key default gen_random_uuid(),
  book_id         uuid        not null references public.books(id) on delete cascade,
  version_id      uuid        references public.book_versions(id) on delete set null,
  from_stage      text,
  to_stage        text        not null,
  actor           text,
  reason          text,
  -- idempotency_key prevents duplicate events from webhook replay
  idempotency_key text        unique,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_lifecycle_events_book
  on public.lifecycle_events(book_id, created_at desc);

create index if not exists idx_lifecycle_events_idempotency
  on public.lifecycle_events(idempotency_key) where idempotency_key is not null;

-- ============================================================
-- 12. product_artefacts
-- ============================================================
create table if not exists public.product_artefacts (
  id                 uuid        primary key default gen_random_uuid(),
  book_id            uuid        not null references public.books(id) on delete cascade,
  version_id         uuid        references public.book_versions(id) on delete set null,
  kind               text        not null
                     check (kind in ('pdf_digital', 'pdf_print', 'epub', 'audio', 'other')),
  -- storage_path: path within the storage bucket (durable, provider-independent)
  storage_path       text,
  -- url: signed/public URL (may expire)
  url                text        not null,
  -- durable_verified_at: when the artefact was last confirmed present in storage
  durable_verified_at timestamptz,
  -- access_url: customer-facing URL (may differ from storage url)
  access_url         text,
  -- access_verified_at: when the access_url was last confirmed reachable
  access_verified_at timestamptz,
  size_bytes         bigint,
  checksum           text,
  metadata           jsonb,
  created_at         timestamptz not null default now()
);

create index if not exists idx_product_artefacts_book
  on public.product_artefacts(book_id, kind);

create index if not exists idx_product_artefacts_version
  on public.product_artefacts(version_id) where version_id is not null;

-- Final paid-book files are isolated from legacy/public media. There are no
-- anon/authenticated object policies: the trusted server issues bounded signed
-- URLs only after exact payment, version, and access authorisation.
insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'final-books',
  'final-books',
  false,
  52428800,
  array['application/pdf', 'application/epub+zip']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Service role manages private final books" on storage.objects;
create policy "Service role manages private final books"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'final-books')
  with check (bucket_id = 'final-books');

-- ============================================================
-- 13. orders: new columns
-- ============================================================
-- version_id: the book version this order is for
alter table public.orders add column if not exists version_id                    uuid;
-- checkout_idempotency_key: prevents duplicate checkout sessions
alter table public.orders add column if not exists checkout_idempotency_key      text unique;
-- short lease for a reservation not yet bound to a Stripe session
alter table public.orders add column if not exists checkout_reservation_expires_at timestamptz;
-- payment_verified_at: when the payment was cryptographically verified (e.g. webhook)
alter table public.orders add column if not exists payment_verified_at           timestamptz;
-- purchase_confirmation_sent_at: when the confirmation email was dispatched
alter table public.orders add column if not exists purchase_confirmation_sent_at timestamptz;
alter table public.orders add column if not exists purchase_confirmation_status  text;
alter table public.orders add column if not exists purchase_confirmation_error   text;
alter table public.orders add column if not exists purchase_confirmation_provider_message_id text;
alter table public.orders
  drop constraint if exists orders_purchase_confirmation_status_check;
alter table public.orders
  add constraint orders_purchase_confirmation_status_check check (
    purchase_confirmation_status is null
    or purchase_confirmation_status in ('pending', 'sent', 'failed')
  );
-- fulfilled_at: exact timestamp when the order was marked fulfilled (not a boolean)
alter table public.orders add column if not exists fulfilled_at                  timestamptz;
-- purchaser_email: durable identity for an approved-link buyer who checks out
-- without an authenticated account. Existing account-owned rows remain unchanged.
alter table public.orders add column if not exists purchaser_email                text;

-- Canonical checkout supports either the authenticated owner OR the holder of an
-- exact-version preview claim. Legacy orders always have user_id; allowing NULL is
-- additive and the check below requires a purchaser email for anonymous orders.
alter table public.orders alter column user_id drop not null;
alter table public.orders drop constraint if exists orders_customer_identity_check;
alter table public.orders add constraint orders_customer_identity_check check (
  user_id is not null or nullif(btrim(purchaser_email), '') is not null
);

-- Resolve duplicate draft-era canonical reservations conservatively before
-- enforcing one active checkout for an exact immutable version. Paid financial
-- history is never touched.
with ranked_pending as (
  select
    id,
    row_number() over (
      partition by book_id, version_id
      order by created_at asc, id asc
    ) as row_number
  from public.orders
  where status = 'pending'
    and version_id is not null
    and stripe_payment_intent_id is null
)
update public.orders o
set status = 'failed'
from ranked_pending r
where o.id = r.id
  and r.row_number > 1;

create unique index if not exists uq_orders_one_active_version_checkout
  on public.orders(book_id, version_id)
  where status = 'pending' and version_id is not null;

-- Legacy columns kept: idempotency_key, payment_confirmed_at, payment_method, payment_metadata
-- (added by earlier version of this migration; safe to re-add)
alter table public.orders add column if not exists idempotency_key      text;
alter table public.orders add column if not exists payment_confirmed_at timestamptz;
alter table public.orders add column if not exists payment_method       text;
alter table public.orders add column if not exists payment_metadata     jsonb;

-- Deferred FK: orders.version_id -> book_versions (table now exists)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name   = 'orders'
      and constraint_name = 'orders_version_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_version_id_fkey
      foreign key (version_id)
      references public.book_versions(id)
      on delete set null;
  end if;
end;
$$;

-- ============================================================
-- 14. stripe_webhook_events (idempotency log)
-- ============================================================
create table if not exists public.stripe_webhook_events (
  id            uuid        primary key default gen_random_uuid(),
  stripe_event_id text      not null unique,
  event_type    text        not null,
  status        text        not null default 'processing'
                check (status in ('processing', 'processed', 'permanent_error')),
  claim_token   text,
  claim_expires_at timestamptz,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  order_id      uuid        references public.orders(id) on delete set null,
  book_id       uuid        references public.books(id) on delete set null,
  outcome       text,       -- 'processed', 'skipped', 'error'
  error_detail  text,
  payload       jsonb,
  created_at    timestamptz not null default now()
);

-- Rerunnable upgrades for an environment where an earlier draft of this
-- additive migration created the event table before durable claim columns.
alter table public.stripe_webhook_events
  add column if not exists status text;
alter table public.stripe_webhook_events
  add column if not exists claim_token text;
alter table public.stripe_webhook_events
  add column if not exists claim_expires_at timestamptz;
alter table public.stripe_webhook_events
  add column if not exists received_at timestamptz;
alter table public.stripe_webhook_events
  alter column processed_at drop not null;
alter table public.stripe_webhook_events
  alter column processed_at drop default;
update public.stripe_webhook_events
set status = case when outcome = 'error' then 'permanent_error' else 'processed' end
where status is null;
update public.stripe_webhook_events
set received_at = coalesce(received_at, created_at, processed_at, now())
where received_at is null;
alter table public.stripe_webhook_events
  alter column status set default 'processing';
alter table public.stripe_webhook_events
  alter column status set not null;
alter table public.stripe_webhook_events
  alter column received_at set default now();
alter table public.stripe_webhook_events
  alter column received_at set not null;
alter table public.stripe_webhook_events
  drop constraint if exists stripe_webhook_events_status_check;
alter table public.stripe_webhook_events
  add constraint stripe_webhook_events_status_check check (
    status in ('processing', 'processed', 'permanent_error')
  );

create index if not exists idx_stripe_webhook_events_stripe_id
  on public.stripe_webhook_events(stripe_event_id);

create index if not exists idx_stripe_webhook_events_order
  on public.stripe_webhook_events(order_id) where order_id is not null;

-- ============================================================
-- 15. checkout_attempts (tracks each Stripe checkout session attempt)
-- ============================================================
create table if not exists public.checkout_attempts (
  id                         uuid        primary key default gen_random_uuid(),
  book_id                    uuid        not null references public.books(id) on delete cascade,
  order_id                   uuid        references public.orders(id) on delete set null,
  version_id                 uuid        references public.book_versions(id) on delete set null,
  stripe_checkout_session_id text,
  idempotency_key            text        unique,
  status                     text        not null default 'initiated'
                             check (status in ('initiated', 'completed', 'expired', 'abandoned')),
  initiated_at               timestamptz not null default now(),
  completed_at               timestamptz,
  metadata                   jsonb,
  created_at                 timestamptz not null default now()
);

create index if not exists idx_checkout_attempts_book
  on public.checkout_attempts(book_id);

create index if not exists idx_checkout_attempts_order
  on public.checkout_attempts(order_id) where order_id is not null;

create index if not exists idx_checkout_attempts_session
  on public.checkout_attempts(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- ============================================================
-- 16. access_grants
-- ============================================================
create table if not exists public.access_grants (
  id               uuid        primary key default gen_random_uuid(),
  book_id          uuid        not null references public.books(id) on delete cascade,
  order_id         uuid        references public.orders(id) on delete set null,
  version_id       uuid        references public.book_versions(id) on delete set null,
  grantee_user_id  uuid        references auth.users(id) on delete set null,
  grantee_email    text,
  token_hash       text        unique,
  expires_at       timestamptz,
  used_at          timestamptz,
  revoked_at       timestamptz,
  -- verified_at: when the grant was confirmed usable (token checked, URL reachable)
  verified_at      timestamptz,
  access_kind      text        not null default 'download'
                   check (access_kind in ('preview', 'full_book', 'download', 'gift')),
  metadata         jsonb,
  created_at       timestamptz not null default now()
);

-- Pre-purchase approval invitations are not delivery attempts: no paid order
-- exists yet. This table must exist before the lifecycle RPC is created because
-- Ready for Purchase validates a confirmed exact-version invitation atomically.
create table if not exists public.approval_invitation_attempts (
  id                   uuid        primary key default gen_random_uuid(),
  book_id              uuid        not null references public.books(id) on delete cascade,
  version_id           uuid        not null references public.book_versions(id) on delete cascade,
  access_grant_id      uuid        references public.access_grants(id) on delete set null,
  recipient_email      text        not null,
  attempt_number       integer     not null default 1,
  status               text        not null default 'pending'
                       check (status in ('pending', 'sent', 'failed')),
  error_detail         text,
  notification_sent_at timestamptz,
  provider_message_id  text,
  metadata             jsonb,
  created_at           timestamptz not null default now()
);

alter table public.approval_invitation_attempts
  add column if not exists idempotency_key text;
create unique index if not exists uq_approval_invitation_attempts_idempotency
  on public.approval_invitation_attempts(idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_approval_invitation_attempts_book
  on public.approval_invitation_attempts(book_id, created_at desc);

create unique index if not exists uq_approval_invitation_attempts_sent
  on public.approval_invitation_attempts(book_id, version_id)
  where status = 'sent';

create index if not exists idx_access_grants_book
  on public.access_grants(book_id);

create index if not exists idx_access_grants_order
  on public.access_grants(order_id) where order_id is not null;

create index if not exists idx_access_grants_token
  on public.access_grants(token_hash) where token_hash is not null;

create index if not exists idx_access_grants_version
  on public.access_grants(version_id) where version_id is not null;

-- ============================================================
-- 17. delivery_attempts
-- ============================================================
create table if not exists public.delivery_attempts (
  id                    uuid        primary key default gen_random_uuid(),
  order_id              uuid        not null references public.orders(id) on delete cascade,
  book_id               uuid        not null references public.books(id) on delete cascade,
  version_id            uuid        references public.book_versions(id) on delete set null,
  access_grant_id       uuid        references public.access_grants(id) on delete set null,
  attempt_number        integer     not null default 1,
  channel               text        not null default 'email'
                        check (channel in ('email', 'download', 'print', 'api')),
  status                text        not null default 'pending'
                        check (status in ('pending', 'sent', 'failed', 'bounced')),
  idempotency_key       text        unique,
  error_detail          text,
  delivered_at          timestamptz,
  -- notification_sent_at: when the email/notification was dispatched
  notification_sent_at  timestamptz,
  -- access_verified_at: when we confirmed the recipient can access the book
  access_verified_at    timestamptz,
  -- provider_message_id: e.g. Resend/SendGrid message id for delivery tracking
  provider_message_id   text,
  metadata              jsonb,
  created_at            timestamptz not null default now()
);

alter table public.delivery_attempts
  add column if not exists access_grant_id uuid
  references public.access_grants(id) on delete set null;

create index if not exists idx_delivery_attempts_order
  on public.delivery_attempts(order_id, attempt_number);

create index if not exists idx_delivery_attempts_book
  on public.delivery_attempts(book_id);

create index if not exists idx_delivery_attempts_version
  on public.delivery_attempts(version_id) where version_id is not null;

-- ============================================================
-- 18. operational_failures (structured error log)
-- ============================================================
create table if not exists public.operational_failures (
  id          uuid        primary key default gen_random_uuid(),
  book_id     uuid        references public.books(id) on delete cascade,
  order_id    uuid        references public.orders(id) on delete cascade,
  stage       text,
  error_code  text        not null,
  error_detail text,
  context     jsonb,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Older deployments may already contain duplicate pending attempts. Keep one
-- claim, fail the rest, and surface each ambiguity before enforcing the unique
-- exact-order/version delivery claim.
with ranked_pending_delivery as (
  select
    id,
    pg_catalog.row_number() over (
      partition by order_id, book_id, version_id, channel
      order by created_at, id
    ) as claim_rank
  from public.delivery_attempts
  where status = 'pending'
),
reconciled_pending_delivery as (
  update public.delivery_attempts da
  set
    status = 'failed',
    error_detail = coalesce(
      da.error_detail,
      'Duplicate pending delivery claim requires operator reconciliation'
    ),
    metadata = coalesce(da.metadata, '{}'::jsonb) ||
      '{"reconciliation_required":true}'::jsonb
  from ranked_pending_delivery ranked
  where da.id = ranked.id
    and ranked.claim_rank > 1
  returning da.id, da.order_id, da.book_id, da.version_id
)
insert into public.operational_failures (
  book_id, order_id, stage, error_code, error_detail, context
)
select
  reconciled.book_id,
  reconciled.order_id,
  'Purchased',
  'duplicate_pending_delivery_claim',
  'Duplicate pending delivery claims were found; no delivery outcome was inferred.',
  pg_catalog.jsonb_build_object(
    'delivery_attempt_id', reconciled.id,
    'version_id', reconciled.version_id
  )
from reconciled_pending_delivery reconciled;

create unique index if not exists uq_delivery_attempts_pending_claim
  on public.delivery_attempts(order_id, book_id, version_id, channel)
  where status = 'pending';

create index if not exists idx_operational_failures_book
  on public.operational_failures(book_id) where book_id is not null;

create index if not exists idx_operational_failures_order
  on public.operational_failures(order_id) where order_id is not null;

-- ============================================================
-- 19. Deferred FKs: books version pointers -> book_versions
-- ============================================================
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'books'
      and constraint_name = 'books_current_version_id_fkey'
  ) then
    alter table public.books
      add constraint books_current_version_id_fkey
      foreign key (current_version_id) references public.book_versions(id) on delete set null;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'books'
      and constraint_name = 'books_review_version_id_fkey'
  ) then
    alter table public.books
      add constraint books_review_version_id_fkey
      foreign key (review_version_id) references public.book_versions(id) on delete set null;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'books'
      and constraint_name = 'books_approved_version_id_fkey'
  ) then
    alter table public.books
      add constraint books_approved_version_id_fkey
      foreign key (approved_version_id) references public.book_versions(id) on delete set null;
  end if;
end;
$$;

-- ============================================================
-- 20. Lifecycle stage index
-- ============================================================
create index if not exists idx_books_lifecycle_stage
  on public.books(lifecycle_stage) where lifecycle_stage is not null;

-- ============================================================
-- 21. Conservative legacy snapshot + lifecycle backfill
-- ============================================================
-- Rules (extremely conservative; never infer from book.status alone):
--
--   status = 'approved' AND reviewed_at IS NOT NULL
--     -> 'Approved'
--
--   status = 'pending_review'
--     -> 'Under Review'
--
--   status = 'complete' AND story_text IS NOT NULL
--     AND illustration_urls IS NOT NULL
--     -> 'Generated'   (content demonstrably exists; never Purchased or Delivered)
--
--   All other rows: left as NULL (ambiguous / recoverable by operator)
--
-- We NEVER set 'Purchased' from status alone — it requires a paid order with a
-- Stripe payment-intent identifier. We NEVER backfill 'Delivered': the legacy
-- schema did not record an actual successful access response, so a PDF URL plus
-- provider acceptance is insufficient proof. Such paid rows remain recoverable
-- at Purchased and must pass canonical finalisation/access verification.

-- 21a. Build one immutable compatibility snapshot only where the legacy JSON
-- demonstrably contains the same non-zero number of ordered text and image pages.
insert into public.book_versions (
  book_id,
  version_number,
  page_count,
  is_complete,
  story_text,
  illustration_urls,
  input_snapshot,
  content_hash,
  metadata,
  created_at
)
select
  b.id,
  1,
  jsonb_array_length(b.story_text),
  true,
  b.story_text,
  b.illustration_urls,
  jsonb_build_object('source', 'legacy_compatibility_backfill'),
  pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(
        b.story_text::text || E'\n' || b.illustration_urls::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  ),
  jsonb_build_object(
    'compatibility_backfill', true,
    'legacy_status', b.status,
    'conservative', true,
    'evidence', 'complete_ordered_immutable_page_set'
  ),
  coalesce(b.updated_at, b.created_at, now())
from public.books b
where b.current_version_id is null
  and jsonb_typeof(b.story_text) = 'array'
  and jsonb_typeof(b.illustration_urls) = 'array'
  and jsonb_array_length(b.story_text) > 0
  and jsonb_array_length(b.story_text) = jsonb_array_length(b.illustration_urls)
  and not exists (
    select 1
    from jsonb_array_elements(b.story_text) with ordinality as p(page, ordinal)
    where jsonb_typeof(p.page) <> 'object'
       or nullif(btrim(p.page->>'text'), '') is null
       or case
            when coalesce(p.page->>'pageNumber', '') ~ '^[1-9][0-9]*$'
              then (p.page->>'pageNumber')::integer
            else null
          end is distinct from p.ordinal::integer
  )
  and not exists (
    select 1 from jsonb_array_elements(b.illustration_urls) as i(value)
    where nullif(btrim(i.value #>> '{}'), '') is null
  )
  and not exists (
    select 1 from public.book_versions v where v.book_id = b.id
  )
on conflict (book_id, version_number) do nothing;

insert into public.book_version_pages (
  version_id,
  page_number,
  text_content,
  illustration_url,
  is_preview,
  metadata,
  created_at
)
select
  v.id,
  p.ordinality::integer,
  p.page->>'text',
  b.illustration_urls->>(p.ordinality - 1),
  p.ordinality <= 2,
  jsonb_build_object('compatibility_backfill', true),
  v.created_at
from public.book_versions v
join public.books b on b.id = v.book_id
cross join lateral jsonb_array_elements(b.story_text)
  with ordinality as p(page, ordinality)
where coalesce((v.metadata->>'compatibility_backfill')::boolean, false)
  and not exists (
    select 1 from public.book_version_pages vp where vp.version_id = v.id
  );

update public.books b
set current_version_id = v.id
from public.book_versions v
where b.current_version_id is null
  and v.book_id = b.id
  and v.is_complete
  and v.content_hash is not null
  and coalesce((v.metadata->>'compatibility_backfill')::boolean, false)
  and (
    select count(*)
    from public.book_version_pages vp
    where vp.version_id = v.id
      and vp.page_number between 1 and v.page_count
      and nullif(btrim(vp.text_content), '') is not null
      and nullif(btrim(vp.illustration_url), '') is not null
  ) = v.page_count
  and not exists (
    select 1
    from public.book_version_pages vp
    where vp.version_id = v.id
      and (
        vp.page_number < 1
        or vp.page_number > v.page_count
        or nullif(btrim(vp.text_content), '') is null
        or nullif(btrim(vp.illustration_url), '') is null
      )
  )
  and not exists (
    select 1
    from public.book_versions newer
    where newer.book_id = v.book_id
      and newer.is_complete
      and newer.version_number > v.version_number
  );

-- Bind a historical paid order only when there is exactly one financial row
-- and it already contains explicit provider-verification evidence. A legacy
-- payment_confirmed_at timestamp is not upgraded into payment_verified_at.
update public.orders o
set version_id = b.current_version_id
from public.books b
where o.book_id = b.id
  and o.version_id is null
  and b.current_version_id is not null
  and o.status in ('paid', 'fulfilled')
  and o.stripe_payment_intent_id is not null
  and o.payment_verified_at is not null
  and exists (
    select 1
    from public.book_versions exact_version
    where exact_version.id = b.current_version_id
      and exact_version.book_id = b.id
      and coalesce(
        (exact_version.metadata->>'compatibility_backfill')::boolean,
        false
      )
  )
  and (
    select count(*)
    from public.book_versions candidate_version
    where candidate_version.book_id = b.id
  ) = 1
  and (
    select count(*)
    from public.orders financial_row
    where financial_row.book_id = b.id
      and financial_row.status in ('paid', 'fulfilled')
  ) = 1;

-- 21b. Purchased: exact paid order evidence, never a legacy book status.
update public.books b
set lifecycle_stage     = 'Purchased',
    approved_version_id = b.current_version_id,
    stage_purchased_at  = coalesce(
      b.stage_purchased_at,
      (
        select max(o.payment_verified_at)
        from public.orders o
        where o.book_id = b.id
          and o.version_id = b.current_version_id
          and o.status in ('paid', 'fulfilled')
          and o.stripe_payment_intent_id is not null
          and o.payment_verified_at is not null
      ),
      b.updated_at
    )
where b.lifecycle_stage is null
  and b.current_version_id is not null
  and (
    select count(*) from public.orders o
    where o.book_id = b.id
      and o.version_id = b.current_version_id
      and o.status in ('paid', 'fulfilled')
      and o.stripe_payment_intent_id is not null
      and o.payment_verified_at is not null
  ) = 1
  and (
    select count(*) from public.orders o
    where o.book_id = b.id
      and o.status in ('paid', 'fulfilled')
  ) = 1;

-- 21c. Approved: reviewed_at plus a complete immutable version, and not already
-- mapped to Purchased above.
update public.books b
set lifecycle_stage  = 'Approved',
    approved_version_id = b.current_version_id,
    stage_approved_at = coalesce(b.stage_approved_at, b.reviewed_at)
where b.lifecycle_stage is null
  and b.status = 'approved'
  and b.reviewed_at is not null
  and b.current_version_id is not null
  and exists (
    select 1 from public.book_versions v
    where v.id = b.current_version_id
      and v.book_id = b.id
      and v.is_complete
      and v.content_hash is not null
      and coalesce((v.metadata->>'compatibility_backfill')::boolean, false)
  );

-- 21d. Under Review: exact immutable version required.
update public.books b
set lifecycle_stage = 'Under Review',
    review_version_id = b.current_version_id,
    stage_under_review_at = coalesce(b.stage_under_review_at, b.created_at)
where b.lifecycle_stage is null
  and b.status = 'pending_review'
  and b.current_version_id is not null
  and exists (
    select 1 from public.book_versions v
    where v.id = b.current_version_id
      and v.book_id = b.id
      and v.is_complete
      and v.content_hash is not null
      and coalesce((v.metadata->>'compatibility_backfill')::boolean, false)
  );

-- 21e. Generated: compatibility snapshot proves complete content.
update public.books b
set lifecycle_stage     = 'Generated',
    stage_generated_at  = coalesce(b.stage_generated_at, b.updated_at)
where b.lifecycle_stage is null
  and b.current_version_id is not null
  and b.status in ('complete', 'preview_ready')
  and exists (
    select 1 from public.book_versions v
    where v.id = b.current_version_id
      and v.book_id = b.id
      and v.is_complete
      and v.content_hash is not null
      and coalesce((v.metadata->>'compatibility_backfill')::boolean, false)
  );

update public.books
set stage_approved_at = coalesce(stage_approved_at, reviewed_at)
where stage_approved_at is null
  and reviewed_at is not null
  and lifecycle_stage in ('Approved', 'Purchased');

-- Every legacy row that looks advanced but did not pass the conservative gates
-- is explicitly surfaced for service-role operator reconciliation.
insert into public.operational_failures (
  book_id, stage, error_code, error_detail, context
)
select
  b.id,
  b.status,
  'legacy_reconciliation_required',
  'Legacy evidence was incomplete, ambiguous, or conflicting; no terminal stage was inferred.',
  jsonb_build_object(
    'has_immutable_version', b.current_version_id is not null,
    'has_review_timestamp', b.reviewed_at is not null,
    'advanced_financial_rows', (
      select count(*) from public.orders o
      where o.book_id = b.id and o.status in ('paid', 'fulfilled')
    ),
    'migration', '010'
  )
from public.books b
where b.lifecycle_stage is null
  and (
    b.status in ('pending_review', 'approved', 'complete', 'preview_ready', 'delivered')
    or exists (
      select 1 from public.orders o
      where o.book_id = b.id and o.status in ('paid', 'fulfilled')
    )
  )
  and not exists (
    select 1
    from public.operational_failures existing
    where existing.book_id = b.id
      and existing.error_code = 'legacy_reconciliation_required'
      and existing.resolved_at is null
  );

-- Append migration events once; ambiguous records remain lifecycle_stage NULL.
insert into public.lifecycle_events (
  book_id, version_id, from_stage, to_stage, actor, reason, idempotency_key, metadata
)
select
  b.id,
  coalesce(b.approved_version_id, b.review_version_id, b.current_version_id),
  null,
  b.lifecycle_stage,
  'compatibility-migration',
  'Conservative legacy mapping backed by immutable content and payment evidence',
  'compatibility-backfill:' || b.id::text || ':' || replace(lower(b.lifecycle_stage), ' ', '-'),
  jsonb_build_object('legacy_status', b.status, 'migration', '010')
from public.books b
where b.lifecycle_stage is not null
on conflict (idempotency_key) do nothing;

-- ============================================================
-- 22. RLS: enable on all new tables
-- ============================================================
alter table public.book_versions          enable row level security;
alter table public.book_version_pages     enable row level security;
alter table public.book_quality_findings  enable row level security;
alter table public.revision_requests      enable row level security;
alter table public.revision_request_items enable row level security;
alter table public.lifecycle_events       enable row level security;
alter table public.product_artefacts      enable row level security;
alter table public.delivery_attempts      enable row level security;
alter table public.access_grants          enable row level security;
alter table public.stripe_webhook_events  enable row level security;
alter table public.checkout_attempts      enable row level security;
alter table public.operational_failures   enable row level security;

-- ============================================================
-- 23. RLS policies (DO-guarded; CREATE POLICY IF NOT EXISTS unsupported)
-- ============================================================

-- A book owner does not automatically receive full immutable content. The
-- full snapshot requires an exact-version, verified paid-order grant.
drop policy if exists "Owners read own book_versions" on public.book_versions;
drop policy if exists "Owners read purchased book_versions" on public.book_versions;
create policy "Owners read purchased book_versions"
  on public.book_versions for select
  to authenticated
  using (
    exists (
      select 1
      from public.books b
      join public.access_grants ag
        on ag.book_id = b.id
       and ag.version_id = book_versions.id
      join public.orders o
        on o.id = ag.order_id
       and o.book_id = b.id
       and o.version_id = book_versions.id
      where b.id = book_versions.book_id
        and b.user_id = auth.uid()
        and b.approved_version_id = book_versions.id
        and b.lifecycle_stage in ('Purchased', 'Delivered')
        and ag.access_kind in ('full_book', 'download', 'gift')
        and ag.revoked_at is null
        and (ag.expires_at is null or ag.expires_at > pg_catalog.now())
        and ag.verified_at is not null
        and o.status in ('paid', 'fulfilled')
        and o.stripe_payment_intent_id is not null
        and o.payment_verified_at is not null
    )
  );

-- Before purchase, only explicitly selected preview pages are visible and only
-- through the usable grant linked to the confirmed invitation. Full pages use
-- the exact paid-grant contract above.
drop policy if exists "Owners read own book_version_pages" on public.book_version_pages;
drop policy if exists "Owners read authorised book_version_pages" on public.book_version_pages;
create policy "Owners read authorised book_version_pages"
  on public.book_version_pages for select
  to authenticated
  using (
    exists (
      select 1
      from public.book_versions bv
      join public.books b on b.id = bv.book_id
      where bv.id = book_version_pages.version_id
        and b.user_id = auth.uid()
        and b.approved_version_id = bv.id
        and (
          (
            book_version_pages.is_preview
            and b.lifecycle_stage in ('Approved', 'Ready for Purchase')
            and exists (
              select 1
              from public.approval_invitation_attempts aia
              join public.access_grants preview_grant
                on preview_grant.id = aia.access_grant_id
              where aia.book_id = b.id
                and aia.version_id = bv.id
                and aia.status = 'sent'
                and aia.notification_sent_at is not null
                and preview_grant.book_id = b.id
                and preview_grant.version_id = bv.id
                and preview_grant.access_kind = 'preview'
                and nullif(pg_catalog.btrim(preview_grant.token_hash), '') is not null
                and preview_grant.revoked_at is null
                and (
                  preview_grant.expires_at is null
                  or preview_grant.expires_at > pg_catalog.now()
                )
            )
          )
          or exists (
            select 1
            from public.access_grants full_grant
            join public.orders o
              on o.id = full_grant.order_id
             and o.book_id = b.id
             and o.version_id = bv.id
            where full_grant.book_id = b.id
              and full_grant.version_id = bv.id
              and full_grant.access_kind in ('full_book', 'download', 'gift')
              and full_grant.revoked_at is null
              and (
                full_grant.expires_at is null
                or full_grant.expires_at > pg_catalog.now()
              )
              and full_grant.verified_at is not null
              and o.status in ('paid', 'fulfilled')
              and o.stripe_payment_intent_id is not null
              and o.payment_verified_at is not null
              and b.lifecycle_stage in ('Purchased', 'Delivered')
          )
        )
    )
  );

-- book_quality_findings: owner read
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'book_quality_findings'
      and policyname = 'Owners read own book_quality_findings'
  ) then
    create policy "Owners read own book_quality_findings"
      on public.book_quality_findings for select
      using (
        exists (
          select 1 from public.book_versions bv
          join public.books b on b.id = bv.book_id
          where bv.id = book_quality_findings.version_id and b.user_id = auth.uid()
        )
      );
  end if;
end; $$;

-- revision_requests: owner read
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'revision_requests'
      and policyname = 'Owners read own revision_requests'
  ) then
    create policy "Owners read own revision_requests"
      on public.revision_requests for select
      using (
        exists (select 1 from public.books b
                where b.id = revision_requests.book_id and b.user_id = auth.uid())
      );
  end if;
end; $$;

-- revision_request_items: owner read
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'revision_request_items'
      and policyname = 'Owners read own revision_request_items'
  ) then
    create policy "Owners read own revision_request_items"
      on public.revision_request_items for select
      using (
        exists (
          select 1 from public.revision_requests rr
          join public.books b on b.id = rr.book_id
          where rr.id = revision_request_items.revision_request_id
            and b.user_id = auth.uid()
        )
      );
  end if;
end; $$;

-- lifecycle_events: owner read
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lifecycle_events'
      and policyname = 'Owners read own lifecycle_events'
  ) then
    create policy "Owners read own lifecycle_events"
      on public.lifecycle_events for select
      using (
        exists (select 1 from public.books b
                where b.id = lifecycle_events.book_id and b.user_id = auth.uid())
      );
  end if;
end; $$;

drop policy if exists "Owners read own product_artefacts" on public.product_artefacts;
drop policy if exists "Owners read purchased product_artefacts" on public.product_artefacts;
create policy "Owners read purchased product_artefacts"
  on public.product_artefacts for select
  to authenticated
  using (
    exists (
      select 1
      from public.books b
      join public.access_grants ag
        on ag.book_id = b.id
       and ag.version_id = product_artefacts.version_id
      join public.orders o
        on o.id = ag.order_id
       and o.book_id = b.id
       and o.version_id = product_artefacts.version_id
      where b.id = product_artefacts.book_id
        and b.user_id = auth.uid()
        and b.approved_version_id = product_artefacts.version_id
        and b.lifecycle_stage in ('Purchased', 'Delivered')
        and ag.access_kind in ('full_book', 'download', 'gift')
        and ag.revoked_at is null
        and (ag.expires_at is null or ag.expires_at > pg_catalog.now())
        and ag.verified_at is not null
        and o.status in ('paid', 'fulfilled')
        and o.stripe_payment_intent_id is not null
        and o.payment_verified_at is not null
    )
  );

-- delivery_attempts: owner read
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_attempts'
      and policyname = 'Owners read own delivery_attempts'
  ) then
    create policy "Owners read own delivery_attempts"
      on public.delivery_attempts for select
      using (
        exists (select 1 from public.books b
                where b.id = delivery_attempts.book_id and b.user_id = auth.uid())
      );
  end if;
end; $$;

-- access_grants: owner or grantee read
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'access_grants'
      and policyname = 'Grantee or owner reads access_grants'
  ) then
    create policy "Grantee or owner reads access_grants"
      on public.access_grants for select
      using (
        auth.uid() = grantee_user_id
        or exists (select 1 from public.books b
                   where b.id = access_grants.book_id and b.user_id = auth.uid())
      );
  end if;
end; $$;

-- stripe_webhook_events, checkout_attempts, operational_failures: service-role only
-- (no authenticated/anon policies created)

-- ============================================================
-- 24. SECURITY DEFINER RPC: create_book_version_snapshot
-- ============================================================
-- Inserts a complete immutable version and every page in one transaction.
-- No incomplete or partially-inserted version can become visible to review.

create or replace function public.create_book_version_snapshot(
  p_book_id                uuid,
  p_predecessor_id         uuid,
  p_title                  text,
  p_input_snapshot         jsonb,
  p_story_text             jsonb,
  p_illustration_urls      jsonb,
  p_content_hash           text,
  p_metadata               jsonb,
  p_pages                  jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version_id     uuid;
  v_version_number integer;
  v_page_count     integer;
begin
  if not exists (select 1 from public.books where id = p_book_id) then
    return jsonb_build_object('ok', false, 'error', 'book_not_found');
  end if;

  if p_predecessor_id is not null and not exists (
    select 1
    from public.book_versions predecessor
    where predecessor.id = p_predecessor_id
      and predecessor.book_id = p_book_id
  ) then
    return jsonb_build_object(
      'ok', false,
      'error', 'predecessor_book_mismatch',
      'message', 'The predecessor must be an immutable version of the same book'
    );
  end if;

  if jsonb_typeof(p_pages) is distinct from 'array'
     or jsonb_array_length(p_pages) = 0 then
    return jsonb_build_object('ok', false, 'error', 'pages_required');
  end if;
  if nullif(btrim(p_content_hash), '') is null then
    return jsonb_build_object('ok', false, 'error', 'content_hash_required');
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_pages) as p(
      page_number integer,
      text_content text,
      illustration_url text,
      audio_url text,
      is_preview boolean,
      metadata jsonb
    )
    where p.page_number is null
       or p.page_number < 1
       or nullif(btrim(p.text_content), '') is null
       or nullif(btrim(p.illustration_url), '') is null
  ) then
    return jsonb_build_object(
      'ok', false,
      'error', 'incomplete_pages',
      'message', 'Every version page requires a positive page number, text, and illustration'
    );
  end if;

  if (
    select count(distinct p.page_number)
    from jsonb_to_recordset(p_pages) as p(
      page_number integer,
      text_content text,
      illustration_url text,
      audio_url text,
      is_preview boolean,
      metadata jsonb
    )
  ) <> jsonb_array_length(p_pages) then
    return jsonb_build_object('ok', false, 'error', 'duplicate_page_numbers');
  end if;
  if (
    select min(p.page_number) <> 1
      or max(p.page_number) <> jsonb_array_length(p_pages)
    from jsonb_to_recordset(p_pages) as p(
      page_number integer,
      text_content text,
      illustration_url text,
      audio_url text,
      is_preview boolean,
      metadata jsonb
    )
  ) then
    return jsonb_build_object('ok', false, 'error', 'non_contiguous_page_numbers');
  end if;

  -- Serialise version numbering per book while keeping the operation transactional.
  perform pg_advisory_xact_lock(hashtextextended(p_book_id::text, 0));

  select coalesce(max(version_number), 0) + 1
    into v_version_number
  from public.book_versions
  where book_id = p_book_id;

  v_page_count := jsonb_array_length(p_pages);

  insert into public.book_versions (
    book_id, version_number, predecessor_id, title, page_count,
    input_snapshot, content_hash, is_complete, story_text,
    illustration_urls, metadata
  ) values (
    p_book_id, v_version_number, p_predecessor_id, p_title, v_page_count,
    p_input_snapshot, p_content_hash, true, p_story_text,
    p_illustration_urls, p_metadata
  )
  returning id into v_version_id;

  insert into public.book_version_pages (
    version_id, page_number, text_content, illustration_url,
    audio_url, is_preview, metadata
  )
  select
    v_version_id,
    p.page_number,
    p.text_content,
    p.illustration_url,
    p.audio_url,
    coalesce(p.is_preview, false),
    p.metadata
  from jsonb_to_recordset(p_pages) as p(
    page_number integer,
    text_content text,
    illustration_url text,
    audio_url text,
    is_preview boolean,
    metadata jsonb
  );

  return jsonb_build_object(
    'ok', true,
    'version_id', v_version_id,
    'version_number', v_version_number,
    'page_count', v_page_count
  );
end;
$$;

alter function public.create_book_version_snapshot(
  uuid, uuid, text, jsonb, jsonb, jsonb, text, jsonb, jsonb
) owner to postgres;
revoke execute on function public.create_book_version_snapshot(
  uuid, uuid, text, jsonb, jsonb, jsonb, text, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.create_book_version_snapshot(
  uuid, uuid, text, jsonb, jsonb, jsonb, text, jsonb, jsonb
) to service_role;

-- ============================================================
-- 25. SECURITY DEFINER RPC: transition_book_lifecycle
-- ============================================================
-- Signature (v2):
--   p_book_id          uuid   - book to transition
--   p_expected_stage   text   - current stage caller expects (optimistic lock; NULL = don't check)
--   p_to_stage         text   - desired target stage
--   p_version_id       uuid   - version being acted upon (NULL = use current_version_id)
--   p_expected_revision integer - current lifecycle_revision (optimistic lock; NULL = don't check)
--   p_actor            text   - who is performing the transition
--   p_reason           text   - human-readable reason
--   p_idempotency_key  text   - prevents duplicate event rows on retry
--   p_metadata         jsonb  - arbitrary context

create or replace function public.transition_book_lifecycle(
  p_book_id           uuid,
  p_expected_stage    text    default null,
  p_to_stage          text    default null,
  p_version_id        uuid    default null,
  p_expected_revision integer default null,
  p_actor             text    default null,
  p_reason            text    default null,
  p_idempotency_key   text    default null,
  p_metadata          jsonb   default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_book             record;
  v_version          record;
  v_order            record;
  v_from_stage       text;
  v_effective_vid    uuid;
  v_now              timestamptz := pg_catalog.now();
  v_stage_ts_col     text;
  v_update_sql       text;
  v_existing_event   record;
  v_inserted_event_id uuid;
begin
  -- ── 1. Lock the book row ──────────────────────────────────────────────────
  select * into v_book
  from public.books
  where id = p_book_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'book_not_found');
  end if;

  v_from_stage := v_book.lifecycle_stage;
  v_effective_vid := coalesce(p_version_id, v_book.current_version_id);

  -- An idempotency key is an operation identity, not merely a duplicate-row
  -- suppressor. A replay is accepted only for the same book, source stage,
  -- target stage, effective immutable version, and actor.
  if p_idempotency_key is not null then
    select * into v_existing_event
    from public.lifecycle_events
    where idempotency_key = p_idempotency_key;

    if found then
      if v_existing_event.book_id is distinct from p_book_id
         or (
           p_expected_stage is not null
           and v_existing_event.from_stage is distinct from p_expected_stage
         )
         or v_existing_event.to_stage is distinct from p_to_stage
         or v_existing_event.version_id is distinct from v_effective_vid
         or v_existing_event.actor is distinct from p_actor
      then
        return jsonb_build_object(
          'ok', false,
          'error', 'idempotency_key_conflict',
          'message', 'The idempotency key belongs to a different lifecycle operation'
        );
      end if;

      return jsonb_build_object(
        'ok', true,
        'idempotent_replay', true,
        'event_id', v_existing_event.id
      );
    end if;
  end if;

  -- ── 2. Optimistic lock: stage ─────────────────────────────────────────────
  if p_expected_stage is not null and v_from_stage is distinct from p_expected_stage then
    return jsonb_build_object(
      'ok', false, 'error', 'stage_conflict',
      'current_stage', v_from_stage, 'expected_stage', p_expected_stage
    );
  end if;

  -- ── 3. Optimistic lock: revision counter ──────────────────────────────────
  if p_expected_revision is not null
    and v_book.lifecycle_revision is distinct from p_expected_revision
  then
    return jsonb_build_object(
      'ok', false, 'error', 'revision_conflict',
      'current_revision', v_book.lifecycle_revision,
      'expected_revision', p_expected_revision
    );
  end if;

  -- ── 4. Validate target stage ──────────────────────────────────────────────
  if p_to_stage is null or p_to_stage not in (
    'Generated', 'Under Review', 'Changes Requested', 'Revised',
    'Approved', 'Ready for Purchase', 'Purchased', 'Delivered'
  ) then
    return jsonb_build_object('ok', false, 'error', 'invalid_stage', 'stage', p_to_stage);
  end if;

  -- ── 5. Legal transition matrix ────────────────────────────────────────────
  if not (
    (v_from_stage is null          and p_to_stage = 'Generated')
    or (v_from_stage = 'Generated'          and p_to_stage = 'Under Review')
    or (v_from_stage = 'Under Review'       and p_to_stage in ('Approved', 'Changes Requested'))
    or (v_from_stage = 'Changes Requested'  and p_to_stage in ('Revised', 'Generated'))
    or (v_from_stage = 'Revised'            and p_to_stage in ('Changes Requested', 'Approved'))
    or (v_from_stage = 'Approved'           and p_to_stage = 'Ready for Purchase')
    or (v_from_stage = 'Ready for Purchase' and p_to_stage = 'Purchased')
    or (v_from_stage = 'Purchased'          and p_to_stage = 'Delivered')
  ) then
    return jsonb_build_object(
      'ok', false, 'error', 'illegal_transition',
      'from', v_from_stage, 'to', p_to_stage
    );
  end if;

  -- ── 6. Resolve effective version ──────────────────────────────────────────
  -- ── 7. Version existence and completeness checks
  if p_to_stage in (
    'Generated', 'Under Review', 'Revised', 'Approved',
    'Ready for Purchase', 'Purchased', 'Delivered'
  ) then
    if v_effective_vid is null then
      return jsonb_build_object(
        'ok', false, 'error', 'version_required',
        'message', 'A version_id is required to enter ' || p_to_stage
      );
    end if;

    select * into v_version
    from public.book_versions
    where id = v_effective_vid and book_id = p_book_id;

    if not found then
      return jsonb_build_object(
        'ok', false, 'error', 'version_not_found',
        'version_id', v_effective_vid
      );
    end if;

    if not v_version.is_complete then
      return jsonb_build_object(
        'ok', false, 'error', 'version_incomplete',
        'version_id', v_effective_vid,
        'message', 'Version is_complete = false; all pages must be recorded before review'
      );
    end if;

    if v_version.content_hash is null or (
      select count(*) from public.book_version_pages
      where version_id = v_effective_vid
        and page_number between 1 and v_version.page_count
    ) <> v_version.page_count or exists (
      select 1 from public.book_version_pages
      where version_id = v_effective_vid
        and (
          page_number < 1
          or page_number > v_version.page_count
          or
          nullif(btrim(text_content), '') is null
          or nullif(btrim(illustration_url), '') is null
        )
    ) then
      return jsonb_build_object(
        'ok', false, 'error', 'version_pages_incomplete',
        'version_id', v_effective_vid,
        'message', 'Version page count, text, and illustrations must all be complete'
      );
    end if;

    if p_to_stage = 'Revised' and exists (
      select 1 from public.book_quality_findings
      where version_id = v_effective_vid and severity = 'blocker'
    ) then
      return jsonb_build_object(
        'ok', false, 'error', 'blocking_quality_findings',
        'message', 'Blocking quality findings must be resolved before marking a version Revised'
      );
    end if;
  end if;

  -- ── 8. Approved: bind to the version being approved ───────────────────────
  -- A missing review pointer is a reconciliation failure, never permission to
  -- substitute current_version_id.
  if p_to_stage = 'Approved' then
    if v_book.review_version_id is null then
      return jsonb_build_object(
        'ok', false, 'error', 'review_version_missing',
        'message', 'Cannot approve until the immutable review version is reconciled'
      );
    end if;

    if v_book.review_version_id is distinct from v_effective_vid then
      return jsonb_build_object(
        'ok', false, 'error', 'version_mismatch',
        'message', 'Approving a different version than the one under review',
        'review_version_id', v_book.review_version_id,
        'approving_version_id', v_effective_vid
      );
    end if;
  end if;

  if p_to_stage in ('Ready for Purchase', 'Purchased', 'Delivered')
     and (
       v_book.approved_version_id is null
       or v_book.approved_version_id is distinct from v_effective_vid
     )
  then
    return jsonb_build_object(
      'ok', false, 'error', 'approved_version_mismatch',
      'message', 'The transition must use the exact approved version'
    );
  end if;

  -- Ready for Purchase is only valid after the exact approved-version
  -- invitation and its usable restricted preview grant have both been
  -- durably recorded.
  if p_to_stage = 'Ready for Purchase' and not exists (
    select 1
    from public.approval_invitation_attempts aia
    join public.access_grants ag on ag.id = aia.access_grant_id
    where aia.book_id = p_book_id
      and aia.version_id = v_effective_vid
      and aia.status = 'sent'
      and aia.notification_sent_at is not null
      and ag.book_id = p_book_id
      and ag.version_id = v_effective_vid
      and ag.access_kind = 'preview'
      and nullif(pg_catalog.btrim(ag.token_hash), '') is not null
      and ag.revoked_at is null
      and (ag.expires_at is null or ag.expires_at > v_now)
  ) then
    return jsonb_build_object(
      'ok', false,
      'error', 'approval_invitation_required',
      'message', 'No confirmed approval invitation exists for this exact version'
    );
  end if;

  -- ── 9. Purchased: exact paid order with payment_verified_at ──────────────
  if p_to_stage = 'Purchased' then
    select * into v_order
    from public.orders
    where book_id = p_book_id
      and version_id = v_effective_vid
      and status in ('paid', 'fulfilled')
      and stripe_payment_intent_id is not null
      and payment_verified_at is not null
    order by payment_verified_at desc
    limit 1;

    if not found then
      return jsonb_build_object(
        'ok', false, 'error', 'payment_required',
        'message', 'No paid order with stripe_payment_intent_id and payment_verified_at found'
      );
    end if;

  end if;

  -- ── 10. Delivered: verified durable artefact + verified usable access grant
  --        + successful notification/access delivery attempt ──────────────────
  if p_to_stage = 'Delivered' then
    -- Every delivery proof must converge on one and only one exact paid order.
    if (
      select pg_catalog.count(*)
      from public.orders exact_order
      where exact_order.book_id = p_book_id
        and exact_order.version_id = v_effective_vid
        and exact_order.status in ('paid', 'fulfilled')
        and exact_order.stripe_payment_intent_id is not null
        and exact_order.payment_verified_at is not null
    ) <> 1 then
      return jsonb_build_object(
        'ok', false,
        'error', 'exact_paid_order_required',
        'message', 'Delivery requires exactly one verified paid order for the immutable version'
      );
    end if;

    select * into v_order
    from public.orders
    where book_id = p_book_id
      and version_id = v_effective_vid
      and status in ('paid', 'fulfilled')
      and stripe_payment_intent_id is not null
      and payment_verified_at is not null
    limit 1;

    -- 10a. Durable artefact: storage and its customer-facing access URL were
    -- both verified by actual responses.
    if not exists (
      select 1 from public.product_artefacts
      where book_id = p_book_id
        and version_id = v_effective_vid
        and kind in ('pdf_digital', 'epub')
        and nullif(btrim(storage_path), '') is not null
        and storage_path like
          'books/' || p_book_id::text || '/versions/' || v_effective_vid::text || '/%'
        and metadata->>'storage_bucket' = 'final-books'
        and nullif(pg_catalog.btrim(access_url), '') is not null
        and durable_verified_at is not null
        and access_verified_at is not null
    ) then
      return jsonb_build_object(
        'ok', false, 'error', 'artefact_not_verified',
        'message', 'No durable-verified pdf_digital or epub artefact for this version'
      );
    end if;

    -- 10b. The successful notification must be linked to the very same usable
    -- grant that was verified and sent, never merely to some other grant for
    -- the order/version.
    if not exists (
      select 1
      from public.delivery_attempts da
      join public.access_grants ag on ag.id = da.access_grant_id
      join public.orders o on o.id = da.order_id
      where da.order_id = v_order.id
        and da.book_id = p_book_id
        and da.version_id = v_effective_vid
        and da.status = 'sent'
        and da.notification_sent_at is not null
        and da.access_verified_at is not null
        and ag.order_id = v_order.id
        and ag.book_id = p_book_id
        and ag.version_id = v_effective_vid
        and ag.access_kind in ('full_book', 'download', 'gift')
        and ag.revoked_at is null
        and (ag.expires_at is null or ag.expires_at > v_now)
        and ag.verified_at is not null
        and o.book_id = p_book_id
        and o.version_id = v_effective_vid
        and o.status in ('paid', 'fulfilled')
        and o.stripe_payment_intent_id is not null
        and o.payment_verified_at is not null
    ) then
      return jsonb_build_object(
        'ok', false, 'error', 'delivery_not_confirmed',
        'message', 'No sent delivery attempt is linked to its exact verified usable access grant'
      );
    end if;

    -- 10c. Exact approved version must match
    if v_book.approved_version_id is not null
      and v_book.approved_version_id is distinct from v_effective_vid
    then
      return jsonb_build_object(
        'ok', false, 'error', 'approved_version_mismatch',
        'message', 'Delivering a different version than the approved version',
        'approved_version_id', v_book.approved_version_id,
        'delivering_version_id', v_effective_vid
      );
    end if;
  end if;

  -- Reserve the idempotency identity before changing any lifecycle state.
  -- This closes the cross-book race where the same key could otherwise update
  -- one book while losing the unique lifecycle_events insert to another.
  insert into public.lifecycle_events
    (book_id, version_id, from_stage, to_stage, actor, reason, idempotency_key, metadata, created_at)
  values
    (p_book_id, v_effective_vid, v_from_stage, p_to_stage,
     p_actor, p_reason, p_idempotency_key, p_metadata, v_now)
  on conflict (idempotency_key) do nothing
  returning id into v_inserted_event_id;

  if p_idempotency_key is not null and v_inserted_event_id is null then
    select * into v_existing_event
    from public.lifecycle_events
    where idempotency_key = p_idempotency_key;

    if not found
       or v_existing_event.book_id is distinct from p_book_id
       or v_existing_event.from_stage is distinct from v_from_stage
       or v_existing_event.to_stage is distinct from p_to_stage
       or v_existing_event.version_id is distinct from v_effective_vid
       or v_existing_event.actor is distinct from p_actor
    then
      return jsonb_build_object(
        'ok', false,
        'error', 'idempotency_key_conflict',
        'message', 'The idempotency key belongs to a different lifecycle operation'
      );
    end if;

    return jsonb_build_object(
      'ok', true,
      'idempotent_replay', true,
      'event_id', v_existing_event.id
    );
  end if;

  -- ── 11. Update the book row ───────────────────────────────────────────────
  v_stage_ts_col := case p_to_stage
    when 'Generated'          then 'stage_generated_at'
    when 'Under Review'       then 'stage_under_review_at'
    when 'Changes Requested'  then 'stage_changes_requested_at'
    when 'Revised'            then 'stage_revised_at'
    when 'Approved'           then 'stage_approved_at'
    when 'Ready for Purchase' then 'stage_ready_for_purchase_at'
    when 'Purchased'          then 'stage_purchased_at'
    when 'Delivered'          then 'stage_delivered_at'
  end;

  -- Set stage, timestamp (only on first entry), increment revision counter.
  -- Also bind version pointers for key stages.
  v_update_sql := format(
    $sql$
      update public.books set
        lifecycle_stage    = $1,
        %I                 = coalesce(%I, $2),
        lifecycle_revision = lifecycle_revision + 1,
        current_version_id = case
          when $3 is not null then $3
          else current_version_id
        end,
        review_version_id  = case
          when $1 in ('Under Review', 'Revised') and $3 is not null then $3
          when $1 = 'Generated' then null
          else review_version_id
        end,
        approved_version_id = case
          when $1 = 'Approved' and $3 is not null then $3
          else approved_version_id
        end,
        updated_at = $2
      where id = $4
    $sql$,
    v_stage_ts_col, v_stage_ts_col
  );
  execute v_update_sql using p_to_stage, v_now, v_effective_vid, p_book_id;

  -- ── 13. Order fulfilment: only on actual Delivered transition ─────────────
  -- Update fulfilled_at on the exact paid order (not just any order).
  if p_to_stage = 'Delivered' then
    update public.orders
    set status       = 'fulfilled',
        fulfilled_at = coalesce(fulfilled_at, v_now)
    where id = v_order.id
      and book_id = p_book_id
      and version_id = v_effective_vid
      and status in ('paid', 'fulfilled')
      and stripe_payment_intent_id is not null
      and payment_verified_at is not null;
  end if;

  return jsonb_build_object(
    'ok', true,
    'from_stage', v_from_stage,
    'to_stage', p_to_stage,
    'version_id', v_effective_vid,
    'transitioned_at', v_now
  );
end;
$$;

-- Restrict to service_role only.
alter function public.transition_book_lifecycle(
  uuid, text, text, uuid, integer, text, text, text, jsonb
) owner to postgres;
revoke execute on function public.transition_book_lifecycle(
  uuid, text, text, uuid, integer, text, text, text, jsonb
) from public;
revoke execute on function public.transition_book_lifecycle(
  uuid, text, text, uuid, integer, text, text, text, jsonb
) from anon;
revoke execute on function public.transition_book_lifecycle(
  uuid, text, text, uuid, integer, text, text, text, jsonb
) from authenticated;
grant execute on function public.transition_book_lifecycle(
  uuid, text, text, uuid, integer, text, text, text, jsonb
) to service_role;

-- ============================================================
-- 26. approval_invitation_attempts
-- ============================================================
-- Durable, idempotent record of the "you're approved — preview and complete
-- your purchase" invitation email sent to the customer immediately after a
-- reviewer approves a version.
--
-- This is deliberately SEPARATE from delivery_attempts:
--   * At approval time there is no paid order yet, so delivery_attempts
--     (which requires a NOT NULL order_id) cannot represent this attempt.
--   * The approval invitation is a pre-purchase notification; final delivery
--     of the purchased book is tracked independently in delivery_attempts.
--
-- Idempotency: a partial unique index guarantees at most one successful
-- ('sent') invitation per (book_id, version_id). Failed/pending attempts may
-- accumulate for retry/audit, but a confirmed send is recorded exactly once.
-- "Ready for Purchase" must only be entered after a row here reaches
-- status = 'sent' with notification_sent_at populated.
create table if not exists public.approval_invitation_attempts (
  id                   uuid        primary key default gen_random_uuid(),
  book_id              uuid        not null references public.books(id) on delete cascade,
  version_id           uuid        not null references public.book_versions(id) on delete cascade,
  access_grant_id      uuid        references public.access_grants(id) on delete set null,
  recipient_email      text        not null,
  attempt_number       integer     not null default 1,
  status               text        not null default 'pending'
                       check (status in ('pending', 'sent', 'failed')),
  error_detail         text,
  -- notification_sent_at: when the invitation email was confirmed dispatched
  notification_sent_at timestamptz,
  provider_message_id  text,
  metadata             jsonb,
  created_at           timestamptz not null default now()
);

create index if not exists idx_approval_invitation_attempts_book
  on public.approval_invitation_attempts(book_id, version_id);

-- At most one confirmed ('sent') invitation per book+version — enforces
-- idempotency of the "invitation delivered" fact at the database level.
create unique index if not exists uq_approval_invitation_attempts_sent
  on public.approval_invitation_attempts(book_id, version_id)
  where status = 'sent';

alter table public.approval_invitation_attempts enable row level security;

-- Owner read only; writes are service-role (bypasses RLS via service key).
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'approval_invitation_attempts'
      and policyname = 'Owners read own approval_invitation_attempts'
  ) then
    create policy "Owners read own approval_invitation_attempts"
      on public.approval_invitation_attempts for select
      using (
        exists (select 1 from public.books b
                where b.id = approval_invitation_attempts.book_id and b.user_id = auth.uid())
      );
  end if;
end; $$;

-- ============================================================
-- 27. Atomic verified-payment + Purchased transition
-- ============================================================
-- Payment evidence and the lifecycle transition commit together. The nested
-- exception block rolls the order update back if the canonical transition is
-- rejected, while still returning a structured result to the webhook.
create or replace function public.record_verified_payment_and_purchase(
  p_order_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_amount_cents integer,
  p_currency text,
  p_book_id uuid,
  p_version_id uuid,
  p_actor text,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_book public.books%rowtype;
  v_transition jsonb;
  v_now timestamptz := pg_catalog.now();
begin
  select * into v_order
  from public.orders
  where id = p_order_id
    and (
      stripe_checkout_session_id = p_checkout_session_id
      or stripe_checkout_session_id is null
    )
  for update;

  if not found then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'order_not_found');
  end if;

  select * into v_book
  from public.books
  where id = p_book_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'book_not_found');
  end if;

  if v_order.book_id is distinct from p_book_id
     or v_order.version_id is distinct from p_version_id
     or v_book.approved_version_id is distinct from p_version_id
  then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'exact_identity_mismatch');
  end if;

  if v_order.amount_cents is distinct from p_amount_cents
     or pg_catalog.lower(v_order.currency) is distinct from pg_catalog.lower(p_currency)
  then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'payment_amount_mismatch');
  end if;

  if nullif(pg_catalog.btrim(p_payment_intent_id), '') is null then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'payment_intent_required');
  end if;

  if v_order.status in ('paid', 'fulfilled')
     and v_book.lifecycle_stage in ('Purchased', 'Delivered')
  then
    if v_order.stripe_payment_intent_id is distinct from p_payment_intent_id
       or v_order.stripe_checkout_session_id is distinct from p_checkout_session_id
    then
      return pg_catalog.jsonb_build_object(
        'ok', false,
        'error', 'idempotency_key_conflict',
        'message', 'The paid order belongs to a different provider operation'
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'ok', true,
      'idempotent_replay', true,
      'order_id', v_order.id,
      'book_id', v_book.id,
      'current_stage', v_book.lifecycle_stage
    );
  end if;

  if v_order.status not in ('pending', 'paid', 'fulfilled') then
    return pg_catalog.jsonb_build_object(
      'ok', false, 'error', 'order_state_conflict', 'order_status', v_order.status
    );
  end if;

  if v_book.lifecycle_stage not in ('Ready for Purchase', 'Purchased') then
    return pg_catalog.jsonb_build_object(
      'ok', false, 'error', 'stage_conflict', 'current_stage', v_book.lifecycle_stage
    );
  end if;

  begin
    update public.orders
    set status = 'paid',
        stripe_checkout_session_id = coalesce(
          stripe_checkout_session_id,
          p_checkout_session_id
        ),
        stripe_payment_intent_id = p_payment_intent_id,
        payment_verified_at = coalesce(payment_verified_at, v_now),
        payment_confirmed_at = coalesce(payment_confirmed_at, v_now),
        payment_metadata = coalesce(payment_metadata, '{}'::jsonb) || p_metadata
    where id = v_order.id;

    if v_book.lifecycle_stage = 'Ready for Purchase' then
      v_transition := public.transition_book_lifecycle(
        p_book_id,
        'Ready for Purchase',
        'Purchased',
        p_version_id,
        v_book.lifecycle_revision,
        p_actor,
        'Verified Stripe payment for checkout session ' || p_checkout_session_id,
        p_idempotency_key,
        p_metadata
      );

      if coalesce((v_transition->>'ok')::boolean, false) is false then
        raise exception using
          errcode = 'P0001',
          message = 'payment_purchase_rejected:' ||
            coalesce(v_transition->>'error', 'unknown');
      end if;
    end if;

    return pg_catalog.jsonb_build_object(
      'ok', true,
      'order_id', v_order.id,
      'book_id', v_book.id,
      'version_id', p_version_id,
      'transition', v_transition
    );
  exception when sqlstate 'P0001' then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'error', pg_catalog.split_part(sqlerrm, ':', 2),
      'message', sqlerrm
    );
  end;
end;
$$;

alter function public.record_verified_payment_and_purchase(
  uuid, text, text, integer, text, uuid, uuid, text, text, jsonb
) owner to postgres;
revoke execute on function public.record_verified_payment_and_purchase(
  uuid, text, text, integer, text, uuid, uuid, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.record_verified_payment_and_purchase(
  uuid, text, text, integer, text, uuid, uuid, text, text, jsonb
) to service_role;

-- ============================================================
-- 28. Atomic reviewer change decision
-- ============================================================
-- The structured request, page-scoped items and lifecycle transition are one
-- transaction. A stale token/version, invalid page or concurrent decision
-- leaves no orphan request rows behind.
create or replace function public.create_revision_request_and_transition(
  p_book_id uuid,
  p_version_id uuid,
  p_expected_revision integer,
  p_requested_by text,
  p_decision text,
  p_feedback text,
  p_items jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_book public.books%rowtype;
  v_request_id uuid := extensions.gen_random_uuid();
  v_existing_request public.revision_requests%rowtype;
  v_existing_items jsonb;
  v_requested_items jsonb;
  v_transition jsonb;
begin
  select * into v_book
  from public.books
  where id = p_book_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'book_not_found');
  end if;

  -- Idempotent replay must be checked before the stage guard because a
  -- successful first call has already moved the book to Changes Requested.
  -- The key may replay only the same exact revision operation.
  if p_idempotency_key is not null then
    select * into v_existing_request
    from public.revision_requests
    where book_id = p_book_id
      and idempotency_key = p_idempotency_key;

    if found then
      if pg_catalog.jsonb_typeof(p_items) is distinct from 'array' then
        return pg_catalog.jsonb_build_object(
          'ok', false,
          'error', 'idempotency_key_conflict',
          'message', 'The idempotency key replay has different revision items'
        );
      end if;

      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'page_number', item.page_number::text,
          'scope', item.scope,
          'description', item.description,
          'before_value', item.before_value,
          'after_value', item.after_value,
          'severity', item.severity
        )
        order by item.page_number, item.scope, item.description
      )
      into v_existing_items
      from public.revision_request_items item
      where item.revision_request_id = v_existing_request.id;

      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'page_number', element->>'page_number',
          'scope', element->>'scope',
          'description', element->>'description',
          'before_value', element->>'before_value',
          'after_value', element->>'after_value',
          'severity', coalesce(element->>'severity', 'major')
        )
        order by element->>'page_number', element->>'scope', element->>'description'
      )
      into v_requested_items
      from pg_catalog.jsonb_array_elements(p_items) as elements(element);

      if v_existing_request.version_id is distinct from p_version_id
         or v_existing_request.requested_by is distinct from pg_catalog.btrim(p_requested_by)
         or v_existing_request.decision is distinct from p_decision
         or v_existing_request.feedback is distinct from pg_catalog.btrim(p_feedback)
         or v_existing_items is distinct from v_requested_items
      then
        return pg_catalog.jsonb_build_object(
          'ok', false,
          'error', 'idempotency_key_conflict',
          'message', 'The idempotency key belongs to a different revision operation'
        );
      end if;

      return pg_catalog.jsonb_build_object(
        'ok', true,
        'idempotent_replay', true,
        'request_id', v_existing_request.id
      );
    end if;
  end if;

  if v_book.lifecycle_stage not in ('Under Review', 'Revised') then
    return pg_catalog.jsonb_build_object(
      'ok', false, 'error', 'stage_conflict',
      'current_stage', v_book.lifecycle_stage
    );
  end if;
  if v_book.lifecycle_revision <> p_expected_revision then
    return pg_catalog.jsonb_build_object(
      'ok', false, 'error', 'stale_revision',
      'current_revision', v_book.lifecycle_revision
    );
  end if;
  if p_version_id is null
     or v_book.review_version_id is distinct from p_version_id
  then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'review_version_mismatch');
  end if;
  if p_decision not in ('reject', 'request_changes') then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'invalid_decision');
  end if;
  if nullif(pg_catalog.btrim(p_requested_by), '') is null
     or nullif(pg_catalog.btrim(p_feedback), '') is null
  then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'feedback_required');
  end if;
  if p_items is null
     or pg_catalog.jsonb_typeof(p_items) <> 'array'
     or pg_catalog.jsonb_array_length(p_items) = 0
  then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'items_required');
  end if;
  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_items) as elements(item)
    where coalesce((item->>'page_number')::integer, 0) <= 0
       or item->>'scope' not in ('text', 'illustration', 'both')
       or nullif(pg_catalog.btrim(item->>'description'), '') is null
       or not exists (
         select 1
         from public.book_version_pages page
         where page.version_id = p_version_id
           and page.page_number = (item->>'page_number')::integer
       )
  ) then
    return pg_catalog.jsonb_build_object('ok', false, 'error', 'invalid_revision_item');
  end if;

  begin
    insert into public.revision_requests (
      id, book_id, version_id, requested_by, decision, feedback, reason, status,
      idempotency_key
    ) values (
      v_request_id, p_book_id, p_version_id, pg_catalog.btrim(p_requested_by),
      p_decision, pg_catalog.btrim(p_feedback), pg_catalog.btrim(p_feedback), 'open',
      p_idempotency_key
    );

    insert into public.revision_request_items (
      revision_request_id, page_number, scope, description,
      before_value, after_value, severity
    )
    select
      v_request_id,
      (item->>'page_number')::integer,
      item->>'scope',
      item->>'description',
      item->>'before_value',
      item->>'after_value',
      coalesce(item->>'severity', 'major')
    from pg_catalog.jsonb_array_elements(p_items) as elements(item);

    v_transition := public.transition_book_lifecycle(
      p_book_id,
      v_book.lifecycle_stage,
      'Changes Requested',
      p_version_id,
      p_expected_revision,
      pg_catalog.btrim(p_requested_by),
      pg_catalog.left(pg_catalog.btrim(p_feedback), 2000),
      p_idempotency_key,
      pg_catalog.jsonb_build_object(
        'decision', p_decision,
        'revision_request_id', v_request_id
      )
    );
    if coalesce((v_transition->>'ok')::boolean, false) is false then
      raise exception using
        errcode = 'P0001',
        message = 'revision_transition_rejected:' ||
          coalesce(v_transition->>'error', 'unknown');
    end if;

    return pg_catalog.jsonb_build_object(
      'ok', true,
      'request_id', v_request_id,
      'transition', v_transition
    );
  exception when sqlstate 'P0001' then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'error', pg_catalog.split_part(sqlerrm, ':', 2),
      'message', sqlerrm
    );
  end;
end;
$$;

alter function public.create_revision_request_and_transition(
  uuid, uuid, integer, text, text, text, jsonb, text
) owner to postgres;
revoke execute on function public.create_revision_request_and_transition(
  uuid, uuid, integer, text, text, text, jsonb, text
) from public, anon, authenticated;
grant execute on function public.create_revision_request_and_transition(
  uuid, uuid, integer, text, text, text, jsonb, text
) to service_role;
