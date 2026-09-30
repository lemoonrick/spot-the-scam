-- ============================================================
--  Migration 008 — two quiz modes, and workshop rooms
--
--  Paste into Supabase → SQL Editor → Run. Safe to re-run.
--
--  ADDITIVE ONLY. Nothing here changes what the live site does. The
--  function that saves results keeps working exactly as before, because
--  every new column is either optional or has a default it fills in.
--  The rules that tie the columns together (a workshop play must have a
--  room, a normal play must not have before/after scores) come in 009,
--  once the updated function is writing them properly.
--
--  WHAT CHANGES
--    - rooms: one row per workshop, with a short join code
--    - sessions: which mode a play was in, which room, which version of
--      the questions, and whether it was someone playing again
--    - session_answers: the order each question was shown in
--    - session_tickets: which mode and room a quiz was started in, and
--      kept 30 days instead of 6 hours so "started vs finished" can be
--      counted per workshop
--    - closes a gap where anyone could run the two cleanup functions
-- ============================================================


-- ── Room codes ──────────────────────────────────────────────
-- Random bytes come from pgcrypto. Supabase installs it already; this
-- only makes sure.
create extension if not exists pgcrypto with schema extensions;

-- Six characters from an alphabet with no vowels and no look-alikes:
-- no A E I O U, so a code can never spell a word; no 0 O 1 I L, so it
-- can't be misread off a slide. 28 characters, six places: about 480
-- million codes.
create or replace function public.new_room_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'BCDFGHJKMNPQRSTVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(6);
  code text := '';
begin
  for i in 0..5 loop
    code := code || substr(alphabet, (get_byte(bytes, i) % 28) + 1, 1);
  end loop;
  return code;
end;
$$;

-- A column default runs as whoever is inserting, so the admin needs to
-- be able to call this. Nobody else does.
revoke execute on function public.new_room_code() from public, anon;
grant execute on function public.new_room_code() to authenticated;


-- ── Rooms ───────────────────────────────────────────────────
create table if not exists public.rooms (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique default public.new_room_code()
                     check (code ~ '^[BCDFGHJKMNPQRSTVWXYZ2-9]{6}$'),
  name             text not null check (char_length(name) between 1 and 80),
  held_on          date,
  -- The "temporary" in temporary link: no new players after this.
  closes_at        timestamptz not null default now() + interval '24 hours',
  max_participants int not null default 100
                     check (max_participants between 1 and 1000),
  status           text not null default 'open'
                     check (status in ('open', 'closed')),
  -- Private to the admin. The function never sends this to a player.
  notes            text check (char_length(notes) <= 2000),
  created_at       timestamptz not null default now()
);

-- On, with no policies yet: nobody but the server can touch it until
-- 009 lets the admin in.
alter table public.rooms enable row level security;


-- ── Sessions: which mode, which room ────────────────────────
-- `mode` is left optional for now so the current live function, which
-- doesn't send it, keeps saving. 009 makes it required.
alter table public.sessions add column if not exists mode text;

-- Deleting a room deletes its plays. That is what "delete room" is for:
-- clearing away a practice run.
alter table public.sessions
  add column if not exists room_id uuid references public.rooms(id) on delete cascade;

-- Which version of the ten questions was played. Rewording or swapping
-- a scam later bumps this, so old answers stay interpretable instead of
-- being mixed in with answers to a different question.
alter table public.sessions
  add column if not exists content_version int not null default 1;

-- "Play again myself" rather than a new person. A second go at the same
-- questions scores higher for knowing them, so workshop headlines count
-- first attempts only.
alter table public.sessions
  add column if not exists is_repeat boolean not null default false;

-- Normal-mode plays have no before and after.
alter table public.sessions alter column baseline_score drop not null;
alter table public.sessions alter column trained_score  drop not null;
alter table public.sessions alter column improvement    drop not null;

create index if not exists sessions_room_idx
  on public.sessions (room_id) where room_id is not null;
create index if not exists sessions_mode_created_idx
  on public.sessions (mode, created_at desc);


-- ── Answers: the order shown ────────────────────────────────
-- Position 1 to 10. Useful in both modes: "do people improve as they go"
-- no longer needs the halves to answer it.
alter table public.session_answers
  add column if not exists position smallint check (position between 1 and 10);

-- No halves in normal mode. The existing check, round in (1, 2), already
-- lets an empty value through.
alter table public.session_answers alter column round drop not null;

-- One answer per position, and per question, in a play.
create unique index if not exists session_answers_position_uniq
  on public.session_answers (session_id, position);
create unique index if not exists session_answers_scam_uniq
  on public.session_answers (session_id, scam_id);


-- ── Tickets: where a quiz was started ───────────────────────
-- Defaults describe the public quiz, which is what the live function
-- issues today, so it keeps working unchanged.
alter table public.session_tickets
  add column if not exists mode text not null default 'normal';
alter table public.session_tickets
  drop constraint if exists session_tickets_mode_check;
alter table public.session_tickets
  add constraint session_tickets_mode_check check (mode in ('normal', 'workshop'));
alter table public.session_tickets
  add column if not exists room_id uuid references public.rooms(id) on delete cascade;

create index if not exists session_tickets_room_idx
  on public.session_tickets (room_id) where room_id is not null;

-- Keep tickets 30 days, so a workshop's "14 started, 11 finished" can be
-- counted. They still expire for use after 6 hours: that limit lives in
-- the function and is unchanged.
create or replace function public.prune_session_tickets()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.session_tickets
  where created_at < now() - interval '30 days';
$$;


-- ── Close the cleanup functions to the public ───────────────
-- 006 and 007 revoked these from `anon` and `authenticated`, but
-- Postgres also grants every new function to PUBLIC, which everyone
-- belongs to. So anyone with the public key could still run them.
-- Harmless as it happens — they only delete rows that were due to go —
-- but not a pattern to leave lying around.
revoke execute on function public.prune_rate_limits()     from public, anon, authenticated;
revoke execute on function public.prune_session_tickets() from public, anon, authenticated;
