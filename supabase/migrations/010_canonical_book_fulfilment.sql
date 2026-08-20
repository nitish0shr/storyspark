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
as $$
begin
  raise exception 'Mutations to % are not permitted after insert (immutable record)', TG_TABLE_NAME;
end;
$$;

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
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_revision_requests_book
  on public.revision_requests(book_id, created_at desc);

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
  jsonb_build_object(
    'compatibility_backfill', true,
    'legacy_status', b.status,
    'conservative', true
  ),
  coalesce(b.updated_at, b.created_at, now())
from public.books b
where b.current_version_id is null
  and jsonb_typeof(b.story_text) = 'array'
  and jsonb_typeof(b.illustration_urls) = 'array'
  and jsonb_array_length(b.story_text) > 0
  and jsonb_array_length(b.story_text) = jsonb_array_length(b.illustration_urls)
  and not exists (
    select 1 from jsonb_array_elements(b.story_text) p
    where nullif(btrim(p->>'text'), '') is null
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
  and not exists (
    select 1
    from public.book_versions newer
    where newer.book_id = v.book_id
      and newer.is_complete
      and newer.version_number > v.version_number
  );

-- Bind historical paid orders to the one demonstrably complete compatibility
-- version, while retaining every financial row and amount.
update public.orders o
set version_id = b.current_version_id,
    payment_verified_at = coalesce(o.payment_verified_at, o.payment_confirmed_at)
from public.books b
where o.book_id = b.id
  and o.version_id is null
  and b.current_version_id is not null
  and o.status in ('paid', 'fulfilled')
  and o.stripe_payment_intent_id is not null
  and coalesce(o.payment_verified_at, o.payment_confirmed_at) is not null;

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
  and exists (
    select 1 from public.orders o
    where o.book_id = b.id
      and o.version_id = b.current_version_id
      and o.status in ('paid', 'fulfilled')
      and o.stripe_payment_intent_id is not null
      and o.payment_verified_at is not null
  );

-- 21c. Approved: reviewed_at plus a complete immutable version, and not already
-- mapped to Purchased above.
update public.books b
set lifecycle_stage  = 'Approved',
    approved_version_id = b.current_version_id,
    stage_approved_at = coalesce(b.stage_approved_at, b.reviewed_at)
where b.lifecycle_stage is null
  and b.status = 'approved'
  and b.reviewed_at is not null
  and b.current_version_id is not null;

-- 21d. Under Review: exact immutable version required.
update public.books b
set lifecycle_stage = 'Under Review',
    review_version_id = b.current_version_id,
    stage_under_review_at = coalesce(b.stage_under_review_at, b.created_at)
where b.lifecycle_stage is null
  and b.status = 'pending_review'
  and b.current_version_id is not null;

-- 21e. Generated: compatibility snapshot proves complete content.
update public.books b
set lifecycle_stage     = 'Generated',
    stage_generated_at  = coalesce(b.stage_generated_at, b.updated_at)
where b.lifecycle_stage is null
  and b.current_version_id is not null
  and b.status in ('complete', 'preview_ready');

-- 20e. Backfill remaining stage timestamps from existing columns where available
update public.books
set stage_delivered_at = coalesce(stage_delivered_at, delivered_at)
where stage_delivered_at is null and delivered_at is not null;

update public.books
set stage_approved_at = coalesce(stage_approved_at, reviewed_at)
where stage_approved_at is null
  and reviewed_at is not null
  and status in ('approved', 'delivered');

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

-- book_versions: owner read
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'book_versions'
      and policyname = 'Owners read own book_versions'
  ) then
    create policy "Owners read own book_versions"
      on public.book_versions for select
      using (
        exists (select 1 from public.books b
                where b.id = book_versions.book_id and b.user_id = auth.uid())
      );
  end if;
end; $$;

-- book_version_pages: owner read
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'book_version_pages'
      and policyname = 'Owners read own book_version_pages'
  ) then
    create policy "Owners read own book_version_pages"
      on public.book_version_pages for select
      using (
        exists (
          select 1 from public.book_versions bv
          join public.books b on b.id = bv.book_id
          where bv.id = book_version_pages.version_id and b.user_id = auth.uid()
        )
      );
  end if;
end; $$;

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

-- product_artefacts: owner read
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'product_artefacts'
      and policyname = 'Owners read own product_artefacts'
  ) then
    create policy "Owners read own product_artefacts"
      on public.product_artefacts for select
      using (
        exists (select 1 from public.books b
                where b.id = product_artefacts.book_id and b.user_id = auth.uid())
      );
  end if;
end; $$;

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

  if jsonb_typeof(p_pages) is distinct from 'array'
     or jsonb_array_length(p_pages) = 0 then
    return jsonb_build_object('ok', false, 'error', 'pages_required');
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
  v_now              timestamptz := now();
  v_stage_ts_col     text;
  v_update_sql       text;
  v_existing_event   uuid;
begin
  -- ── 0. Idempotency: if this key already produced a committed event, replay it ─
  if p_idempotency_key is not null then
    select id into v_existing_event
    from public.lifecycle_events
    where idempotency_key = p_idempotency_key;

    if found then
      return jsonb_build_object(
        'ok', true,
        'idempotent_replay', true,
        'event_id', v_existing_event
      );
    end if;
  end if;

  -- ── 1. Lock the book row ──────────────────────────────────────────────────
  select * into v_book
  from public.books
  where id = p_book_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'book_not_found');
  end if;

  v_from_stage := v_book.lifecycle_stage;

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
    or (v_from_stage = 'Revised'            and p_to_stage in ('Under Review', 'Approved'))
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
  v_effective_vid := coalesce(p_version_id, v_book.current_version_id);

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

    if (
      select count(*) from public.book_version_pages
      where version_id = v_effective_vid
    ) <> v_version.page_count or exists (
      select 1 from public.book_version_pages
      where version_id = v_effective_vid
        and (
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
  -- review_version_id must match what is under review (if set).
  if p_to_stage = 'Approved' then
    if v_book.review_version_id is not null
      and v_book.review_version_id is distinct from v_effective_vid
    then
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
  -- invitation has been durably recorded as sent.
  if p_to_stage = 'Ready for Purchase' and not exists (
    select 1
    from public.approval_invitation_attempts
    where book_id = p_book_id
      and version_id = v_effective_vid
      and status = 'sent'
      and notification_sent_at is not null
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
    -- 10a. Durable artefact: storage and its customer-facing access URL were
    -- both verified by actual responses.
    if not exists (
      select 1 from public.product_artefacts
      where book_id = p_book_id
        and version_id = v_effective_vid
        and kind in ('pdf_digital', 'epub')
        and nullif(btrim(storage_path), '') is not null
        and durable_verified_at is not null
        and access_verified_at is not null
    ) then
      return jsonb_build_object(
        'ok', false, 'error', 'artefact_not_verified',
        'message', 'No durable-verified pdf_digital or epub artefact for this version'
      );
    end if;

    -- 10b. Verified usable access grant (not revoked, not expired, verified_at set)
    if not exists (
      select 1
      from public.access_grants ag
      join public.orders o on o.id = ag.order_id
      where ag.book_id = p_book_id
        and ag.version_id = v_effective_vid
        and ag.access_kind in ('full_book', 'download', 'gift')
        and ag.revoked_at is null
        and (ag.expires_at is null or ag.expires_at > v_now)
        and ag.verified_at is not null
        and o.book_id = p_book_id
        and o.version_id = v_effective_vid
        and o.status in ('paid', 'fulfilled')
        and o.payment_verified_at is not null
    ) then
      return jsonb_build_object(
        'ok', false, 'error', 'access_grant_not_verified',
        'message', 'No verified usable access grant for this version'
      );
    end if;

    -- 10c. Successful notification AND access delivery attempt
    if not exists (
      select 1
      from public.delivery_attempts da
      join public.orders o on o.id = da.order_id
      where da.book_id = p_book_id
        and da.version_id = v_effective_vid
        and da.status = 'sent'
        and da.notification_sent_at is not null
        and da.access_verified_at is not null
        and o.book_id = p_book_id
        and o.version_id = v_effective_vid
        and o.status in ('paid', 'fulfilled')
        and o.payment_verified_at is not null
    ) then
      return jsonb_build_object(
        'ok', false, 'error', 'delivery_not_confirmed',
        'message', 'No delivery attempt with status=sent, notification_sent_at, and access_verified_at'
      );
    end if;

    -- 10d. Exact approved version must match
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

  -- ── 12. Append lifecycle event (idempotent via unique key) ────────────────
  insert into public.lifecycle_events
    (book_id, version_id, from_stage, to_stage, actor, reason, idempotency_key, metadata, created_at)
  values
    (p_book_id, v_effective_vid, v_from_stage, p_to_stage,
     p_actor, p_reason, p_idempotency_key, p_metadata, v_now)
  on conflict (idempotency_key) do nothing;

  -- ── 13. Order fulfilment: only on actual Delivered transition ─────────────
  -- Update fulfilled_at on the exact paid order (not just any order).
  if p_to_stage = 'Delivered' then
    update public.orders
    set status       = 'fulfilled',
        fulfilled_at = coalesce(fulfilled_at, v_now)
    where book_id = p_book_id
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
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_book public.books%rowtype;
  v_transition jsonb;
  v_now timestamptz := now();
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
    return jsonb_build_object('ok', false, 'error', 'order_not_found');
  end if;

  select * into v_book
  from public.books
  where id = p_book_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'book_not_found');
  end if;

  if v_order.book_id is distinct from p_book_id
     or v_order.version_id is distinct from p_version_id
     or v_book.approved_version_id is distinct from p_version_id
  then
    return jsonb_build_object('ok', false, 'error', 'exact_identity_mismatch');
  end if;

  if v_order.amount_cents is distinct from p_amount_cents
     or lower(v_order.currency) is distinct from lower(p_currency)
  then
    return jsonb_build_object('ok', false, 'error', 'payment_amount_mismatch');
  end if;

  if nullif(btrim(p_payment_intent_id), '') is null then
    return jsonb_build_object('ok', false, 'error', 'payment_intent_required');
  end if;

  if v_order.status in ('paid', 'fulfilled')
     and v_book.lifecycle_stage in ('Purchased', 'Delivered')
  then
    return jsonb_build_object(
      'ok', true,
      'idempotent_replay', true,
      'order_id', v_order.id,
      'book_id', v_book.id,
      'current_stage', v_book.lifecycle_stage
    );
  end if;

  if v_order.status not in ('pending', 'paid', 'fulfilled') then
    return jsonb_build_object(
      'ok', false, 'error', 'order_state_conflict', 'order_status', v_order.status
    );
  end if;

  if v_book.lifecycle_stage not in ('Ready for Purchase', 'Purchased') then
    return jsonb_build_object(
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

    return jsonb_build_object(
      'ok', true,
      'order_id', v_order.id,
      'book_id', v_book.id,
      'version_id', p_version_id,
      'transition', v_transition
    );
  exception when sqlstate 'P0001' then
    return jsonb_build_object(
      'ok', false,
      'error', split_part(sqlerrm, ':', 2),
      'message', sqlerrm
    );
  end;
end;
$$;

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
set search_path = public
as $$
declare
  v_book public.books%rowtype;
  v_request_id uuid := gen_random_uuid();
  v_transition jsonb;
begin
  select * into v_book
  from public.books
  where id = p_book_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'book_not_found');
  end if;
  if v_book.lifecycle_stage <> 'Under Review' then
    return jsonb_build_object(
      'ok', false, 'error', 'stage_conflict',
      'current_stage', v_book.lifecycle_stage
    );
  end if;
  if v_book.lifecycle_revision <> p_expected_revision then
    return jsonb_build_object(
      'ok', false, 'error', 'stale_revision',
      'current_revision', v_book.lifecycle_revision
    );
  end if;
  if p_version_id is null
     or v_book.review_version_id is distinct from p_version_id
  then
    return jsonb_build_object('ok', false, 'error', 'review_version_mismatch');
  end if;
  if p_decision not in ('reject', 'request_changes') then
    return jsonb_build_object('ok', false, 'error', 'invalid_decision');
  end if;
  if nullif(btrim(p_requested_by), '') is null
     or nullif(btrim(p_feedback), '') is null
  then
    return jsonb_build_object('ok', false, 'error', 'feedback_required');
  end if;
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
  then
    return jsonb_build_object('ok', false, 'error', 'items_required');
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_items) as elements(item)
    where coalesce((item->>'page_number')::integer, 0) <= 0
       or item->>'scope' not in ('text', 'illustration', 'both')
       or nullif(btrim(item->>'description'), '') is null
       or not exists (
         select 1
         from public.book_version_pages page
         where page.version_id = p_version_id
           and page.page_number = (item->>'page_number')::integer
       )
  ) then
    return jsonb_build_object('ok', false, 'error', 'invalid_revision_item');
  end if;

  begin
    insert into public.revision_requests (
      id, book_id, version_id, requested_by, decision, feedback, reason, status
    ) values (
      v_request_id, p_book_id, p_version_id, btrim(p_requested_by),
      p_decision, btrim(p_feedback), btrim(p_feedback), 'open'
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
    from jsonb_array_elements(p_items) as elements(item);

    v_transition := public.transition_book_lifecycle(
      p_book_id,
      'Under Review',
      'Changes Requested',
      p_version_id,
      p_expected_revision,
      btrim(p_requested_by),
      left(btrim(p_feedback), 2000),
      p_idempotency_key,
      jsonb_build_object(
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

    return jsonb_build_object(
      'ok', true,
      'request_id', v_request_id,
      'transition', v_transition
    );
  exception when sqlstate 'P0001' then
    return jsonb_build_object(
      'ok', false,
      'error', split_part(sqlerrm, ':', 2),
      'message', sqlerrm
    );
  end;
end;
$$;

revoke execute on function public.create_revision_request_and_transition(
  uuid, uuid, integer, text, text, text, jsonb, text
) from public, anon, authenticated;
grant execute on function public.create_revision_request_and_transition(
  uuid, uuid, integer, text, text, text, jsonb, text
) to service_role;
