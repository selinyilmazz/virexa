import { calculateTrendingScore } from "@/lib/news";
import { runPipelineStep } from "@/runtime/pipeline/types";
import type { PipelineStepResult } from "@/runtime/pipeline/types";
import { refreshLiveArticlesCache } from "@/services/news/live-articles";
import type { NewsArticle } from "@/types/news";

/**
 * Trending score and cache refresh steps. The "database" step used to
 * live here as a no-op - it now has a real implementation of its own in
 * `runtime/pipeline/steps/database-step.ts` (see
 * `src/repositories/article-repository.ts` and friends), since Virexa's
 * Article Storage layer exists now.
 */

/**
 * Recomputes each article's trending score (`lib/news/trending-score.ts`
 * - recency/trust/source-weighted, plus `engagementScore` for
 * providers that carry one, e.g. Hacker News points) and sorts
 * hottest-first, so the pipeline's final output reflects trend at the
 * moment the pipeline ran, not just at each article's original fetch
 * time. Passing `article.engagementScore` through here (not just at
 * initial normalization in `NewsAggregator`) keeps that signal alive
 * across every later recomputation - the standalone `trending` job and
 * every full `news-fetch` pipeline run both call this step.
 */
export async function trendingScoreStep(articles: NewsArticle[]): Promise<PipelineStepResult<NewsArticle[]>> {
  return runPipelineStep("trending-score", async () =>
    articles
      .map((article) => ({
        ...article,
        trendingScore: calculateTrendingScore({
          publishedAt: article.publishedAt,
          trustScore: article.trustScore,
          source: article.source,
          signals: article.engagementScore !== undefined ? { engagementScore: article.engagementScore } : undefined,
        }),
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
  );
}

/** Forces the shared live-articles cache (`services/news/live-articles.ts`) to refresh immediately, rather than waiting for its normal stale-while-revalidate trigger on the next page read. */
export async function cacheRefreshStep(): Promise<PipelineStepResult<{ articleCount: number }>> {
  return runPipelineStep("cache-refresh", async () => {
    const articles = await refreshLiveArticlesCache();
    return { articleCount: articles.length };
  });
}
