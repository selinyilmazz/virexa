import {
  aiSummaryStep,
  articleRewriteStep,
  biasStep,
  entitiesStep,
  keyTakeawaysStep,
  longSummaryStep,
  sentimentStep,
  tagsStep,
  tldrStep,
} from "@/runtime/pipeline/steps/ai-steps";
import { databaseStep } from "@/runtime/pipeline/steps/database-step";
import {
  duplicateDetectionStep,
  fetchGNewsStep,
  fetchHnStep,
  fetchNewsApiStep,
  fetchRssStep,
  normalizeStep,
  trustScoreStep,
} from "@/runtime/pipeline/steps/fetch-steps";
import { cacheRefreshStep, trendingScoreStep } from "@/runtime/pipeline/steps/finalize-steps";
import type { PipelineStepResult } from "@/runtime/pipeline/types";
import type { NewsArticle } from "@/types/news";

export type NewsPipelineResult = {
  steps: PipelineStepResult<unknown>[];
  articles: NewsArticle[];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
};

/**
 * Runs the full news-processing pipeline in the exact order requested:
 * RSS -> NewsAPI -> GNews -> Hacker News -> Normalize -> Duplicate
 * Detection -> Trust Score -> AI Summary -> Key Takeaways -> TLDR ->
 * Long Summary -> Article Rewrite -> Entities -> Tags -> Sentiment ->
 * Bias -> Trending Score -> Database -> Cache Refresh.
 *
 * Every step is independently callable (see `pipeline/steps/*`) and
 * never throws - each returns a `PipelineStepResult` with its own
 * success/failure, so one step failing (GNews's key isn't set, Hacker
 * News's API is briefly unreachable, an AI provider times out, Supabase
 * isn't configured yet, ...) never stops the rest of the pipeline from
 * running. This function itself therefore never rejects either - job
 * wrappers (`runtime/jobs/*`) decide what "the job failed" means from
 * the returned `steps` array.
 */
export async function runNewsPipeline(): Promise<NewsPipelineResult> {
  const startedAt = new Date().toISOString();
  const startedAtMs = Date.now();
  const steps: PipelineStepResult<unknown>[] = [];

  const rss = await fetchRssStep();
  steps.push(rss);
  const newsApi = await fetchNewsApiStep();
  steps.push(newsApi);
  const gNews = await fetchGNewsStep();
  steps.push(gNews);
  const hn = await fetchHnStep();
  steps.push(hn);

  const normalized = await normalizeStep([rss.data ?? [], newsApi.data ?? [], gNews.data ?? [], hn.data ?? []]);
  steps.push(normalized);

  const deduped = await duplicateDetectionStep(normalized.data ?? []);
  steps.push(deduped);

  const trusted = await trustScoreStep(deduped.data ?? []);
  steps.push(trusted);

  const articles = trusted.data ?? [];

  const summaries = await aiSummaryStep(articles);
  steps.push(summaries);
  const takeaways = await keyTakeawaysStep(articles);
  steps.push(takeaways);
  const tldrs = await tldrStep(articles);
  steps.push(tldrs);
  const longSummaries = await longSummaryStep(articles);
  steps.push(longSummaries);
  const rewrites = await articleRewriteStep(articles);
  steps.push(rewrites);
  const entities = await entitiesStep(articles);
  steps.push(entities);
  const tags = await tagsStep(articles);
  steps.push(tags);
  const sentiments = await sentimentStep(articles);
  steps.push(sentiments);
  const biases = await biasStep(articles);
  steps.push(biases);

  const trending = await trendingScoreStep(articles);
  steps.push(trending);

  const finalArticles = trending.data ?? articles;

  const database = await databaseStep(finalArticles, {
    summaries: summaries.data ?? new Map(),
    takeaways: takeaways.data ?? new Map(),
    tldrs: tldrs.data ?? new Map(),
    longSummaries: longSummaries.data ?? new Map(),
    rewrites: rewrites.data ?? new Map(),
    entities: entities.data ?? new Map(),
    tags: tags.data ?? new Map(),
    sentiments: sentiments.data ?? new Map(),
    biases: biases.data ?? new Map(),
  });
  steps.push(database);

  steps.push(await cacheRefreshStep());

  const finishedAt = new Date().toISOString();

  return {
    steps,
    articles: finalArticles,
    startedAt,
    finishedAt,
    durationMs: Date.now() - startedAtMs,
  };
}
