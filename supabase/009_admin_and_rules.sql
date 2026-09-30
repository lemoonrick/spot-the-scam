-- ============================================================
--  Migration 009 — the rules for the two modes, and the admin
--
--  Paste into Supabase → SQL Editor → Run. Safe to re-run.
--
--  RUN THIS ONLY AFTER the updated submit-session function is live.
--  It makes every saved play say which mode it was in, and the old
--  function doesn't say. Run it first and every save would be refused.
--
--  If it stops with "Some saved plays predate the two modes", those
--  are test plays from before the change. Clear them with the TRUNCATE
--  in supabase/README.md and run this file again.
--
--  WHAT CHANGES
--    - Every play must be `normal` or `workshop`.
--    - A workshop play must have a room and a before/after score.
--      A normal play must not have before/after scores.
--    - An `admins` list, and `is_admin()` to check it.
--    - The admin can read every play and manage rooms. Nobody else can
--      read or change a single row. Players are unaffected: they only
--      ever talk to the function, which works as the server.
-- ============================================================


-- ── Refuse to guess about old plays ─────────────────────────
-- Plays saved before the two modes have no mode. They are test plays;
-- rather than silently relabel them, stop and say how to clear them.
do $$
begin
  if exists (select 1 from public.sessions where mode is null) then
    raise exception using
      message = 'Some saved plays predate the two modes and have no mode.',
      hint = 'These are test plays. Clear them with the TRUNCATE in '
          || 'supabase/README.md, then run this file again.';
  end if;
end;
$$;


-- ── The rules ───────────────────────────────────────────────
alter table public.sessions alter column mode set not null;

alter table public.sessions drop constraint if exists sessions_mode_check;
alter table public.sessions
  add constraint sessions_mode_check check (mode in ('normal', 'workshop'));

-- Workshop plays are measured, so they need both halves and a room.
-- Normal plays are not, so they must not carry numbers that look like a
-- measurement. A normal play *may* have a room, so a future "class does
-- the public quiz together" needs no change here.
alter table public.sessions drop constraint if exists sessions_mode_scores_check;
alter table public.sessions add constraint sessions_mode_scores_check check (
  (mode = 'workshop'
     and baseline_score is not null
     and trained_score  is not null
     and improvement    is not null
     and room_id        is not null)
  or
  (mode = 'normal'
     and baseline_score is null
     and trained_score  is null
     and improvement    is null)
);


-- ── Who is an admin ─────────────────────────────────────────
-- An account alone is not enough. Supabase lets you switch sign-ups off,
-- but this list is the real gate: an account that is not on it sees
-- nothing, even if one somehow exists.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;


-- ── What the admin may do ───────────────────────────────────
-- Rooms: read, create, edit, delete.
drop policy if exists "admin reads rooms"   on public.rooms;
drop policy if exists "admin creates rooms" on public.rooms;
drop policy if exists "admin edits rooms"   on public.rooms;
drop policy if exists "admin deletes rooms" on public.rooms;

create policy "admin reads rooms" on public.rooms
  for select to authenticated using ((select public.is_admin()));
create policy "admin creates rooms" on public.rooms
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin edits rooms" on public.rooms
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin deletes rooms" on public.rooms
  for delete to authenticated using ((select public.is_admin()));

-- Plays, answers and tickets: read only. Deleting a room removes its
-- plays through the room, not by editing plays directly.
drop policy if exists "admin reads plays"   on public.sessions;
drop policy if exists "admin reads answers" on public.session_answers;
drop policy if exists "admin reads tickets" on public.session_tickets;

create policy "admin reads plays" on public.sessions
  for select to authenticated using ((select public.is_admin()));
create policy "admin reads answers" on public.session_answers
  for select to authenticated using ((select public.is_admin()));
create policy "admin reads tickets" on public.session_tickets
  for select to authenticated using ((select public.is_admin()));


-- ── Column by column, not table by table ────────────────────
-- Supabase grants every table to `anon` and `authenticated` by default.
-- The policies above decide which rows; these decide which columns.
-- The admin can change a room's settings, but not its code or id, and
-- cannot change anybody's score through the API at all.
revoke all on public.rooms from anon, authenticated;
grant select, delete on public.rooms to authenticated;
grant insert (name, held_on, closes_at, max_participants, notes)
  on public.rooms to authenticated;
grant update (name, held_on, closes_at, max_participants, notes, status)
  on public.rooms to authenticated;

revoke all on public.sessions, public.session_answers,
              public.session_tickets, public.rate_limits
  from anon, authenticated;
grant select on public.sessions, public.session_answers, public.session_tickets
  to authenticated;

-- The public summary views from 003 and 005 are untouched. They read
-- these tables as their owner, not as the visitor, so /impact keeps
-- working. They are locked down at cutover, in 011.


-- ============================================================
--  MAKING YOURSELF THE ADMIN (once)
--
--  1. Supabase → Authentication → Users → Add user → Create new user.
--     Your company email, a strong password, "Auto Confirm User" on.
--  2. Run this, with that email:
--
--     insert into public.admins (user_id)
--     select id from auth.users where email = 'you@company.org'
--     on conflict do nothing;
--
--  It should say "INSERT 0 1". "INSERT 0 0" means the email didn't
--  match an account — check the spelling.
-- ============================================================
