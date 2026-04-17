-- Migration 004: Cost Tracking
-- Purpose: track per-book and per-order AI generation cost so we can monitor gross margin
-- and catch cost blowouts early (top risk identified in the Phase 7 audit).
--
-- Source of costs:
--   - openai_cost_cents: sum of OpenAI API usage cost for story + metadata calls
--   - replicate_cost_cents: sum of Replicate runs for preview + full illustrations + cover
--   - cost_cents on orders: denormalized total, written when the book reaches 'complete'

-- =============================================================================
-- books: per-book cost breakdown
-- =============================================================================
alter table public.books
  add column if not exists openai_cost_cents int not null default 0,
  add column if not exists replicate_cost_cents int not null default 0,
  add column if not exists preview_generation_ms int,
  add column if not exists full_generation_ms int;

-- =============================================================================
-- orders: denormalized total cost for quick margin queries
-- =============================================================================
alter table public.orders
  add column if not exists cost_cents int not null default 0;

create index if not exists idx_orders_status_created
  on public.orders(status, created_at desc);

-- =============================================================================
-- Helper view: daily gross margin by tier
-- =============================================================================
create or replace view public.v_daily_margin as
select
  date_trunc('day', created_at)::date as day,
  tier,
  count(*) as paid_orders,
  sum(amount_cents) as revenue_cents,
  sum(cost_cents) as cost_cents,
  sum(amount_cents) - sum(cost_cents) as gross_margin_cents,
  case
    when sum(amount_cents) = 0 then 0
    else round(100.0 * (sum(amount_cents) - sum(cost_cents))::numeric / sum(amount_cents), 1)
  end as gross_margin_pct
from public.orders
where status in ('paid', 'fulfilled')
group by 1, 2
order by 1 desc, 2;

-- Only admins (service role) should read the view directly; RLS on orders blocks users.
-- If you want to expose it in-app, query from server-side with the service role client.
