import { env } from "@/lib/env";
import { dedupeArticles } from "@/lib/news";
import { runPipelineStep } from "@/runtime/pipeline/types";
import type { PipelineStepResult } from "@/runtime/pipeline/types";
import { GNewsProvider, HackerNewsProvider, NewsAggregator, NewsAPIProvider, RSSProvider } from "@/services/news";
import type { NewsArticle } from "@/types/news";

/**
 * RSS / NewsAPI / GNews / Hacker News fetch steps, each independently
 * callable ("Her adım bağımsız bir servis olmalı"). Every step builds
 * its OWN scoped `NewsAggregator` around exactly one provider, reusing
 * `NewsAggregator`'s existing constructor (it already accepts an
 * arbitrary provider array) instead of touching
 * `services/news/news-aggregator.ts` — the shared aggregator instance
 * used by the rest of the app (`services/news/aggregator-instance.ts`)
 * is untouched.
 *
 * Because normalization (source resolution, category mapping, slug/id,
 * `sourceLogo`/`readingTime`/`trustScore`) happens inside
 * `NewsAggregator.fetchArticles()` itself, each of these four steps
 * already returns fully-normalized `NewsArticle[]` - splitting
 * normalization out any further would mean rewriting that shared
 * method, which this task must not do. The `normalizeStep` below is
 * therefore the pipeline-level unification of these four
 * already-normalized lists into one, not field-level normalization
 * (which already happened per item, per provider).
 */

export async function fetchRssStep(): Promise<PipelineStepResult<NewsArticle[]>> {
  return runPipelineStep("fetch-rss", () => new NewsAggregator([new RSSProvider()]).fetchArticles());
}

export async function fetchNewsApiStep(): Promise<PipelineStepResult<NewsArticle[]>> {
  return runPipelineStep("fetch-newsapi", () =>
    new NewsAggregator([new NewsAPIProvider(env.news.newsApiKey)]).fetchArticles()
  );
}

export async function fetchGNewsStep(): Promise<PipelineStepResult<NewsArticle[]>> {
  return runPipelineStep("fetch-gnews", () =>
    new NewsAggregator([new GNewsProvider(env.news.gNewsApiKey)]).fetchArticles()
  );
}

/** Hacker News needs no API key (same as RSS) - always attempted, never conditionally skipped. */
export async function fetchHnStep(): Promise<PipelineStepResult<NewsArticle[]>> {
  return runPipelineStep("fetch-hn", () => new NewsAggregator([new HackerNewsProvider()]).fetchArticles());
}

/** Unifies the four (already-normalized) provider batches into one combined list - see module doc above for why this isn't field-level normalization. */
export async function normalizeStep(batches: NewsArticle[][]): Promise<PipelineStepResult<NewsArticle[]>> {
  return runPipelineStep("normalize", async () => batches.flat());
}

/** Real cross-provider dedupe: RSS/NewsAPI/GNews/Hacker News frequently carry the same story (HN especially, since it links out to the same tech press this app already ingests directly), so merging them makes this step meaningful (not just an audit) - uses the same `dedupeArticles` the main aggregator uses (`lib/news/duplicate-detector.ts`), best-trust-score copy kept. */
export async function duplicateDetectionStep(articles: NewsArticle[]): Promise<PipelineStepResult<NewsArticle[]>> {
  return runPipelineStep("duplicate-detection", async () => {
    const bestFirst = [...articles].sort((a, b) => b.trustScore - a.trustScore);
    return dedupeArticles(bestFirst);
  });
}

/** Trust score itself is computed per-article at normalization time (`lib/news/trust-score.ts`, already applied inside each fetch-* step above); this step re-affirms it at the pipeline level by sorting the merged, deduped list best-trust-first. */
export async function trustScoreStep(articles: NewsArticle[]): Promise<PipelineStepResult<NewsArticle[]>> {
  return runPipelineStep("trust-score", async () => [...articles].sort((a, b) => b.trustScore - a.trustScore));
}
