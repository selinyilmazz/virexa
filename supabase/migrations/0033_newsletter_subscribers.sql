-- ============================================================================
-- Newsletter subscribers - MVP (collection & management only)
--
-- Phase 1 of the Newsletter system: just the subscriber list
-- infrastructure (homepage signup + Admin management). Deliberately does
-- NOT add anything related to actually sending email - no campaign/
-- send-log/template/schedule tables, no provider integration (SES/
-- SendGrid/Resend/etc). See `src/services/newsletter/newsletter-service.ts`'s
-- doc comment for the exact Phase 2 plug-in points this leaves open
-- (weekly digest, daily digest, AI summaries, Top Stories, Developer
-- Releases, GitHub Trending) without requiring a schema rewrite later.
--
-- Every write goes through the service-role client only (see
-- `src/repositories/newsletter-subscriber-repository.ts`) - RLS grants no
-- direct anon/authenticated access at all, the same "server route is the
-- one place this boundary is crossed" convention `article_sources` uses
-- (see 0002_article_storage.sql). Email normalization (trim + lowercase)
-- always happens in the application layer before every insert/lookup, so
-- the plain column-level UNIQUE constraint below is effectively
-- case-insensitive in practice ("no duplicate subscriptions").
--
-- Safe to re-run: guarded with IF NOT EXISTS / OR REPLACE.
-- ============================================================================

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

comment on table public.newsletter_subscribers is 'Newsletter signup list (MVP - subscriber collection/management only, no email sending yet). See newsletter-service.ts for the Phase 2 plug-in points.';
comment on column public.newsletter_subscribers.email is 'Always stored trimmed + lowercased by the application layer (see newsletter-subscriber-repository.ts) - keeps this UNIQUE constraint effectively case-insensitive.';
comment on column public.newsletter_subscribers.is_active is 'true = currently subscribed. Admins can deactivate (soft, reversible) instead of deleting, and reactivate later - see /admin/newsletter.';

drop trigger if exists set_updated_at on public.newsletter_subscribers;
create trigger set_updated_at
  before update on public.newsletter_subscribers
  for each row
  execute function public.set_updated_at();

alter table public.newsletter_subscribers enable row level security;

-- No select/insert/update/delete policies for anon or authenticated: this
-- table is never read or written directly from the browser. Public signup
-- goes through POST /api/newsletter/subscribe and admin management goes
-- through /api/admin/newsletter/* - both use the service-role client
-- (createServiceClient()), which bypasses RLS entirely.
