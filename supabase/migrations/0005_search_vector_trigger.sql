-- Virexa Full-Text Search - trigger-maintained search_vector
--
-- Production incident this fixes: `articles.search_vector` was
-- originally a `generated always as (...) stored` column (see
-- `0004_full_text_search.sql`). Postgres rejected that generation
-- expression as not-immutable in the live project (the two-arg
-- `to_tsvector('english', text)` form is not guaranteed immutable
-- inside a generated column's expression), so it was manually
-- converted to a plain `tsvector` column and backfilled once via a
-- one-off `UPDATE`. A plain column is never auto-maintained by
-- Postgres, so every article written since that conversion has
-- `search_vector = NULL` - and `search_articles_fts()`'s primary match
-- clause (`a.search_vector @@ q.tsq`) can never be true for a NULL
-- vector, so every public search query returns 0 results regardless of
-- how many articles exist.
--
-- Fix: a `BEFORE INSERT OR UPDATE` trigger recomputes `search_vector`
-- on every write. Trigger function bodies are NOT subject to the
-- "generated column expression must be immutable" restriction that
-- broke the original design - `to_tsvector('english', ...)` is
-- completely valid inside a trigger function. This preserves the exact
-- same weighted ranking as the original design (title A / description+
-- tags B / content+author+category C) and requires zero application
-- code changes - `ArticleRepository.bulkUpsert()` keeps writing the
-- same columns it always has; the trigger fills `search_vector` in
-- transparently on the database side.
--
-- Production safety:
--   - Wrapped in an explicit transaction: either every statement below
--     applies, or (on any error) none of it does - no partially-applied
--     state.
--   - Every statement is idempotent (`create or replace`, `drop ... if
--     exists`, `add column if not exists`, `create index if not
--     exists`, an `update ... where search_vector is null` that is a
--     true no-op on a second run) - safe to paste and run again if the
--     first run is ever interrupted.
--   - No destructive statements anywhere (no `drop table`, no `delete`,
--     no column removal) - purely additive.
--   - The backfill `UPDATE` touches only rows where `search_vector is
--     null`, so on a table already fully backfilled it does zero work.
--     At current table size (hundreds of rows) this is a sub-second,
--     single-statement operation with no special locking concerns; if
--     `articles` ever grows into the millions, consider batching this
--     specific backfill (not the trigger, which is always row-scoped)
--     in chunks instead of one statement.

begin;

create or replace function public.articles_set_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.content, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.author, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.category, '')), 'C');
  return new;
end;
$$;

comment on function public.articles_set_search_vector is
  'Maintains articles.search_vector on every insert/update. Replaces the GENERATED ALWAYS AS (...) STORED approach from 0004, which Postgres rejected as not-immutable for a two-arg to_tsvector(regconfig, text) expression - trigger function bodies have no such immutability requirement.';

drop trigger if exists articles_search_vector_trigger on public.articles;

create trigger articles_search_vector_trigger
  before insert or update on public.articles
  for each row
  execute function public.articles_set_search_vector();

-- Defensive - the column and its GIN index should already exist from
-- the live manual patch described above, but these guards make this
-- migration safe to run standalone against a project that only ever
-- applied the trigger-breaking part of 0004.
alter table public.articles
  add column if not exists search_vector tsvector;

create index if not exists articles_search_vector_idx
  on public.articles using gin (search_vector);

-- Backfill: every row currently sitting at search_vector = NULL
-- (every article written since the generated column was converted to
-- a plain one) gets computed now, using the exact same expression the
-- trigger above uses. No-op on a second run.
update public.articles set
  search_vector =
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(author, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C')
where search_vector is null;

commit;

-- ============================================================================
-- Optional, read-only verification (run separately, after the commit
-- above - not part of the migration itself). Expected result: 0.
-- A non-zero count means some rows still have a NULL search_vector
-- (e.g. the backfill UPDATE above didn't reach every row) and search
-- will keep missing those specific articles.
-- ============================================================================
-- select count(*) as articles_missing_search_vector
-- from public.articles
-- where search_vector is null;
