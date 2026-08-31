-- ============================================================
--  Spot the Scam — database schema
--  Paste this whole file into Supabase → SQL Editor → Run.
--  Safe to run more than once.
-- ============================================================

-- One row per completed quiz. Anonymous: nothing here identifies a person.
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  schema_version int not null default 1,

  -- Overall result
  score   int not null check (score   between 0 and 100),
  correct int not null check (correct >= 0),
  total   int not null check (total   >  0),

  -- The before/after comparison — the numbers that show learning
  baseline_score int not null check (baseline_score between 0 and 100),
  trained_score  int not null check (trained_score  between 0 and 100),
  improvement    int not null check (improvement between -100 and 100),

  -- How long people took to decide
  median_response_ms_baseline int check (median_response_ms_baseline >= 0),
  median_response_ms_trained  int check (median_response_ms_trained  >= 0),
  total_time_ms               int check (total_time_ms >= 0),

  -- Where people go wrong
  scams_waved_through int not null default 0 check (scams_waved_through >= 0),
  weakest_type   text,
  type_breakdown jsonb,

  -- Did the player give a name, so the scams addressed them personally?
  -- The name itself is never sent to the database. Only this flag.
  personalised boolean not null default false,

  -- Reach, not identity
  device   text check (device in ('mobile', 'desktop')),
  language text
);

-- Dashboard queries will filter and sort by date constantly.
create index if not exists sessions_created_at_idx
  on public.sessions (created_at desc);

-- ============================================================
--  ROW LEVEL SECURITY
--
--  The anon key is public — anyone can read it out of your JS bundle.
--  RLS is what makes that safe: it decides what that key is allowed to
--  DO. Without it, a stranger could read or delete your whole table.
--
--  Our rule: the public may add a result, and nothing else.
--  No reading, no updating, no deleting.
-- ============================================================
alter table public.sessions enable row level security;

drop policy if exists "anyone may submit a result" on public.sessions;
create policy "anyone may submit a result"
  on public.sessions
  for insert
  to anon
  with check (
    -- Basic sanity so a bad actor can't stuff the table with nonsense
    -- that would skew the public numbers.
    total between 1 and 100
    and correct <= total
  );

-- Deliberately NO select / update / delete policy for `anon`.
-- Postgres denies anything not explicitly allowed, so raw rows stay
-- private. You can still read everything from the Supabase dashboard,
-- which connects as the owner and bypasses RLS.

-- ------------------------------------------------------------
--  Additions after the first release.
--  `create table if not exists` above does nothing to an existing
--  table, so new columns are added explicitly and idempotently.
-- ------------------------------------------------------------
alter table public.sessions
  add column if not exists personalised boolean not null default false;
