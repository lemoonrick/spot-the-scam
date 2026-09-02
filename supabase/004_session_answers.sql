-- ============================================================
--  Migration 004 — one row per question answered
--
--  Paste into Supabase → SQL Editor → Run. Safe to re-run.
--
--  The quiz has always known which specific message a person got
--  wrong and how long they took over it. Until now that detail was
--  averaged away into a per-channel summary before saving. This table
--  keeps it, which is what makes "the Netflix email fools two thirds
--  of people" answerable instead of just "email is hard".
--
--  Still anonymous: a row says what was answered, never who answered
--  it. It carries no name, no email, no device id.
-- ============================================================

create table if not exists public.session_answers (
  id          bigserial primary key,
  session_id  uuid not null
                references public.sessions(id) on delete cascade,
  created_at  timestamptz not null default now(),

  -- The scenario, by id. Labels live in scams.js so that rewording a
  -- scam never requires a database migration.
  scam_id     int not null check (scam_id > 0),
  scam_type   text not null,

  round       smallint not null check (round in (1, 2)),

  chosen      text not null check (chosen in ('phishing', 'legitimate')),
  actual      text not null check (actual in ('phishing', 'legitimate')),
  correct     boolean not null,

  response_ms int check (response_ms >= 0)
);

-- Every dashboard query groups by one of these two.
create index if not exists session_answers_scam_idx
  on public.session_answers (scam_id);
create index if not exists session_answers_session_idx
  on public.session_answers (session_id);

-- ============================================================
--  ROW LEVEL SECURITY — same rule as `sessions`.
--  The public may add an answer and nothing else: no reading,
--  no editing, no deleting.
-- ============================================================
alter table public.session_answers enable row level security;

drop policy if exists "anyone may submit an answer" on public.session_answers;
create policy "anyone may submit an answer"
  on public.session_answers
  for insert
  to anon
  with check (
    -- `correct` has to agree with the two verdicts, so a bad actor
    -- cannot quietly skew the public failure rates.
    correct = (chosen = actual)
  );

-- Deliberately NO select / update / delete policy for `anon`.
