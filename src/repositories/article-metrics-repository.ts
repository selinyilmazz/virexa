import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArticleMetricsRow, ArticleMetricsUpdate, Database } from "@/types/database";

type CounterColumn = "view_count" | "bookmark_count" | "share_count" | "click_count";

/**
 * Max article ids per `.in()` call in `getManyByArticleIds` - mirrors
 * `article-repository.ts`'s `LOOKUP_CHUNK_SIZE` fix for the exact same
 * class of bug ("request-URL-too-long", observed in production there as
 * `UND_ERR_HEADERS_OVERFLOW` on a ~250-item batch - see that file's doc
 * comment for the full incident). `getManyByArticleIds` had the same
 * unbounded `.in("article_id", articleIds)` call, and is the one place
 * in the app that can realistically be handed a FOUR-figure id list: the
 * unified Explorer's "most-read" sort (`getNewsExplorerArticles`'s pooled
 * path) builds a candidate pool of up to 1,000 articles when no other
 * filter narrows it (exactly what `/most-read` does on a fresh page load
 * with no filters selected), then looked up view counts for that entire
 * pool in one request - ~1,000 UUIDs (~37k characters) is well past the
 * ~250-URL batch that already failed, so this was silently throwing on
 * every unfiltered `/most-read` load, caught by
 * `getNewsExplorerArticles`'s outer try/catch, and surfacing as "0
 * results" with no visible error. 100 keeps every chunk far under the
 * ~16KB limit regardless of id shape.
 */
const METRICS_LOOKUP_CHUNK_SIZE = 100;

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Data access for the `article_metrics` table - one row per article,
 * created (zeroed) once via `ensureExists` and incremented elsewhere.
 * The ingestion pipeline only ever calls `ensureExists`; it never
 * resets an existing row's counters ("view_count vb. haber pipeline
 * tarafından sıfırlanmaz"). Reads (`getByArticleId`,
 * `getManyByArticleIds`) work with any client; writes require the
 * service-role client (see `lib/supabase/service-client.ts`) since RLS
 * only grants write access to it.
 */
export function createArticleMetricsRepository(supabase: SupabaseClient<Database>) {
  async function getByArticleId(articleId: string): Promise<ArticleMetricsRow | null> {
    const { data, error } = await supabase.from("article_metrics").select("*").eq("article_id", articleId).maybeSingle();
    if (error) throw error;
    return data;
  }

  function buildCounterPatch(column: CounterColumn, value: number): ArticleMetricsUpdate {
    switch (column) {
      case "view_count":
        return { view_count: value };
      case "bookmark_count":
        return { bookmark_count: value };
      case "share_count":
        return { share_count: value };
      case "click_count":
        return { click_count: value };
    }
  }

  async function increment(articleId: string, column: CounterColumn): Promise<void> {
    const current = await getByArticleId(articleId);
    const nextValue = (current?.[column] ?? 0) + 1;
    const { error } = await supabase
      .from("article_metrics")
      .update(buildCounterPatch(column, nextValue))
      .eq("article_id", articleId);
    if (error) throw error;
  }

  async function decrement(articleId: string, column: CounterColumn): Promise<void> {
    const current = await getByArticleId(articleId);
    const nextValue = Math.max(0, (current?.[column] ?? 0) - 1);
    const { error } = await supabase
      .from("article_metrics")
      .update(buildCounterPatch(column, nextValue))
      .eq("article_id", articleId);
    if (error) throw error;
  }

  /**
   * Shared implementation behind `sumViewCounts`/`sumBookmarkCounts`/
   * `sumShareCounts` - fetches just the one requested counter column for
   * every row and sums in application code (no SQL `SUM()` support in
   * the shimmed query builder, same tradeoff documented on
   * `sumViewCounts` below).
   */
  async function sumColumn(column: CounterColumn): Promise<number> {
    const { data, error } = await supabase.from("article_metrics").select(column);
    if (error) throw error;
    return (data ?? []).reduce((total, row) => total + ((row as Record<CounterColumn, number>)[column] ?? 0), 0);
  }

  return {
    getByArticleId,

    /**
     * Bulk lookup by article id, used to rank a candidate pool of
     * articles by `view_count` (see `services/articles/article-read-
     * service.ts`'s Most Read sort) without querying per-article. Split
     * into `METRICS_LOOKUP_CHUNK_SIZE`-sized `.in()` calls run in
     * parallel and merged rather than one unbounded call - see
     * `METRICS_LOOKUP_CHUNK_SIZE`'s doc comment for the production
     * failure this fixes. Produces the exact same combined row set a
     * single unbounded `.in()` call would have; callers see no
     * difference besides no longer silently failing on large pools.
     */
    async getManyByArticleIds(articleIds: string[]): Promise<ArticleMetricsRow[]> {
      if (articleIds.length === 0) return [];
      const results = await Promise.all(
        chunkArray(articleIds, METRICS_LOOKUP_CHUNK_SIZE).map((idsChunk) =>
          supabase.from("article_metrics").select("*").in("article_id", idsChunk)
        )
      );
      const rows: ArticleMetricsRow[] = [];
      for (const result of results) {
        if (result.error) throw result.error;
        rows.push(...(result.data ?? []));
      }
      return rows;
    },

    /**
     * Creates a zeroed metrics row for every article id that doesn't
     * already have one. `ignoreDuplicates` is what makes this safe to
     * call on every pipeline run: an article that already has a row
     * keeps its existing counters untouched.
     */
    async ensureExists(articleIds: string[]): Promise<void> {
      if (articleIds.length === 0) return;
      const rows = articleIds.map((articleId) => ({ article_id: articleId }));
      const { error } = await supabase
        .from("article_metrics")
        .upsert(rows, { onConflict: "article_id", ignoreDuplicates: true });
      if (error) throw error;
    },

    incrementView: (articleId: string) => increment(articleId, "view_count"),
    incrementBookmark: (articleId: string) => increment(articleId, "bookmark_count"),
    decrementBookmark: (articleId: string) => decrement(articleId, "bookmark_count"),
    incrementShare: (articleId: string) => increment(articleId, "share_count"),
    incrementClick: (articleId: string) => increment(articleId, "click_count"),

    /**
     * Ready infrastructure for recording how long a reader actually
     * spent on an article ("Reading time kaydedilebilecek altyapı
     * hazırlansın"). Updates `reading_time_avg` as a running mean, using
     * the article's current `view_count` as the sample-size proxy (this
     * table doesn't track a separate sample count) - an approximation,
     * documented here rather than hidden. No client-side timing capture
     * is wired up to call this yet (see the closing report's gaps).
     */
    async recordReadingTime(articleId: string, seconds: number): Promise<void> {
      const current = await getByArticleId(articleId);
      const minutes = seconds / 60;
      const sampleCount = (current?.view_count ?? 0) + 1;
      const previousAvg = current?.reading_time_avg ?? 0;
      const nextAvg = previousAvg + (minutes - previousAvg) / sampleCount;
      const { error } = await supabase
        .from("article_metrics")
        .update({ reading_time_avg: Number(nextAvg.toFixed(2)) })
        .eq("article_id", articleId);
      if (error) throw error;
    },

    /**
     * Sums `view_count` across every article - backs the Admin
     * Dashboard's "Total Views" stat card. The shimmed query builder has
     * no SQL `SUM()` support (see `article-read-service.ts`'s trending-
     * category tally for the same constraint elsewhere), so this fetches
     * just the `view_count` column for every row and sums in application
     * code - a deliberate, bounded-cost tradeoff at this app's current
     * scale, swappable for a SQL view/RPC later without changing callers.
     */
    async sumViewCounts(): Promise<number> {
      return sumColumn("view_count");
    },

    /** Sums `bookmark_count` across every article - backs Admin Analytics' "Total Bookmarks" summary card (requirement 1). Same single-column-fetch-and-sum tradeoff as `sumViewCounts`. */
    async sumBookmarkCounts(): Promise<number> {
      return sumColumn("bookmark_count");
    },

    /** Sums `share_count` across every article - backs Admin Analytics' "Total Shares" summary card (requirement 1). Same tradeoff as `sumViewCounts`. */
    async sumShareCounts(): Promise<number> {
      return sumColumn("share_count");
    },

    /** Top `limit` rows by `view_count`, most-viewed first - Admin Analytics' "En çok görüntülenen makaleler" top list (requirement 3). A plain column `ORDER BY ... LIMIT`, not an aggregation, so it's a single real SQL query. */
    async listTopByViewCount(limit: number): Promise<ArticleMetricsRow[]> {
      const { data, error } = await supabase
        .from("article_metrics")
        .select("*")
        .order("view_count", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },

    /** Top `limit` rows by `bookmark_count`, most-bookmarked first - Admin Analytics' "En çok bookmarklanan makaleler" top list (requirement 3). */
    async listTopByBookmarkCount(limit: number): Promise<ArticleMetricsRow[]> {
      const { data, error } = await supabase
        .from("article_metrics")
        .select("*")
        .order("bookmark_count", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  };
}

export type ArticleMetricsRepository = ReturnType<typeof createArticleMetricsRepository>;
