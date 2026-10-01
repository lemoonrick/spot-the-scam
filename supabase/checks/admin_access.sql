-- ============================================================
--  Check: who can see what
--
--  Paste into Supabase → SQL Editor → Run. Changes nothing: it runs
--  inside a transaction that is rolled back at the end.
--
--  It pretends to be two logged-in people in turn — the admin, and a
--  stranger who has an account but is not on the admins list — and
--  counts what each one can see. You should get:
--
--    as_admin      is_admin=true   and real numbers
--    as_stranger   is_admin=false  and every count 0
--
--  If as_admin says is_admin=false, nobody is on the admins list yet:
--  run the insert at the end of 009.
--
--  Run it after 009 and 010, once you are on the admins list. Worth
--  running again after any change to the security rules.
-- ============================================================

begin;

-- ── As the admin ────────────────────────────────────────────
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select user_id::text from public.admins limit 1),
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;
select set_config('check.admin', format(
  'is_admin=%s  rooms=%s  plays=%s  answers=%s  tickets=%s',
  public.is_admin(),
  (select count(*) from public.admin_rooms),
  (select count(*) from public.sessions),
  (select count(*) from public.session_answers),
  (select count(*) from public.session_tickets)
), true);
reset role;

-- ── As a stranger with an account ───────────────────────────
select set_config(
  'request.jwt.claims',
  json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated')::text,
  true
);
set local role authenticated;
select set_config('check.stranger', format(
  'is_admin=%s  rooms=%s  plays=%s  answers=%s  tickets=%s',
  public.is_admin(),
  (select count(*) from public.admin_rooms),
  (select count(*) from public.sessions),
  (select count(*) from public.session_answers),
  (select count(*) from public.session_tickets)
), true);
reset role;

select
  current_setting('check.admin', true)    as as_admin,
  current_setting('check.stranger', true) as as_stranger;

rollback;
