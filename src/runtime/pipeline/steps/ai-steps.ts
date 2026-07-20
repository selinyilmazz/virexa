import { runPipelineStep } from "@/runtime/pipeline/types";
import type { PipelineStepResult } from "@/runtime/pipeline/types";
import { aiService } from "@/services/ai";
import type {
  AISummaryResult,
  AITagResult,
  ArticleEntitiesResult,
  ArticleRewriteResult,
  BiasResult,
  KeyTakeawaysResult,
  LongSummaryResult,
  SentimentResult,
  TLDRResult,
} from "@/types/ai";
import type { NewsArticle } from "@/types/news";

/**
 * AI enrichment steps (Summary, Key Takeaways, TL;DR, Long Summary,
 * Article Rewrite, Entities, Tags, Sentiment, Bias). Every step
 * delegates to the existing `aiService` singleton (see
 * `services/ai/ai-service-instance.ts`) - this file does not talk to a
 * provider directly, doesn't duplicate any AI logic, and inherits the
 * AI layer's existing safety guarantees for free: `aiService` methods
 * already resolve to `null` (never throw) when no provider is
 * configured, and already skip regeneration via `AICache` when an
 * article's content hash + provider + prompt version haven't changed.
 *
 * Two cost tiers (product polishing phase, 5th + 6th pass - "Her haber
 * için: Summary, Long Summary, Key Takeaways üretilsin"; automated-
 * rewrite phase - "her future article... rewritten automatically"):
 *
 *  - BROAD (`MAX_BROAD_AI_ARTICLES_PER_RUN`, `articlesForBroadAI`) -
 *    every article a normal run touches gets Summary + Key Takeaways +
 *    Long Summary + the full Article Rewrite, the capabilities cheap
 *    enough (bounded outputs, one call per article) to run at this
 *    scale. Matches `news-aggregator.ts`'s `MAX_CONTENT_EXTRACTIONS_PER_RUN`
 *    (also 60) for consistency - "her haber"/"every article" in practice
 *    means every article a run's own size already bounds, not a literal
 *    unbounded loop. `articleRewriteStep` moved onto this tier
 *    (previously its own narrow, trending-only `articlesForTrendingRewrite`
 *    selection - see git history) once the rewrite became a
 *    for-every-article requirement rather than a "trend haberler"-only
 *    one.
 *  - NARROW (`MAX_AI_ARTICLES_PER_RUN`, `articlesForAI`) - TL;DR,
 *    Tags, Sentiment, Bias, and Entities stay at the smaller, original
 *    per-run cap; these are either heavier or lower-priority than the
 *    broad tier's four capabilities.
 */
const MAX_AI_ARTICLES_PER_RUN = 20;

/** See this module's doc comment - the broad tier's per-run cap, shared with `news-aggregator.ts`'s content-extraction budget. */
const MAX_BROAD_AI_ARTICLES_PER_RUN = 60;

function articlesForAI(articles: NewsArticle[]): NewsArticle[] {
  return articles.slice(0, MAX_AI_ARTICLES_PER_RUN);
}

function articlesForBroadAI(articles: NewsArticle[]): NewsArticle[] {
  return articles.slice(0, MAX_BROAD_AI_ARTICLES_PER_RUN);
}

function articleContent(article: NewsArticle): string {
  return article.content ?? article.summary;
}

/** Broad tier (product polishing phase, 5th pass) - "en azından her haber için AI Summary ... üret". */
export async function aiSummaryStep(articles: NewsArticle[]): Promise<PipelineStepResult<Map<string, AISummaryResult>>> {
  return runPipelineStep("ai-summary", async () => {
    const results = new Map<string, AISummaryResult>();
    for (const article of articlesForBroadAI(articles)) {
      const result = await aiService.getSummary({ id: article.id, title: article.title, content: articleContent(article) });
      if (result) results.set(article.id, result);
    }
    return results;
  });
}

/** Broad tier (product polishing phase, 5th pass) - "en azından her haber için ... Key Takeaways üret". Wires the long-existing `aiService.getKeyTakeaways` into the pipeline for the first time. */
export async function keyTakeawaysStep(articles: NewsArticle[]): Promise<PipelineStepResult<Map<string, KeyTakeawaysResult>>> {
  return runPipelineStep("key-takeaways", async () => {
    const results = new Map<string, KeyTakeawaysResult>();
    for (const article of articlesForBroadAI(articles)) {
      const result = await aiService.getKeyTakeaways({ id: article.id, title: article.title, content: articleContent(article) });
      if (result) results.set(article.id, result);
    }
    return results;
  });
}

export async function tldrStep(articles: NewsArticle[]): Promise<PipelineStepResult<Map<string, TLDRResult>>> {
  return runPipelineStep("tldr", async () => {
    const results = new Map<string, TLDRResult>();
    for (const article of articlesForAI(articles)) {
      const result = await aiService.getTLDR({ id: article.id, title: article.title, content: articleContent(article) });
      if (result) results.set(article.id, result);
    }
    return results;
  });
}

/** Broad tier (product polishing phase, 6th pass) - "en azından her haber için ... Long Summary üret". Previously narrow and content-thinness-gated (see this module's doc comment) - now runs for every article the broad tier touches, the same way `aiSummaryStep`/`keyTakeawaysStep` already did. */
export async function longSummaryStep(articles: NewsArticle[]): Promise<PipelineStepResult<Map<string, LongSummaryResult>>> {
  return runPipelineStep("long-summary", async () => {
    const results = new Map<string, LongSummaryResult>();
    for (const article of articlesForBroadAI(articles)) {
      const result = await aiService.getLongSummary({ id: article.id, title: article.title, content: articleContent(article) });
      if (result) results.set(article.id, result);
    }
    return results;
  });
}

/**
 * The full article-rewrite capability (product polishing phase, 4th
 * pass, items 6-7; broadened to every article in the automated-rewrite
 * phase - "every future article processed by the pipeline is rewritten
 * automatically before it is displayed"). Now on the BROAD tier
 * (`articlesForBroadAI`, same as `aiSummaryStep`/`keyTakeawaysStep`/
 * `longSummaryStep`), not a trending-only narrow selection - the
 * rewrite is the article detail page's PRIMARY reading content whenever
 * it exists (see `article-read-service.ts`'s content precedence), so
 * every article a run touches should get one, not just the top-N
 * trending stories. Strict grounding is enforced entirely in the
 * prompt itself (`lib/ai/prompts/article-rewrite.prompt.ts`) - never
 * invents facts/quotes/numbers, omits what the source doesn't cover,
 * and doesn't pad an already-detailed source past what it supports.
 */
export async function articleRewriteStep(
  articles: NewsArticle[]
): Promise<PipelineStepResult<Map<string, ArticleRewriteResult>>> {
  return runPipelineStep("article-rewrite", async () => {
    const results = new Map<string, ArticleRewriteResult>();
    for (const article of articlesForBroadAI(articles)) {
      const result = await aiService.getArticleRewrite({
        id: article.id,
        title: article.title,
        content: articleContent(article),
        source: article.source.name,
      });
      if (result) results.set(article.id, result);
    }
    return results;
  });
}

export async function entitiesStep(articles: NewsArticle[]): Promise<PipelineStepResult<Map<string, ArticleEntitiesResult>>> {
  return runPipelineStep("entities", async () => {
    const results = new Map<string, ArticleEntitiesResult>();
    for (const article of articlesForAI(articles)) {
      const result = await aiService.getEntities({ id: article.id, title: article.title, content: articleContent(article) });
      if (result) results.set(article.id, result);
    }
    return results;
  });
}

export async function tagsStep(articles: NewsArticle[]): Promise<PipelineStepResult<Map<string, AITagResult>>> {
  return runPipelineStep("tags", async () => {
    const results = new Map<string, AITagResult>();
    for (const article of articlesForAI(articles)) {
      const result = await aiService.getTags({
        id: article.id,
        title: article.title,
        content: articleContent(article),
        category: article.category,
      });
      if (result) results.set(article.id, result);
    }
    return results;
  });
}

export async function sentimentStep(articles: NewsArticle[]): Promise<PipelineStepResult<Map<string, SentimentResult>>> {
  return runPipelineStep("sentiment", async () => {
    const results = new Map<string, SentimentResult>();
    for (const article of articlesForAI(articles)) {
      const result = await aiService.getSentiment({ id: article.id, title: article.title, content: articleContent(article) });
      if (result) results.set(article.id, result);
    }
    return results;
  });
}

export async function biasStep(articles: NewsArticle[]): Promise<PipelineStepResult<Map<string, BiasResult>>> {
  return runPipelineStep("bias", async () => {
    const results = new Map<string, BiasResult>();
    for (const article of articlesForAI(articles)) {
      const result = await aiService.getBias({
        id: article.id,
        title: article.title,
        content: articleContent(article),
        source: article.source.name,
      });
      if (result) results.set(article.id, result);
    }
    return results;
  });
}
