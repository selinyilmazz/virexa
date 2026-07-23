import { createServiceClient } from "@/lib/supabase/service-client";
import type { ArticleInput, ArticleSourceInput } from "@/lib/validation/article-storage-schema";
import { runPipelineStep } from "@/runtime/pipeline/types";
import type { PipelineStepResult } from "@/runtime/pipeline/types";
import { createArticleMetricsRepository } from "@/repositories/article-metrics-repository";
import { createArticleRepository } from "@/repositories/article-repository";
import { createSourceRepository } from "@/repositories/source-repository";
import type { NewsArticle } from "@/types/news";

export type DatabaseStepData = {
  sourcesSaved: number;
  articlesSaved: number;
  articlesRemapped: number;
  metricsEnsured: number;
  /**
   * Genuinely-new (not already stored) article count per source name -
   * added for the Mobile Games RSS end-to-end verification request's
   * "show how many new articles came from each source" requirement.
   * `articlesSaved` above is every upserted row (new inserts AND routine
   * re-upserts of already-stored articles combined) - this is the
   * new-only subset, broken out by source, computed from
   * `articleRepository.bulkUpsert()`'s `newIds` (see that function's doc
   * comment for why a plain "was this remapped" check isn't enough).
   */
  newArticlesBySource: Record<string, number>;
};

function toSourceInput(article: NewsArticle): ArticleSourceInput {
  const { source } = article;
  let domain = "";
  try {
    domain = new URL(source.website).hostname;
  } catch {
    domain = "";
  }

  return {
    id: source.id,
    name: source.name,
    domain,
    logo: source.logo ?? null,
    official: source.official,
    country: source.country,
    trustScore: source.trustScore,
    active: true,
  };
}

function toArticleInput(article: NewsArticle): ArticleInput {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    description: article.summary,
    content: article.content ?? null,
    url: article.url,
    discussionUrl: article.discussionUrl ?? null,
    imageUrl: article.image,
    imageSource: article.imageSource || null,
    publishedAt: article.publishedAt,
    language: article.language,
    country: article.country,
    category: article.category,
    author: article.author?.name ?? null,
    tags: article.tags,
    readingTime: article.readingTime,
    trustScore: article.trustScore,
    trendingScore: Math.round(article.trendingScore),
    sourceId: article.source.id,
  };
}

/**
 * Persists the pipeline's final output - sources, articles, and
 * (zeroed, if new) metrics rows. Real writes now, no longer a no-op
 * ("No-op tamamen kaldırılsın").
 *
 * AI enrichment is deliberately NOT written here anymore (production
 * architecture fix - "news-fetch yalnızca haberleri çekip normalize
 * edip Supabase'e yazsın"). It used to be a 4th write here (one combined
 * `article_ai` row per article, built from the pipeline's own inline AI
 * steps), which meant this step - and therefore the whole `news-fetch`
 * job - couldn't finish until every AI capability had also finished for
 * every article. AI enrichment now runs entirely independently, per
 * capability, via `services/ai/ai-enrichment-runner.ts` and the 9 jobs
 * in `runtime/jobs/ai-jobs.ts`, against articles this step has ALREADY
 * persisted (so those jobs work off real `articles.id` values directly -
 * no `idMap` needed on that side).
 *
 * Uses the service-role client (`lib/supabase/service-client.ts`) since
 * this runs outside any user session - Runtime jobs have no cookies/
 * session to act as a signed-in user with, and the Article Storage
 * RLS policies only grant write access to the service role anyway (see
 * `supabase/migrations/0002_article_storage.sql`). If Supabase isn't
 * configured yet (`SUPABASE_SERVICE_ROLE_KEY` unset), this step reports
 * success with zero rows saved rather than failing the pipeline -
 * storage being unconfigured is a normal, safe state, the same
 * convention every other optional integration in this app already
 * follows.
 */
export async function databaseStep(articles: NewsArticle[]): Promise<PipelineStepResult<DatabaseStepData>> {
  return runPipelineStep("database", async () => {
    const supabase = createServiceClient();
    if (!supabase) {
      console.warn("[pipeline:database] SUPABASE_SERVICE_ROLE_KEY not set - skipping persistence (no-op).");
      return { sourcesSaved: 0, articlesSaved: 0, articlesRemapped: 0, metricsEnsured: 0, newArticlesBySource: {} };
    }

    if (articles.length === 0) {
      return { sourcesSaved: 0, articlesSaved: 0, articlesRemapped: 0, metricsEnsured: 0, newArticlesBySource: {} };
    }

    const sourceRepository = createSourceRepository(supabase);
    const articleRepository = createArticleRepository(supabase);
    const metricsRepository = createArticleMetricsRepository(supabase);

    // Sources first - `articles.source_id` has a foreign key to
    // `article_sources.id`, so every source referenced by this batch
    // must already exist before the article upsert runs.
    const uniqueSources = new Map(articles.map((article) => [article.source.id, toSourceInput(article)]));
    await sourceRepository.bulkUpsert([...uniqueSources.values()]);

    const {
      saved: articlesSaved,
      remapped: articlesRemapped,
      idMap,
      newIds,
    } = await articleRepository.bulkUpsert(articles.map(toArticleInput));

    // Resolve every article through `idMap` - a remapped article's row
    // lives under a different id than the pipeline's original
    // `article.id` (see `article-repository.ts`'s `bulkUpsert` doc), and
    // `article_metrics.article_id` has `references articles (id)`. Using
    // the original id here for a remapped article is exactly what
    // produced the `article_metrics_article_id_fkey` violation (23503):
    // this ensured a metrics row against an id that was never actually
    // written to `articles`.
    const articleIds = articles.map((article) => idMap.get(article.id) ?? article.id);
    await metricsRepository.ensureExists(articleIds);

    // Per-source new-article breakdown (see `DatabaseStepData.newArticlesBySource`).
    const newArticlesBySource: Record<string, number> = {};
    articles.forEach((article, index) => {
      if (newIds.has(articleIds[index])) {
        newArticlesBySource[article.source.name] = (newArticlesBySource[article.source.name] ?? 0) + 1;
      }
    });

    return {
      sourcesSaved: uniqueSources.size,
      articlesSaved,
      articlesRemapped,
      metricsEnsured: articleIds.length,
      newArticlesBySource,
    };
  });
}
