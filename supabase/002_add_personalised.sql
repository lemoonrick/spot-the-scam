-- ============================================================
--  Migration 002 — add the `personalised` column
--
--  Run this if you created the sessions table before the name
--  screen existed. Safe to run more than once.
--
--  Records whether the player gave a name, so we can compare how
--  people do against scams that address them personally versus
--  generic ones. The name itself is never sent to the database.
-- ============================================================

alter table public.sessions
  add column if not exists personalised boolean not null default false;
