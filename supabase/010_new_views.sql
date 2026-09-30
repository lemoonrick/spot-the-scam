-- ============================================================
--  Migration 010 — the new summary views
--
--  Paste into Supabase → SQL Editor → Run. Safe to re-run.
--  Run after 009.
--
--  All new names. The existing impact_* views that the live /impact
--  page reads are left alone until cutover (011), so this changes
--  nothing on the live site.
--
--  TWO KINDS
--    Public — anyone can read. Counts and averages only, never a row
--    that belongs to a play, never a room's name or notes.
--      public_summary   the headline figures for /impact
--      question_stats   how often each question is got wrong, for the
--                       "70% of players trusted this too" lines
--
--    Admin — only an account on the admins list sees any rows. They
--    run as the person asking (security_invoker), so the rules from 009
--    apply: the public key is refused outright, and a logged-in account
--    that is not an admin gets nothing back.
--      admin_rooms          one row per room, with its figures
--      admin_room_by_scam   per question, per room, before and after
--      admin_room_answers   every answer in every room, for the
--                           spreadsheet download
-- ============================================================


-- ── Public: the headline figures ────────────────────────────
drop view if exists public.public_summary;
create view public.public_summary
with (security_invoker = off) as
select
  count(*)::int                                          as plays,
  coalesce(sum(total), 0)::int                           as answers,
  round(avg(score))::int                                 as avg_score,
  (count(distinct room_id) filter (where mode = 'workshop'))::int
                                                         as workshops_held,
  -- First attempts only: a second go at the same questions isn't a new
  -- person, and scores higher for knowing the answers.
  (count(*) filter (where mode = 'workshop' and not is_repeat))::int
                                                         as workshop_participants,
  round(avg(improvement) filter (where mode = 'workshop' and not is_repeat), 1)
                                                         as avg_workshop_improvement,
  round(
    100.0 * count(*) filter (where mode = 'workshop' and not is_repeat and improvement > 0)
    / nullif(count(*) filter (where mode = 'workshop' and not is_repeat), 0)
  )::int                                                 as workshop_improved_pct,
  min(created_at)                                        as first_play_at,
  max(created_at)                                        as last_play_at
from public.sessions;

grant select on public.public_summary to anon, authenticated;


-- ── Public: how each question fares ─────────────────────────
-- Withheld until a question has 50 answers. Below that, "100% of players
-- fell for this" can mean one person. Rounded to the nearest 5, because
-- at 50 answers the true figure is only known to about ±14 points, and
-- a precise-looking "63%" would claim more than the data can.
--
-- First attempts only, and only the current version of the questions.
-- Both modes count: a question lands at a random position in either, so
-- the two groups of players have seen it under the same conditions.
drop view if exists public.question_stats;
create view public.question_stats
with (security_invoker = off) as
select
  a.scam_id,
  count(*)::int as answered,
  (round(100.0 * count(*) filter (where not a.correct) / count(*) / 5) * 5)::int
    as wrong_pct
from public.session_answers a
join public.sessions s on s.id = a.session_id
where not s.is_repeat
  and s.content_version = (select max(content_version) from public.sessions)
group by a.scam_id
having count(*) >= 50;

grant select on public.question_stats to anon, authenticated;


-- ── Admin: one row per room ─────────────────────────────────
drop view if exists public.admin_rooms;
create view public.admin_rooms
with (security_invoker = on) as
select
  r.id,
  r.code,
  r.name,
  r.held_on,
  r.closes_at,
  r.max_participants,
  r.status,
  r.notes,
  r.created_at,
  (r.status = 'open' and now() < r.closes_at)  as open_now,
  -- Every start takes a ticket, including refreshes and restarts, so
  -- this counts starts rather than people.
  coalesce(t.started, 0)                        as started,
  coalesce(s.finished, 0)                       as finished,
  coalesce(s.first_runs, 0)                     as first_runs,
  s.avg_before,
  s.avg_after,
  s.avg_improvement,
  s.improved_pct,
  greatest(t.last_start, s.last_finish)         as last_activity
from public.rooms r
left join (
  select room_id, count(*)::int as started, max(created_at) as last_start
  from public.session_tickets
  where room_id is not null
  group by room_id
) t on t.room_id = r.id
left join (
  select
    room_id,
    count(*)::int                                                  as finished,
    (count(*) filter (where not is_repeat))::int                   as first_runs,
    round(avg(baseline_score) filter (where not is_repeat))::int   as avg_before,
    round(avg(trained_score)  filter (where not is_repeat))::int   as avg_after,
    round(avg(improvement)    filter (where not is_repeat), 1)     as avg_improvement,
    round(
      100.0 * count(*) filter (where not is_repeat and improvement > 0)
      / nullif(count(*) filter (where not is_repeat), 0)
    )::int                                                         as improved_pct,
    max(created_at)                                                as last_finish
  from public.sessions
  where room_id is not null
  group by room_id
) s on s.room_id = r.id;

revoke all on public.admin_rooms from anon;
grant select on public.admin_rooms to authenticated;


-- ── Admin: each question, in each room, before and after ────
drop view if exists public.admin_room_by_scam;
create view public.admin_room_by_scam
with (security_invoker = on) as
select
  s.room_id,
  a.scam_id,
  a.scam_type,
  count(*)::int                                          as shown,
  (count(*) filter (where not a.correct))::int           as wrong,
  round(100.0 * count(*) filter (where not a.correct) / count(*))::int
                                                         as wrong_pct,
  round(
    100.0 * count(*) filter (where not a.correct and a.round = 1)
    / nullif(count(*) filter (where a.round = 1), 0)
  )::int                                                 as wrong_pct_before,
  round(
    100.0 * count(*) filter (where not a.correct and a.round = 2)
    / nullif(count(*) filter (where a.round = 2), 0)
  )::int                                                 as wrong_pct_after
from public.session_answers a
join public.sessions s on s.id = a.session_id
where s.room_id is not null
  and not s.is_repeat
group by s.room_id, a.scam_id, a.scam_type;

revoke all on public.admin_room_by_scam from anon;
grant select on public.admin_room_by_scam to authenticated;


-- ── Admin: every answer, for the spreadsheet ────────────────
drop view if exists public.admin_room_answers;
create view public.admin_room_answers
with (security_invoker = on) as
select
  r.code          as room_code,
  s.room_id,
  s.id            as play_id,
  s.created_at    as played_at,
  s.is_repeat,
  s.score,
  s.baseline_score,
  s.trained_score,
  s.improvement,
  s.device,
  s.personalised,
  a.position,
  a.round,
  a.scam_id,
  a.scam_type,
  a.chosen,
  a.actual,
  a.correct,
  a.response_ms
from public.session_answers a
join public.sessions s on s.id = a.session_id
join public.rooms    r on r.id = s.room_id;

revoke all on public.admin_room_answers from anon;
grant select on public.admin_room_answers to authenticated;
