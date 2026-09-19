-- ============================================================
--  Migration 007 — one-time tickets, replacing the bot check
--
--  Paste into Supabase → SQL Editor → Run. Safe to re-run.
--  Run this BEFORE 006.
--
--  We cannot use a third-party bot check, so abuse is held off with
--  things the app and the database can do between themselves.
--
--  The idea: you cannot hand in a result unless you were given a ticket
--  when you started, and a ticket works exactly once. To flood the
--  table you would have to collect a fresh ticket for every fake
--  result, wait out the minimum time on each, and do it from enough
--  different addresses to stay under the rate limit. That turns a
--  one-line script into real effort for no reward.
-- ============================================================

create table if not exists public.session_tickets (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  used_at    timestamptz
);

-- Consuming a ticket looks it up by id and checks it is unused.
create index if not exists session_tickets_unused_idx
  on public.session_tickets (id) where used_at is null;

-- Sweeping expired tickets scans by age.
create index if not exists session_tickets_age_idx
  on public.session_tickets (created_at);

alter table public.session_tickets enable row level security;
-- No policy at all. Only the Edge Function reaches this, using the
-- service role, which bypasses RLS. The public cannot see a ticket,
-- mint one, or mark one used.

-- ── Housekeeping ─────────────────────────────────────────────
-- Tickets are useless once expired. Clear them out so the table does
-- not grow forever on a free plan.
create or replace function public.prune_session_tickets()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.session_tickets
  where created_at < now() - interval '6 hours';
$$;

revoke all on function public.prune_session_tickets() from anon, authenticated;
