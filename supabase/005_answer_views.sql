-- ============================================================
--  Migration 005 — aggregate views over session_answers
--
--  Paste into Supabase → SQL Editor → Run. Safe to re-run.
--  Run 004 first.
--
--  Aggregates only, exactly like 003. The answers table itself stays
--  unreadable to the public; these views publish counts.
-- ============================================================

-- ── Which of the ten scenarios actually catches people out ───
create or replace view public.impact_by_scam as
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

-- ── The two kinds of mistake, which mean very different things ──
--  Trusting a scam is the dangerous error.
--  Suspecting something genuine is over-caution, which has its own
--  cost: people who ignore real messages from their bank.
create or replace view public.impact_error_types as
select
  count(*) filter (where not correct and actual = 'phishing')   as trusted_a_scam,
  count(*) filter (where not correct and actual = 'legitimate') as suspected_something_real,
  count(*) filter (where correct)                               as judged_correctly,
  count(*)                                                      as total_answers
from public.session_answers;

-- ── How long each scenario makes people think ────────────────
create or replace view public.impact_timing as
select
  round(avg(response_ms) filter (where round = 1))   as avg_first_half_ms,
  round(avg(response_ms) filter (where round = 2))   as avg_second_half_ms,
  round(avg(response_ms) filter (where correct))     as avg_when_right_ms,
  round(avg(response_ms) filter (where not correct)) as avg_when_wrong_ms
from public.session_answers;

alter view public.impact_by_scam     set (security_invoker = off);
alter view public.impact_error_types set (security_invoker = off);
alter view public.impact_timing      set (security_invoker = off);

grant select on public.impact_by_scam     to anon, authenticated;
grant select on public.impact_error_types to anon, authenticated;
grant select on public.impact_timing      to anon, authenticated;
