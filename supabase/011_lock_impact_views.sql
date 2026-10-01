-- ============================================================
--  Migration 011 — the detailed figures become admin-only
--
--  Paste into Supabase → SQL Editor → Run. Safe to re-run.
--
--  RUN THIS AFTER the new site is uploaded, not before. The site that
--  is live until then reads these views with the public key to draw
--  /impact. The new site doesn't: its /impact reads public_summary, and
--  the full dashboard has moved behind the admin login. Upload first and
--  nothing breaks in between; run this first and the old /impact shows
--  an error until the upload finishes.
--
--  WHAT CHANGES
--    Every impact_* view keeps its name and its columns, so the admin's
--    Overall tab reads them unchanged. Two things are different:
--
--    1. They are admin-only. They used to run as their owner, which let
--       anyone with the public key read them; they now run as whoever is
--       asking, so the rules from 009 apply. The public key is refused
--       outright, and a logged-in account that isn't an admin gets
--       nothing back.
--
--    2. Before-and-after figures count workshop plays only, first
--       attempts only. A public play has no halves, and a second attempt
--       scores higher for knowing the questions; counting either would
--       quietly water down or inflate "how much people improved".
--       Everything else — totals, scores, which messages fool people —
--       still counts every play.
-- ============================================================


-- ── Headline figures ────────────────────────────────────────
create or replace view public.impact_summary
with (security_invoker = on) as
select
  count(*)                                        as sessions,
  coalesce(sum(total), 0)                         as scams_reviewed,
  round(avg(score))                               as avg_score,
  -- Measured plays: workshops, first attempts.
  round(avg(baseline_score)  filter (where mode = 'workshop' and not is_repeat))
                                                  as avg_baseline,
  round(avg(trained_score)   filter (where mode = 'workshop' and not is_repeat))
                                                  as avg_trained,
  round(avg(improvement)     filter (where mode = 'workshop' and not is_repeat))
                                                  as avg_improvement,
  count(*) filter (where mode = 'workshop' and not is_repeat and improvement > 0)
                                                  as improved_count,
  round(
    100.0 * count(*) filter (where mode = 'workshop' and not is_repeat and improvement > 0)
    / nullif(count(*) filter (where mode = 'workshop' and not is_repeat), 0)
  )                                               as improved_pct,
  coalesce(sum(scams_waved_through), 0)           as scams_waved_through,
  round(avg(median_response_ms_baseline) filter (where mode = 'workshop' and not is_repeat))
                                                  as avg_first_decision_ms,
  round(avg(median_response_ms_trained)  filter (where mode = 'workshop' and not is_repeat))
                                                  as avg_later_decision_ms,
  count(*) filter (where device = 'mobile')       as mobile_sessions,
  count(*) filter (where personalised)            as personalised_sessions,
  min(created_at)                                 as first_session_at,
  max(created_at)                                 as last_session_at
from public.sessions;


-- ── Which kinds of message are hardest ──────────────────────
create or replace view public.impact_by_type
with (security_invoker = on) as
select
  e->>'type'                                      as scam_type,
  sum((e->>'seen')::int)                          as times_shown,
  sum((e->>'correct')::int)                       as times_correct,
  round(
    100.0 * sum((e->>'correct')::int)
    / nullif(sum((e->>'seen')::int), 0)
  )                                               as accuracy_pct
from public.sessions s
cross join lateral jsonb_array_elements(s.type_breakdown) e
where s.type_breakdown is not null
  and jsonb_typeof(s.type_breakdown) = 'array'
group by 1
order by accuracy_pct asc nulls last;


-- ── Does using the player's name make a scam work better? ───
create or replace view public.impact_personalisation
with (security_invoker = on) as
select
  personalised,
  count(*)                                        as sessions,
  round(avg(score))                               as avg_score,
  round(avg(improvement) filter (where mode = 'workshop' and not is_repeat))
                                                  as avg_improvement,
  round(avg(scams_waved_through)::numeric, 2)     as avg_scams_waved_through
from public.sessions
group by personalised;


-- ── Plays over time ─────────────────────────────────────────
create or replace view public.impact_daily
with (security_invoker = on) as
select
  created_at::date                                as day,
  count(*)                                        as sessions,
  round(avg(score))                               as avg_score,
  round(avg(improvement) filter (where mode = 'workshop' and not is_repeat))
                                                  as avg_improvement
from public.sessions
group by 1
order by 1;


-- ── How scores are spread ───────────────────────────────────
create or replace view public.impact_score_bands
with (security_invoker = on) as
select
  band,
  count(*) as sessions
from (
  select
    case
      when score < 40 then '0-39'
      when score < 60 then '40-59'
      when score < 80 then '60-79'
      else '80-100'
    end as band
  from public.sessions
) t
group by band
order by band;


-- ── Which of the ten messages catches people out ────────────
create or replace view public.impact_by_scam
with (security_invoker = on) as
select
  scam_id,
  scam_type,
  count(*)                                          as times_shown,
  count(*) filter (where not correct)               as times_wrong,
  round(
    100.0 * count(*) filter (where not correct)
    / nullif(count(*), 0)
  )                                                 as wrong_pct
from public.session_answers
group by scam_id, scam_type;


-- ── The two kinds of mistake ────────────────────────────────
create or replace view public.impact_error_types
with (security_invoker = on) as
select
  count(*) filter (where not correct and actual = 'phishing')   as trusted_a_scam,
  count(*) filter (where not correct and actual = 'legitimate') as suspected_something_real,
  count(*) filter (where correct)                               as judged_correctly,
  count(*)                                                      as total_answers
from public.session_answers;


-- ── How long people take ────────────────────────────────────
-- The halves only exist in workshops; public plays have no round and
-- drop out of the first two figures on their own.
create or replace view public.impact_timing
with (security_invoker = on) as
select
  round(avg(response_ms) filter (where round = 1))   as avg_first_half_ms,
  round(avg(response_ms) filter (where round = 2))   as avg_second_half_ms,
  round(avg(response_ms) filter (where correct))     as avg_when_right_ms,
  round(avg(response_ms) filter (where not correct)) as avg_when_wrong_ms
from public.session_answers;


-- ── Admin only ──────────────────────────────────────────────
revoke all on public.impact_summary, public.impact_by_type,
              public.impact_personalisation, public.impact_daily,
              public.impact_score_bands, public.impact_by_scam,
              public.impact_error_types, public.impact_timing
  from anon;

grant select on public.impact_summary, public.impact_by_type,
                public.impact_personalisation, public.impact_daily,
                public.impact_score_bands, public.impact_by_scam,
                public.impact_error_types, public.impact_timing
  to authenticated;
