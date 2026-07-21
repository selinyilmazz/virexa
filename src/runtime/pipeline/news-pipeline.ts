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
 * Runs the news INGESTION pipeline: RSS -> NewsAPI -> GNews -> Hacker
 * News -> Normalize -> Duplicate Detection -> Trust Score -> Trending
 * Score -> Database -> Cache Refresh.
 *
 * AI enrichment (Summary/TL;DR/Key Takeaways/Long Summary/Rewrite/
 * Entities/Tags/Sentiment/Bias) deliberately does NOT run here anymore
 * (production architecture fix - "news-fetch yalnızca haberleri çekip
 * normalize edip Supabase'e yazsın; AI enrichment ayrı queue/job olarak
 * çalışsın"). It used to run inline, sequentially, right here - up to 60
 * articles x 9 capabilities, one `await` after another - which is what
 * actually caused `news-fetch` to hang past Vercel's 300s `maxDuration`
 * with nothing but "provider timeout" in the logs (worst case ~5100s of
 * AI calls inside one serverless invocation that also had to fetch and
 * persist articles). AI enrichment now lives entirely in
 * `services/ai/ai-enrichment-runner.ts`, run by 9 independent jobs
 * (`runtime/jobs/ai-jobs.ts`) each operating on already-persisted
 * articles with a small bounded batch and controlled concurrency - see
 * that file's doc comment for the full picture.
 *
 * This split alone is most of why `news-fetch` is fast and safe now: it
 * only ever does network fetches + normalization + a handful of Supabase
 * writes, none of which depend on AI provider latency.
 *
 * Every step is independently callable (see `pipeline/steps/*`) and
 * never throws - each returns a `PipelineStepResult` with its own
 * success/failure, so one step failing (GNews's key isn't set, Hacker
 * News's API is briefly unreachable, Supabase isn't configured yet, ...)
 * never stops the rest of the pipeline from running. This function
 * itself therefore never rejects either - job wrappers (`runtime/jobs/*`)
 * decide what "the job failed" means from the returned `steps` array.
 */
export async function runNewsPipeline(): Promise<NewsPipelineResult> {
  const startedAt = new Date().toISOString();
  const startedAtMs = Date.now();
  const steps: PipelineStepResult<unknown>[] = [];

  console.log("[news-fetch] Step 1: RSS/NewsAPI/GNews/HN fetch started");

  // Production root-cause fix ("news-fetch" timing out after 30s): these
  // four fetch steps are fully independent - each builds its own scoped
  // `NewsAggregator` around exactly one provider (see fetch-steps.ts's
  // doc comment) - but used to run sequentially, one full RSS/NewsAPI/
  // GNews/HN fetch-plus-image-plus-content-resolution pass after
  // another. Running them in parallel turns the total wait into the
  // slowest ONE of the four instead of the sum of all four, which alone
  // accounted for most of the pipeline's excess runtime.
  const [rss, newsApi, gNews, hn] = await Promise.all([
    fetchRssStep(),
    fetchNewsApiStep(),
    fetchGNewsStep(),
    fetchHnStep(),
  ]);
  steps.push(rss, newsApi, gNews, hn);
  console.log(
    `[news-fetch] Step 1 complete (rss=${rss.success ? "ok" : "FAILED"}, newsApi=${newsApi.success ? "ok" : "FAILED"}, gNews=${gNews.success ? "ok" : "FAILED"}, hn=${hn.success ? "ok" : "FAILED"})`
  );

  const normalized = await normalizeStep([rss.data ?? [], newsApi.data ?? [], gNews.data ?? [], hn.data ?? []]);
  steps.push(normalized);

  const deduped = await duplicateDetectionStep(normalized.data ?? []);
  steps.push(deduped);

  const trusted = await trustScoreStep(deduped.data ?? []);
  steps.push(trusted);

  const articles = trusted.data ?? [];

  const trending = await trendingScoreStep(articles);
  steps.push(trending);

  const finalArticles = trending.data ?? articles;

  console.log(`[news-fetch] Step 2: Persisting articles started (${finalArticles.length} article(s))`);
  const database = await databaseStep(finalArticles);
  steps.push(database);
  console.log(`[news-fetch] Step 2 complete (success=${database.success})`);

  steps.push(await cacheRefreshStep());

  console.log("[news-fetch] Finished");

  const finishedAt = new Date().toISOString();

  return {
    steps,
    articles: finalArticles,
    startedAt,
    finishedAt,
    durationMs: Date.now() - startedAtMs,
  };
}
