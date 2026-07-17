-- Virexa admin audit log
-- Table: admin_audit_log
-- Run against a Supabase Postgres project (SQL Editor or `supabase db push`).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE
-- where Postgres supports it.

-- ============================================================================
-- admin_audit_log
-- Append-only record of admin-initiated write actions (role changes, source
-- updates, trust score changes, manual pipeline runs, bulk operations, ...).
-- No RLS policies are created for this table (RLS is enabled, so the default
-- "deny all" applies to anon/authenticated) - every read and write goes
-- through the service-role client from server-only admin code
-- (`src/services/admin/admin-audit-service.ts`), the same way
-- `article_sources`/`articles` writes already work. This keeps the log
-- itself un-tamperable from the client, matching requirement 8 ("Service
-- Role istemciye sızmasın" - the key stays server-side; this table simply
-- has no client-reachable path at all, by design).
-- ============================================================================

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text not null default '',
  action text not null,
  target_type text not null default '',
  target_id text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

create index if not exists admin_audit_log_action_idx
  on public.admin_audit_log (action);

comment on table public.admin_audit_log is
  'Append-only admin action history (role changes, source/trust-score updates, manual pipeline runs, bulk operations). Service-role access only - no RLS policies.';

alter table public.admin_audit_log enable row level security;
