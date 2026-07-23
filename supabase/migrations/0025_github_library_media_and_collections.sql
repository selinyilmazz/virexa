-- Curated GitHub library metadata. These values are authored in Admin;
-- no public UI falls back to invented copy or mock images.
alter table public.repositories add column if not exists cover_image_url text;
alter table public.repositories add column if not exists audience text not null default '';

alter table public.collections add column if not exists cover_image_url text;
alter table public.collections add column if not exists difficulty text
  check (difficulty is null or difficulty in ('beginner', 'intermediate', 'advanced'));
alter table public.collections add column if not exists estimated_learning_time text not null default '';

create index if not exists repositories_updated_at_idx on public.repositories (updated_at desc);
