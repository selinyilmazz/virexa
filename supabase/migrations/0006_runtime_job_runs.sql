-- Virexa runtime job run history
-- Table: runtime_job_runs
-- Run against a Supabase Postgres project (SQL Editor or `supabase db push`).
--
-- ============================================================================
-- runtime_job_runs
-- Append-only record of every finished Runtime job (completed/failed/
-- cancelled), written by `RuntimeQueue` the moment a job settles
-- (`runtime/queue/runtime-queue.ts`). Fixes the Admin Dashboard's
-- Runtime Status card always showing "No runs recorded yet" even right
-- after a successful pipeline run: `RuntimeQueue`'s job history used to
-- live only in an in-memory `Map`, which is empty again on every fresh
-- Node process (a dev-server restart, or - much more relevant in
-- production - every separate serverless/edge invocation never shares
-- memory with any other). This table gives that history a real,
-- cross-process home, the same way `admin_audit_log` (0003) already
-- does for admin actions.
--
-- No RLS policies are created (RLS is enabled, so the default
-- "deny all" applies to anon/authenticated) - every read and write goes
-- through the service-role client from server-only code
-- (`RuntimeQueue`'s write side, `RuntimeStatusSection`'s read side via
-- a new repository), mirroring `admin_audit_log`'s exact convention.
-- Job run history is an operational/admin concern, not public data.
--
-- Production safety:
--   - Wrapped in an explicit transaction: either every statement below
--     applies, or (on any error) none of it does.
--   - Every statement is idempotent (`create extension if not exists`,
--     `create table if not exists`, `create index if not exists`) -
--     safe to paste and run again.
--   - Purely additive: creates one new table and two indexes, alters
--     nothing that already exists, drops/deletes nothing.
--   - `enable row level security` with zero policies is a strictly
--     more restrictive default than not having the table at all from
--     anon/authenticated's point of view - it cannot expose data that
--     wasn't already exposed.
-- ============================================================================

begin;

-- Defensive: gen_random_uuid() depends on pgcrypto, already enabled by
-- 0001_production_schema.sql on any project that ran the migrations in
-- order - this guard just makes 0006 safe to run standalone too.
create extension if not exists "pgcrypto";

create table if not exists public.runtime_job_runs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null check (status in ('completed', 'failed', 'cancelled')),
  started_at timestamptz,
  finished_at timestamptz not null,
  duration_ms integer,
  attempts integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists runtime_job_runs_finished_at_idx
  on public.runtime_job_runs (finished_at desc);

create index if not exists runtime_job_runs_job_type_finished_at_idx
  on public.runtime_job_runs (job_type, finished_at desc);

comment on table public.runtime_job_runs is
  'Append-only history of finished Runtime jobs (completed/failed/cancelled) - written by RuntimeQueue on every job settlement. Service-role access only - no RLS policies. Backs the Admin Dashboard Runtime Status card (Last Run/Last Success/Last Error) across process restarts, unlike the in-memory queue alone.';

alter table public.runtime_job_runs enable row level security;

commit;

-- ============================================================================
-- Optional, read-only verification (run separately, after the commit
-- above). Expected result right after applying this migration: the
-- table exists and has 0 rows (nothing has run through the new
-- RuntimeQueue hook yet). After triggering one pipeline run, re-run
-- this and expect 1+ rows.
-- ============================================================================
-- select count(*) as runtime_job_runs_row_count from public.runtime_job_runs;
