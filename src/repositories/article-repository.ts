import type { SupabaseClient } from "@supabase/supabase-js";
import { MIN_ACCEPTABLE_CONTENT_LENGTH } from "@/lib/news";
import { articleInputSchema, articleSearchParamsSchema, fullTextSearchParamsSchema } from "@/lib/validation/article-storage-schema";
import type { ArticleInput, ArticleSearchParams, FullTextSearchParams } from "@/lib/validation/article-storage-schema";
import type { ArticleInsert, ArticleRow, Database } from "@/types/database";

function toInsert(input: ArticleInput): ArticleInsert {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    description: input.description,
    content: input.content ?? null,
    url: input.url,
    discussion_url: input.discussionUrl ?? null,
    image_url: input.imageUrl,
    image_source: input.imageSource ?? null,
    published_at: input.publishedAt,
    language: input.language,
    country: input.country,
    category: input.category,
    author: input.author ?? null,
    tags: input.tags,
    reading_time: input.readingTime,
    trust_score: input.trustScore,
    trending_score: input.trendingScore,
    source_id: input.sourceId,
  };
}

/**
 * Strips characters that would break a raw PostgREST filter string
 * (`.or()` takes a comma-separated list of `column.op.value` clauses).
 * A search box doesn't need full escaping/regex support - dropping
 * `,`, `(`, `)`, and `%` is a deliberate, documented simplification: a
 * search for a title that happens to contain a literal comma just won't
 * match on that exact character, which is an acceptable tradeoff for an
 * admin free-text search box.
 */
function sanitizeForOrFilter(term: string): string {
  return term.replace(/[,()%]/g, "").trim();
}

/**
 * Max number of values per `.in()` lookup call in `bulkUpsert()`'s
 * pre-upsert duplicate check (see `lookupExistingByColumn` below).
 *
 * PostgREST filter values for a plain `select` are encoded directly
 * into the GET request's URL - there is no request-body form for
 * `.in()` short of switching to an RPC function. An unbounded
 * `.in("url", urls)` call over a large batch can build a request URL
 * that exceeds Node's/the proxy's ~16KB header limit before the
 * request ever reaches Postgres (observed in production: a
 * ~250-article pipeline batch produced a 21,880-character request URL
 * and failed with `UND_ERR_HEADERS_OVERFLOW`, surfacing as a generic
 * "fetch failed" from `databaseStep()` with no Postgres error code at
 * all - the request never reached Postgres to get one).
 *
 * 100 is a conservative cap chosen for article URLs specifically:
 * real-world article URLs commonly run 60-150+ raw characters, and
 * percent-encoding (`:`, `/`, `.`, `?`, `=`, etc. inside the query
 * string) roughly doubles that once embedded in an `.in(...)` filter.
 * Even 100 such URLs stays comfortably under the 16KB limit in the
 * worst case observed so far, while keeping the number of parallel
 * chunk requests small for a typical batch (a ~250-article pipeline
 * run needs 3 chunks per lookup, not one request per article).
 */
const LOOKUP_CHUNK_SIZE = 100;

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Looks up existing `articles` rows by `url` or `slug` for
 * `bulkUpsert()`'s duplicate check, split into `LOOKUP_CHUNK_SIZE`-sized
 * `.in()` calls run in parallel and merged - this is the fix for the
 * request-URL-too-long failure a single unbounded `.in()` call used to
 * hit on large batches (see `LOOKUP_CHUNK_SIZE` above for the full
 * explanation). Produces the exact same combined row set a single
 * unbounded `.in()` call would have, just requested in safely-sized
 * pieces - `bulkUpsert()`'s duplicate-remap logic downstream is
 * unchanged and has no visibility into this chunking.
 */
async function lookupExistingByColumn(
  supabase: SupabaseClient<Database>,
  column: "url" | "slug",
  values: string[]
): Promise<Pick<ArticleRow, "id" | "url" | "slug">[]> {
  if (values.length === 0) return [];

  const results = await Promise.all(
    chunkArray(values, LOOKUP_CHUNK_SIZE).map((valuesChunk) =>
      supabase.from("articles").select("id, url, slug").in(column, valuesChunk)
    )
  );

  const rows: Pick<ArticleRow, "id" | "url" | "slug">[] = [];
  for (const result of results) {
    if (result.error) throw result.error;
    rows.push(...(result.data ?? []));
  }
  return rows;
}

export type ArticleSearchResult = {
  items: ArticleRow[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * One row returned by the `search_articles_fts` Postgres function (see
 * `supabase/migrations/0004_full_text_search.sql`) - every `ArticleRow`
 * column plus the two computed fields the SQL function adds: `rank`
 * (relevance score, highest first) and `matched_in` (which field the
 * query actually matched - "title" | "ai_summary" | "description" |
 * "content" | "tags" | "source" | "author" | "category" | "other" -
 * powers the "Matched in X" UI badge). `total_count` is the same value
 * on every row of a given call (a SQL window function), read once by
 * `fullTextSearch()` below rather than exposed per-row to callers.
 */
export type FullTextSearchRow = ArticleRow & {
  rank: number;
  matched_in: string;
  total_count: number;
};

export type FullTextSearchResult = {
  items: FullTextSearchRow[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Data access for the `articles` table - CRUD, filtered/paginated
 * search, full-text search, and a duplicate-prevention-aware bulk
 * upsert. See `supabase/migrations/0002_article_storage.sql` (and
 * `0004_full_text_search.sql` for the full-text search function) for
 * the schema this is built against.
 */
export function createArticleRepository(supabase: SupabaseClient<Database>) {
  return {
    async getById(id: string): Promise<ArticleRow | null> {
      const { data, error } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async getBySlug(slug: string): Promise<ArticleRow | null> {
      const { data, error } = await supabase.from("articles").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },

    /**
     * Bulk lookup by id, split into `LOOKUP_CHUNK_SIZE`-sized `.in()`
     * calls run in parallel and merged - same request-URL-too-long fix as
     * `lookupExistingByColumn` (see `LOOKUP_CHUNK_SIZE`'s doc comment).
     * Used to cross-reference a candidate pool (e.g. `listTopByTrending`,
     * or the Most Read pooled path's `article_metrics`-driven id list in
     * `article-read-service.ts`, which can realistically hand this up to
     * ~1000 ids) against another source of ids.
     */
    async getByIds(ids: string[]): Promise<ArticleRow[]> {
      if (ids.length === 0) return [];
      const results = await Promise.all(
        chunkArray(ids, LOOKUP_CHUNK_SIZE).map((idsChunk) => supabase.from("articles").select("*").in("id", idsChunk))
      );
      const rows: ArticleRow[] = [];
      for (const result of results) {
        if (result.error) throw result.error;
        rows.push(...(result.data ?? []));
      }
      return rows;
    },

    /** Top articles by `trending_score`, most-trending first - the candidate pool the read-side UI service (`services/articles/article-read-service.ts`) builds Home's Featured/Most-Read/Trending-Topics widgets from. */
    async listTopByTrending(limit: number): Promise<ArticleRow[]> {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("trending_score", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },

    /**
     * Top articles by `trust_score`, most-trusted first - the Admin
     * Analytics "En yüksek Trust Score" top list (requirement 3). Mirrors
     * `listTopByTrending` exactly, just ordered on a different column.
     */
    async listTopByTrustScore(limit: number): Promise<ArticleRow[]> {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("trust_score", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },

    /** Same-category articles other than `excludeId`, most-trending first - the real, repository-backed "Similar Articles" used on the article detail page. */
    async getSimilar(category: string, excludeId: string, limit: number): Promise<ArticleRow[]> {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("category", category)
        .neq("id", excludeId)
        .order("trending_score", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },

    /**
     * Filtered, paginated search - title (partial, case-insensitive),
     * tag (array containment), source, category, date range, language,
     * country ("başlık, etiket, kaynak, kategori, tarih, dil, ülke
     * filtrelerini desteklesin"). One query, one round trip;
     * `count: "exact"` returns the total match count for pagination.
     * `sortBy` defaults to newest-first by publish date; pass
     * `"trending_score"` for the `/news` Explorer's real "Trending" sort.
     * NOT used for `/most-read` - that ranks by real
     * `article_metrics.view_count` instead (a separate table this method
     * doesn't touch), via `listTopByViewCount` - see
     * `getNewsExplorerArticles`'s `most-read` branch and
     * `getMostRead`'s doc comment (Most Read ordering audit).
     *
     * Admin Articles Management additions (all additive, optional,
     * backward-compatible with every existing caller): `url` (partial
     * match), `minTrustScore`/`maxTrustScore`, `minTrendingScore`/
     * `maxTrendingScore` (range filters), and `searchText` (+ optional
     * `searchSourceIds`) - a single free-text admin search across
     * title/url/tags/source, combined via one `.or()` clause that ANDs
     * with every other active filter.
     *
     * This is a plain ILIKE/containment filter, deliberately NOT
     * relevance-ranked - it's used by the admin Articles list and by
     * `/most-read`'s exact trending sort, neither of which wants
     * text-relevance ordering. For the public search page's free-text
     * query box, see `fullTextSearch()` below instead.
     */
    async search(rawParams: Partial<ArticleSearchParams> = {}): Promise<ArticleSearchResult> {
      const params = articleSearchParamsSchema.parse(rawParams);

      let query = supabase.from("articles").select("*", { count: "exact" });
      if (params.title) query = query.ilike("title", `%${params.title}%`);
      if (params.tag) query = query.contains("tags", [params.tag]);
      if (params.sourceId) query = query.eq("source_id", params.sourceId);
      // `categories` (multi-select, added for the /search page's
      // filter-only browse path) takes priority over the single-value
      // `category` when both are somehow present.
      if (params.categories && params.categories.length > 0) {
        query = query.in("category", params.categories);
      } else if (params.category) {
        query = query.eq("category", params.category);
      }
      if (params.language) query = query.eq("language", params.language);
      if (params.country) query = query.eq("country", params.country);
      if (params.dateFrom) query = query.gte("published_at", params.dateFrom);
      if (params.dateTo) query = query.lte("published_at", params.dateTo);
      if (params.url) query = query.ilike("url", `%${params.url}%`);
      if (params.minTrustScore !== undefined) query = query.gte("trust_score", params.minTrustScore);
      if (params.maxTrustScore !== undefined) query = query.lte("trust_score", params.maxTrustScore);
      if (params.minTrendingScore !== undefined) query = query.gte("trending_score", params.minTrendingScore);
      if (params.maxTrendingScore !== undefined) query = query.lte("trending_score", params.maxTrendingScore);

      if (params.searchText) {
        const safe = sanitizeForOrFilter(params.searchText);
        if (safe) {
          const clauses = [`title.ilike.%${safe}%`, `url.ilike.%${safe}%`, `tags.cs.{${safe}}`];
          if (params.searchSourceIds && params.searchSourceIds.length > 0) {
            clauses.push(`source_id.in.(${params.searchSourceIds.join(",")})`);
          }
          query = query.or(clauses.join(","));
        }
      }

      const from = (params.page - 1) * params.pageSize;
      const to = from + params.pageSize - 1;

      const { data, error, count } = await query.order(params.sortBy, { ascending: params.sortAscending }).range(from, to);
      if (error) throw error;

      return { items: data ?? [], total: count ?? 0, page: params.page, pageSize: params.pageSize };
    },

    /**
     * Real PostgreSQL full-text search - title/description/content/
     * tags/author/category on `articles` itself, plus AI summary/TLDR
     * (`article_ai`) and source name (`article_sources`), ranked by
     * relevance (title matches weighted highest), via the
     * `search_articles_fts` Postgres function (one indexed round trip -
     * see `supabase/migrations/0004_full_text_search.sql` for the exact
     * ranking/matching logic). This is what backs the public `/search`
     * page's free-text query box; `search()` above is unrelated and
     * unchanged, still used by the admin Articles list and `/most-read`.
     *
     * Pagination and every filter are pushed down into the SQL function
     * itself (no post-fetch slicing) - `total` comes from the
     * function's own window-function `total_count` column, read off the
     * first returned row (identical on every row of one call).
     *
     * `filter_categories` (added in `0007_search_multi_category.sql`)
     * is what the public search page's multi-select Category checkboxes
     * actually use - selecting more than one category used to silently
     * apply only the first (see `params.category`, still supported for
     * single-value callers).
     */
    async fullTextSearch(rawParams: FullTextSearchParams): Promise<FullTextSearchResult> {
      const params = fullTextSearchParamsSchema.parse(rawParams);

      const { data, error } = await supabase.rpc<FullTextSearchRow>("search_articles_fts", {
        search_query: params.query,
        filter_source_id: params.sourceId ?? null,
        filter_category: params.category ?? null,
        filter_categories: params.categories ?? null,
        filter_language: params.language ?? null,
        filter_country: params.country ?? null,
        filter_tag: params.tag ?? null,
        filter_date_from: params.dateFrom ?? null,
        filter_date_to: params.dateTo ?? null,
        result_limit: params.pageSize,
        result_offset: (params.page - 1) * params.pageSize,
        sort_by: params.sortBy,
      });
      if (error) throw error;

      const items = data ?? [];
      return {
        items,
        total: items[0]?.total_count ?? 0,
        page: params.page,
        pageSize: params.pageSize,
      };
    },

    /**
     * Bulk-persists a batch of articles in at most three round trips
     * (two parallel duplicate lookups + one bulk upsert), never one
     * request per article ("Toplu insert kullan, gereksiz tek tek
     * insert yapma"):
     *
     * 1. Look up any EXISTING row whose `url` or `slug` matches an
     *    incoming candidate but under a DIFFERENT `id`. `id` is already
     *    deterministic from source+slug (see the migration's comment on
     *    `articles.id`), which is the first line of duplicate defense;
     *    this lookup is the second, for the rare case where two
     *    different ids would otherwise collide on the same `url`/`slug`
     *    unique constraint ("Duplicate haber oluşturulmasın"). Each
     *    lookup is chunked via `lookupExistingByColumn` (see
     *    `LOOKUP_CHUNK_SIZE`) rather than one unbounded `.in()` call, so
     *    a large batch can't build a request URL that exceeds
     *    PostgREST's/Node's request-size limits.
     * 2. Any such candidate is remapped onto the existing row's id, so
     *    it updates that row instead of failing on a unique-constraint
     *    violation.
     * 3. A single bulk `upsert(..., { onConflict: "id" })` for the
     *    whole (possibly remapped) batch.
     *
     * Every input is validated with `articleInputSchema` first - a
     * malformed article never reaches either round trip ("Eksik haber
     * database'e yazılmasın").
     *
     * Returns `idMap` (original input id -> the id actually persisted to
     * `articles.id`, identical for every non-remapped input) alongside
     * the summary counts - production root-cause fix: `databaseStep`
     * used to pass the pipeline's original, pre-remap article ids
     * straight through to `article_ai`/`article_metrics` (both
     * `references articles (id)`), so any article that got silently
     * remapped here (its `url`/`slug` already existed under a different
     * id) produced AI/metrics rows pointing at an id that was NEVER
     * actually written to `articles` - surfacing as
     * `article_metrics_article_id_fkey` foreign key violations
     * (23503) on the very next step. Callers MUST resolve every
     * downstream article id through this map instead of reusing the
     * original id blindly.
     */
    async bulkUpsert(inputs: ArticleInput[]): Promise<{ saved: number; remapped: number; idMap: Map<string, string> }> {
      if (inputs.length === 0) return { saved: 0, remapped: 0, idMap: new Map() };

      const validated = inputs.map((input) => articleInputSchema.parse(input));
      const urls = validated.map((article) => article.url);
      const slugs = validated.map((article) => article.slug);

      const [byUrlRows, bySlugRows] = await Promise.all([
        lookupExistingByColumn(supabase, "url", urls),
        lookupExistingByColumn(supabase, "slug", slugs),
      ]);

      const idByUrl = new Map(byUrlRows.map((row) => [row.url, row.id]));
      const idBySlug = new Map(bySlugRows.map((row) => [row.slug, row.id]));

      let remapped = 0;
      const idMap = new Map<string, string>();
      const rows = validated.map((input) => {
        const existingId = idByUrl.get(input.url) ?? idBySlug.get(input.slug);
        const finalId = existingId && existingId !== input.id ? existingId : input.id;
        if (finalId !== input.id) remapped += 1;
        idMap.set(input.id, finalId);
        return toInsert({ ...input, id: finalId });
      });

      const { error } = await supabase.from("articles").upsert(rows, { onConflict: "id" });
      if (error) throw error;

      return { saved: rows.length, remapped, idMap };
    },

    /**
     * Lightweight, columns-only update of `trending_score` - used by
     * the standalone `TrendingJob` (`runtime/jobs/news-jobs.ts`), which
     * recomputes scores for already-stored articles without
     * re-validating/re-upserting every other field. Deliberately plain
     * `update()` calls (not `upsert`) run in parallel: an upsert would
     * require every NOT NULL column to be present in the payload, which
     * this lightweight path doesn't have.
     */
    async updateTrendingScores(updates: { id: string; trendingScore: number }[]): Promise<void> {
      if (updates.length === 0) return;
      const results = await Promise.all(
        updates.map(({ id, trendingScore }) =>
          supabase.from("articles").update({ trending_score: trendingScore }).eq("id", id)
        )
      );
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
    },

    /**
     * Lightweight, columns-only update of `trust_score` - the write
     * side of Admin Runtime Operations' "Recalculate Trust Scores"
     * (Operations phase, requirement 2). Mirrors `updateTrendingScores`
     * exactly: plain parallel `update()` calls, not an upsert.
     */
    async updateTrustScores(updates: { id: string; trustScore: number }[]): Promise<void> {
      if (updates.length === 0) return;
      const results = await Promise.all(
        updates.map(({ id, trustScore }) => supabase.from("articles").update({ trust_score: trustScore }).eq("id", id))
      );
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
    },

    /**
     * Every stored article's id/source/current trust score, one round
     * trip - the read side of "Recalculate Trust Scores"
     * (`admin-runtime-ops-service.ts`). Selects only the three columns
     * that operation needs (not `select("*")`), same "bounded sweep"
     * tradeoff as `admin-analytics-service.ts`'s summary sums - a
     * maintenance operation over the whole table is expected to be
     * infrequent and admin-triggered, not part of any hot path.
     */
    async listAllForTrustSync(): Promise<{ id: string; source_id: string; trust_score: number }[]> {
      const { data, error } = await supabase.from("articles").select("id, source_id, trust_score");
      if (error) throw error;
      return data ?? [];
    },

    /**
     * Lightweight, columns-only update of `image_url`/`image_source` -
     * the write side of Admin Runtime Operations' "Backfill Real
     * Images" (see `admin-runtime-ops-service.ts`'s
     * `backfillArticleImages`). Mirrors `updateTrendingScores`/
     * `updateTrustScores` exactly: plain parallel `update()` calls, not
     * an upsert - this path never has every other NOT NULL column an
     * upsert would require.
     */
    async updateImages(updates: { id: string; imageUrl: string; imageSource: string }[]): Promise<void> {
      if (updates.length === 0) return;
      const results = await Promise.all(
        updates.map(({ id, imageUrl, imageSource }) =>
          supabase.from("articles").update({ image_url: imageUrl, image_source: imageSource }).eq("id", id)
        )
      );
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
    },

    /**
     * Articles whose image still needs a real-photo backfill - either
     * never classified (`image_source is null`, rows written before
     * migration 0010 added that column) or already known to be sitting
     * on the local category placeholder (`image_source = 'placeholder'`)
     * because stock-photo search found nothing usable at ingestion time.
     * Capped at `limit` (the caller, `backfillArticleImages`, bounds
     * this the same way `MAX_STOCK_IMAGE_LOOKUPS_PER_RUN` bounds a
     * single ingestion pass's stock-photo search budget) - an admin can
     * click the action again to work through more of the table.
     */
    async listNeedingImageBackfill(limit: number): Promise<{ id: string; title: string; category: string }[]> {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, category")
        .or("image_source.is.null,image_source.eq.placeholder")
        .order("trending_score", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },

    /**
     * Lightweight, columns-only update of `content` - the write side of
     * Admin Runtime Operations' "Backfill Article Content" (see
     * `admin-runtime-ops-service.ts`'s `backfillArticleContent`). Mirrors
     * `updateImages`/`updateTrustScores` exactly: plain parallel
     * `update()` calls, not an upsert.
     */
    async updateContent(updates: { id: string; content: string }[]): Promise<void> {
      if (updates.length === 0) return;
      const results = await Promise.all(
        updates.map(({ id, content }) => supabase.from("articles").update({ content }).eq("id", id))
      );
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
    },

    /**
     * Articles whose `content` is still missing or thin (below
     * `MIN_ACCEPTABLE_CONTENT_LENGTH` - same bar `fetchArticleContent`
     * enforces at ingestion time, checked here in application code since
     * PostgREST has no convenient "length of a nullable column" filter)
     * - the retroactive counterpart to `news-aggregator.ts`'s
     * content-resolution stage, which only ever runs for NEWLY-ingested
     * articles going forward. Capped at `limit` and ordered by
     * `trending_score` so an admin backfill run prioritizes the articles
     * readers are actually most likely to open.
     */
    async listNeedingContentBackfill(limit: number): Promise<{ id: string; url: string; content: string | null }[]> {
      // Scans a wider window than `limit` and filters for thin/missing
      // content in application code (not a DB-side `length()` filter -
      // PostgREST's REST filter syntax has no convenient way to express
      // "length of a nullable text column"), then caps the RESULT at
      // `limit`. The scan window is intentionally generous relative to
      // `limit` since most trending articles already have real content
      // by the time an admin runs this - see `backfillArticleContent`'s
      // doc comment for the resulting content threshold this feeds.
      const SCAN_WINDOW = Math.max(limit * 5, 100);
      const { data, error } = await supabase
        .from("articles")
        .select("id, url, content")
        .order("trending_score", { ascending: false })
        .limit(SCAN_WINDOW);
      if (error) throw error;
      return (data ?? [])
        .filter((row) => !row.content || row.content.trim().length < MIN_ACCEPTABLE_CONTENT_LENGTH)
        .slice(0, limit);
    },

    /** Total row count - a zero-row `head` request, so it's cheap regardless of table size. Backs the Admin Dashboard's "Total Articles" stat card. */
    async count(): Promise<number> {
      const { count, error } = await supabase.from("articles").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },

    /**
     * Count of articles whose `created_at` (when the row was INSERTED
     * into our database) is on or after `isoDate` - deliberately
     * `created_at`, not `published_at` (which `search()`'s `dateFrom`
     * filters on): "son 24 saatte eklenen makale" means "added to
     * Virexa", not "originally published by the source", and those two
     * timestamps can differ by days for backfilled/older articles.
     */
    async countCreatedSince(isoDate: string): Promise<number> {
      const { count, error } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", isoDate);
      if (error) throw error;
      return count ?? 0;
    },

    /**
     * Every article published within `[fromIso, toIso]`, ordered oldest
     * first, capped at `limit`. Admin Analytics' Time Series data source
     * (requirement 2): the caller buckets these rows by `published_at`
     * in application code (no SQL `date_trunc`/`GROUP BY` support in the
     * shimmed query builder). Deliberately not `search()`'s paginated
     * shape - analytics needs every matching row in one pass, not a
     * page of them. `limit` is a deliberate safety cap, not a real
     * pagination boundary: analytics windows are short (max 30 days),
     * so this stays well within a single round trip at this app's scale.
     */
    async listPublishedBetween(fromIso: string, toIso: string, limit = 5000): Promise<ArticleRow[]> {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .gte("published_at", fromIso)
        .lte("published_at", toIso)
        .order("published_at", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  };
}

export type ArticleRepository = ReturnType<typeof createArticleRepository>;
