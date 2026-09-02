-- ============================================================
--  Migration 003 — public aggregate views for /impact
--
--  Paste into Supabase → SQL Editor → Run. Safe to re-run.
--
--  The `sessions` table stays locked: the public still cannot read a
--  single row of it. These views expose only counts and averages, so
--  the dashboard can show real numbers while individual runs remain
--  private.
--
--  Each view is explicitly SECURITY DEFINER (security_invoker = off).
--  That is deliberate and is the whole mechanism: the view runs as its
--  owner, so it can summarise a table the caller cannot read. Supabase's
--  linter flags this pattern; here it is the point, not an oversight.
--  Never add a view that returns per-session rows.
-- ============================================================

-- ── Headline numbers ─────────────────────────────────────────
create or replace view public.impact_summary as
select
  count(*)                                        as sessions,
  coalesce(sum(total), 0)                         as scams_reviewed,
  round(avg(score))                               as avg_score,
  round(avg(baseline_score))                      as avg_baseline,
  round(avg(trained_score))                       as avg_trained,
  round(avg(improvement))                         as avg_improvement,
  count(*) filter (where improvement > 0)         as improved_count,
  round(
    100.0 * count(*) filter (where improvement > 0)
    / nullif(count(*), 0)
  )                                               as improved_pct,
  coalesce(sum(scams_waved_through), 0)           as scams_waved_through,
  round(avg(median_response_ms_baseline))         as avg_first_decision_ms,
  round(avg(median_response_ms_trained))          as avg_later_decision_ms,
  count(*) filter (where device = 'mobile')       as mobile_sessions,
  count(*) filter (where personalised)            as personalised_sessions,
  min(created_at)                                 as first_session_at,
  max(created_at)                                 as last_session_at
from public.sessions;

-- ── Which channels defeat people ─────────────────────────────
-- type_breakdown is a JSON array of { type, seen, correct, accuracy }
-- per session, so it has to be unnested before it can be summed.
create or replace view public.impact_by_type as
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

-- ── Does using someone's name make them easier to fool? ──────
create or replace view public.impact_personalisation as
select
  personalised,
  count(*)                                        as sessions,
  round(avg(score))                               as avg_score,
  round(avg(improvement))                         as avg_improvement,
  round(avg(scams_waved_through)::numeric, 2)     as avg_scams_waved_through
from public.sessions
group by personalised;

-- ── Reach over time ──────────────────────────────────────────
create or replace view public.impact_daily as
select
  created_at::date                                as day,
  count(*)                                        as sessions,
  round(avg(score))                               as avg_score,
  round(avg(improvement))                         as avg_improvement
from public.sessions
group by 1
order by 1;

-- ── Score spread, so the average is not the only story ───────
create or replace view public.impact_score_bands as
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

-- ── Expose the summaries, and only the summaries ─────────────
alter view public.impact_summary        set (security_invoker = off);
alter view public.impact_by_type        set (security_invoker = off);
alter view public.impact_personalisation set (security_invoker = off);
alter view public.impact_daily          set (security_invoker = off);
alter view public.impact_score_bands    set (security_invoker = off);

grant select on public.impact_summary         to anon, authenticated;
grant select on public.impact_by_type         to anon, authenticated;
grant select on public.impact_personalisation to anon, authenticated;
grant select on public.impact_daily           to anon, authenticated;
grant select on public.impact_score_bands     to anon, authenticated;
