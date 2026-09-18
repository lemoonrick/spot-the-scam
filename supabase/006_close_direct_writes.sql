-- ============================================================
--  Migration 006 — stop browsers writing to the database
--
--  RUN THIS LAST. Deploy the submit-session Edge Function and set its
--  secrets FIRST, or saving breaks the moment you run this.
--
--  Until now the public key could insert rows. It could never read or
--  delete, but nothing limited how often it could insert, and PostgREST
--  accepts arrays, so a single request could carry thousands of rows.
--  A script could have filled /impact with invented results.
--
--  Writes now go through the submit-session function, which checks a
--  bot token, rate-limits, and works out the scores itself.
-- ============================================================

-- ── Counting requests without keeping addresses ──────────────
-- Holds a salted one-way hash of the caller's IP, never the address.
-- The salt lives only in the function's environment, so these cannot be
-- turned back into anything, and rows are deleted after an hour. It is
-- never joined to a session: there is no way to link a result to a
-- fingerprint.
create table if not exists public.rate_limits (
  id          bigserial primary key,
  fingerprint text not null,
  created_at  timestamptz not null default now()
);

create index if not exists rate_limits_lookup_idx
  on public.rate_limits (fingerprint, created_at desc);

alter table public.rate_limits enable row level security;
-- No policy at all: only the service role reaches this, which bypasses
-- RLS. The public cannot read it, write it, or know it exists.

-- ── Revoke the public write access ───────────────────────────
drop policy if exists "anyone may submit a result" on public.sessions;
drop policy if exists "anyone may submit an answer" on public.session_answers;

-- Both tables now have RLS on and no policies for anon at all, so the
-- public key can do nothing whatsoever with them. The Edge Function uses
-- the service role, which bypasses RLS by design.

-- The aggregate views are unaffected: they are SECURITY DEFINER, so
-- /impact keeps working and still exposes only totals.

-- ── Housekeeping ─────────────────────────────────────────────
-- Call occasionally, or from a scheduled job, to drop expired counters.
create or replace function public.prune_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits where created_at < now() - interval '2 hours';
$$;

revoke all on function public.prune_rate_limits() from anon, authenticated;
