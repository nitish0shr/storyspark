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
