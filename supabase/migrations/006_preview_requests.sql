-- 006_preview_requests.sql
-- Email-gated free preview flow (Starmee pivot)

-- Preview requests: captures lead before any account creation
create table if not exists preview_requests (
  id                uuid        primary key default gen_random_uuid(),
  email             text        not null,
  child_name        text,
  child_age         int,
  theme_id          text,
  photo_url         text,
  preferences       jsonb,
  ip_address        text,
  status            text        not null default 'pending',
  preview_image_url text,
  email_sent_at     timestamptz,
  converted_book_id uuid,
  created_at        timestamptz default now(),
  constraint preview_requests_status_check
    check (status in ('pending', 'generating', 'ready', 'failed'))
);

create index if not exists preview_requests_email_idx   on preview_requests (email);
create index if not exists preview_requests_status_idx  on preview_requests (status);
create index if not exists preview_requests_created_idx on preview_requests (created_at);

-- Add single-image preview columns to books table
alter table books add column if not exists preview_image_url      text;
alter table books add column if not exists preview_email_sent_at  timestamptz;
