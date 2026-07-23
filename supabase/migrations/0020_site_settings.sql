-- Admin Panel: editable Site Settings
--
-- /admin/settings was entirely read-only status (env/health/config
-- introspection) - there was no real settings a site name, homepage
-- featured count, maintenance mode, etc. This is a singleton table (the
-- `id = 1` check constraint below enforces exactly one row) holding the
-- handful of real, site-wide settings the spec asks for.
--
-- Public read is allowed (the public site needs maintenance_mode,
-- articles_per_page, homepage_featured_count, default_language,
-- default_timezone, site_name, logo_url, primary_color at render time);
-- only the service role can write, same as every other admin-write table.
--
-- Safe to re-run: guarded with IF NOT EXISTS / OR REPLACE / ON CONFLICT.

create table if not exists public.site_settings (
  id integer primary key default 1 constraint site_settings_singleton check (id = 1),
  site_name text not null default 'Virexa',
  logo_url text,
  primary_color text not null default '#2f67e8',
  homepage_featured_count integer not null default 4
    constraint site_settings_featured_count_range check (homepage_featured_count between 1 and 12),
  articles_per_page integer not null default 20
    constraint site_settings_per_page_range check (articles_per_page between 5 and 100),
  enable_registrations boolean not null default true,
  maintenance_mode boolean not null default false,
  default_language text not null default 'en',
  default_timezone text not null default 'UTC',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.site_settings is 'Singleton row (id always 1) of admin-editable site-wide settings - see /admin/settings.';

drop trigger if exists set_updated_at on public.site_settings;
create trigger set_updated_at
  before update on public.site_settings
  for each row
  execute function public.set_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_select_all" on public.site_settings;
create policy "site_settings_select_all"
  on public.site_settings for select
  using (true);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;
