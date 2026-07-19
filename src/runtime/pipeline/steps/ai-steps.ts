import { MIN_ACCEPTABLE_CONTENT_LENGTH } from "@/lib/news";
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
 * Two cost tiers (product polishing phase, 5th pass - "AI yeniden
 * yazımını yalnızca ilk 20 haberle sınırlama; bunun yerine en azından
 * her haber için AI Summary + Key Takeaways üret. Trend haberler için
 * ise ... rewritten_article oluştur"):
 *
 *  - BROAD (`MAX_BROAD_AI_ARTICLES_PER_RUN`, `articlesForBroadAI`) -
 *    every article a normal run touches gets Summary + Key Takeaways,
 *    the two capabilities cheap enough (short prompts, small outputs)
 *    to run at this scale. Matches `news-aggregator.ts`'s
 *    `MAX_CONTENT_EXTRACTIONS_PER_RUN` (also 60) for consistency - "her
 *    haber" in practice means every article a run's own size already
 *    bounds, not a literal unbounded loop.
 *  - NARROW (`MAX_AI_ARTICLES_PER_RUN`, `articlesForAI`) - TL;DR,
 *    Tags, Sentiment, Bias, and Entities stay at the smaller, original
 *    per-run cap; these are either heavier or lower-priority than the
 *    broad tier's two capabilities.
 *
 * `articleRewriteStep` uses neither of the above - it has its own
 * `articlesForTrendingRewrite` selection (trending-score-sorted, same
 * narrow cap) since the full rewrite is explicitly a "trend haberler"
 * capability, not a broad or plain-run-order one.
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

/** Selects the top `MAX_AI_ARTICLES_PER_RUN` articles by `trendingScore` - `articleRewriteStep`'s own selection, distinct from `articlesForAI`'s plain top-N-of-whatever-order-it-arrived-in, since the full rewrite is explicitly meant for "trend haberler", not just this run's first N articles. */
function articlesForTrendingRewrite(articles: NewsArticle[]): NewsArticle[] {
  return [...articles].sort((a, b) => b.trendingScore - a.trendingScore).slice(0, MAX_AI_ARTICLES_PER_RUN);
}

function articleContent(article: NewsArticle): string {
  return article.content ?? article.summary;
}

/**
 * A separate, content-thinness-based selection (rather than
 * `articlesForAI`'s plain top-N-of-the-run cap) - the structured long
 * summary is only useful as a fallback for articles whose real content
 * is too short to read (`article-read-service.ts`'s
 * `MIN_ACCEPTABLE_CONTENT_LENGTH` bar, same one `fetchArticleContent`
 * enforces at ingestion time), so generating it for an already-thick
 * article would just waste provider budget on a result nothing will
 * ever render. Still capped at `MAX_AI_ARTICLES_PER_RUN` for the same
 * per-run cost predictability the other narrow-tier steps have.
 */
function articlesNeedingLongSummary(articles: NewsArticle[]): NewsArticle[] {
  return articles.filter((article) => articleContent(article).trim().length < MIN_ACCEPTABLE_CONTENT_LENGTH).slice(0, MAX_AI_ARTICLES_PER_RUN);
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

export async function longSummaryStep(articles: NewsArticle[]): Promise<PipelineStepResult<Map<string, LongSummaryResult>>> {
  return runPipelineStep("long-summary", async () => {
    const results = new Map<string, LongSummaryResult>();
    for (const article of articlesNeedingLongSummary(articles)) {
      const result = await aiService.getLongSummary({ id: article.id, title: article.title, content: articleContent(article) });
      if (result) results.set(article.id, result);
    }
    return results;
  });
}

/**
 * The full article-rewrite capability (product polishing phase, 4th
 * pass, items 6-7; narrowed to explicitly trending articles in the 5th
 * pass - "Trend haberler için ise 700-1500 kelimelik rewritten_article
 * oluştur"). Unlike `longSummaryStep`, this is NOT restricted to
 * thin-content articles - the rewrite is the article detail page's
 * PRIMARY reading content whenever it exists (see
 * `article-read-service.ts`'s content precedence) - but unlike the
 * broad tier's Summary/Key Takeaways, it's deliberately kept to a
 * trending-score-sorted top-N (`articlesForTrendingRewrite`), not every
 * article: it's the single most expensive capability here (long prompt,
 * long generation), so it's reserved for the stories actually worth
 * that cost.
 */
export async function articleRewriteStep(
  articles: NewsArticle[]
): Promise<PipelineStepResult<Map<string, ArticleRewriteResult>>> {
  return runPipelineStep("article-rewrite", async () => {
    const results = new Map<string, ArticleRewriteResult>();
    for (const article of articlesForTrendingRewrite(articles)) {
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
