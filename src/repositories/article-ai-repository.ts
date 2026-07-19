import type { SupabaseClient } from "@supabase/supabase-js";
import { articleAIInputSchema } from "@/lib/validation/article-storage-schema";
import type { ArticleAIInput } from "@/lib/validation/article-storage-schema";
import type { ArticleAIInsert, ArticleAIRow, Database } from "@/types/database";

function toInsert(input: ArticleAIInput): ArticleAIInsert {
  return {
    article_id: input.articleId,
    summary: input.summary ?? null,
    tldr: input.tldr ?? null,
    long_summary: input.longSummary ?? null,
    rewritten_article: input.rewrittenArticle ?? null,
    entities: input.entities ?? null,
    key_takeaways: input.keyTakeaways ?? null,
    tags: input.tags,
    sentiment: input.sentiment ?? null,
    bias: input.bias ?? null,
    provider: input.provider,
    model: input.model,
    prompt_version: input.promptVersion,
    generated_at: new Date().toISOString(),
    cache_key: input.cacheKey,
  };
}

/** Keeps only the newest (highest `generated_at`) row per `article_id` from an already `generated_at`-descending-ordered list - the shared reduction behind `getLatestManyByArticleIds` and `listAllLatestPerArticle`. */
function reduceToLatestPerArticle(rows: ArticleAIRow[]): Map<string, ArticleAIRow> {
  const latestByArticleId = new Map<string, ArticleAIRow>();
  for (const row of rows) {
    if (!latestByArticleId.has(row.article_id)) {
      latestByArticleId.set(row.article_id, row);
    }
  }
  return latestByArticleId;
}

/**
 * Data access for the `article_ai` table. AI output is never merged
 * into `articles` (see the migration's table comment) and is versioned
 * by content: a row is keyed on `(article_id, provider, cache_key)`
 * (`article_ai_version_unique` in the migration), where `cache_key` is
 * the article's content hash at generation time
 * (`lib/ai/content-hash.ts`). Regenerating for unchanged content on the
 * same provider updates the same row (idempotent); a content change or
 * provider switch produces a new `cache_key` and therefore a new,
 * separately-preserved row - old AI output is never overwritten
 * ("Yeni AI üretildiyse eski kayıt overwrite edilmesin").
 */
export function createArticleAIRepository(supabase: SupabaseClient<Database>) {
  return {
    /** Latest AI enrichment for an article (highest `generated_at`), or `null` if none has been generated yet. */
    async getLatest(articleId: string): Promise<ArticleAIRow | null> {
      const { data, error } = await supabase
        .from("article_ai")
        .select("*")
        .eq("article_id", articleId)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    /**
     * Latest AI enrichment for a whole batch of articles, one round
     * trip - the bulk counterpart to `getLatest`, used by the Admin
     * Articles list (`services/admin/admin-article-service.ts`) to show
     * an AI status column without an N+1 query per row. Fetches every
     * matching `article_ai` row ordered newest-first and keeps only the
     * first (= latest) occurrence per `article_id` in application code -
     * the same "no SQL DISTINCT ON support in the shimmed query builder"
     * tradeoff already used elsewhere (see `article-read-service.ts`).
     */
    async getLatestManyByArticleIds(articleIds: string[]): Promise<Map<string, ArticleAIRow>> {
      if (articleIds.length === 0) return new Map();
      const { data, error } = await supabase
        .from("article_ai")
        .select("*")
        .in("article_id", articleIds)
        .order("generated_at", { ascending: false });
      if (error) throw error;
      return reduceToLatestPerArticle(data ?? []);
    },

    /**
     * Every article's latest AI enrichment, system-wide, one round trip -
     * the Admin Analytics AI Analytics data source (requirement 4:
     * provider/model/sentiment/bias distributions, average summary
     * length, average tag count). Same "fetch newest-first, keep first
     * occurrence per article_id" reduction as `getLatestManyByArticleIds`,
     * just without an `.in()` filter - bounded by this table's total row
     * count, which is the same order of magnitude as the article count
     * at this app's current scale.
     */
    async listAllLatestPerArticle(): Promise<ArticleAIRow[]> {
      const { data, error } = await supabase.from("article_ai").select("*").order("generated_at", { ascending: false });
      if (error) throw error;
      return [...reduceToLatestPerArticle(data ?? []).values()];
    },

    /**
     * Count of distinct articles that have at least one AI enrichment -
     * Admin Analytics/Dashboard's "AI Enriched Articles" summary card.
     * The shimmed query builder has no SQL `COUNT(DISTINCT ...)`, so this
     * fetches just the `article_id` column for every row and counts
     * unique values in application code - same bounded-cost tradeoff as
     * `listAllLatestPerArticle`.
     */
    async countDistinctArticles(): Promise<number> {
      const { data, error } = await supabase.from("article_ai").select("article_id");
      if (error) throw error;
      return new Set((data ?? []).map((row) => row.article_id)).size;
    },

    /** Every preserved version for an article, newest first - the versioning history this table exists to keep. */
    async getHistory(articleId: string): Promise<ArticleAIRow[]> {
      const { data, error } = await supabase
        .from("article_ai")
        .select("*")
        .eq("article_id", articleId)
        .order("generated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async upsert(input: ArticleAIInput): Promise<ArticleAIRow> {
      const validated = articleAIInputSchema.parse(input);
      const { data, error } = await supabase
        .from("article_ai")
        .upsert(toInsert(validated), { onConflict: "article_id,provider,cache_key" })
        .select("*")
        .single();
      if (error) throw error;
      if (!data) throw new Error("article_ai upsert returned no data.");
      return data;
    },

    /** Bulk variant of `upsert` - one round trip for a whole pipeline run's worth of AI results, rather than one write per article. */
    async bulkUpsert(inputs: ArticleAIInput[]): Promise<void> {
      if (inputs.length === 0) return;
      const rows = inputs.map((input) => toInsert(articleAIInputSchema.parse(input)));
      const { error } = await supabase.from("article_ai").upsert(rows, { onConflict: "article_id,provider,cache_key" });
      if (error) throw error;
    },
  };
}

export type ArticleAIRepository = ReturnType<typeof createArticleAIRepository>;
