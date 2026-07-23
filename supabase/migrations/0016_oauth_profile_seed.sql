-- Seeds full_name/avatar_url from OAuth provider metadata on first sign-in
-- (Google Auth feature). `handle_new_user()` already runs on every new
-- `auth.users` row (see migration 0001) and already seeded `full_name`
-- for email/password sign-up; this just also reads the extra fields an
-- OAuth provider supplies in `raw_user_meta_data` so a brand-new Google
-- user gets their real name and profile photo immediately, without any
-- client-side "first login" special case.
--
-- Google (via Supabase's provider normalization) sets `full_name` and
-- `avatar_url` directly in most cases, but falls back to `name`/`picture`
-- (the raw Google field names) defensively in case that ever changes.
-- Email/password sign-up never sets any of the `name`/`avatar_url`/
-- `picture` keys, so `coalesce(...) '' ` still resolves correctly for
-- that path exactly as before.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;

  insert into public.user_settings (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- The trigger itself is unchanged (still fires `after insert on
-- auth.users`); only the function body above changed, so no
-- drop/recreate of the trigger is needed. Re-stated here anyway so this
-- migration is fully self-contained and safe to re-run on its own.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
