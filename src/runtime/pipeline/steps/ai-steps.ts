import { MIN_ACCEPTABLE_CONTENT_LENGTH } from "@/lib/news";
import { runPipelineStep } from "@/runtime/pipeline/types";
import type { PipelineStepResult } from "@/runtime/pipeline/types";
import { aiService } from "@/services/ai";
import type { AISummaryResult, AITagResult, BiasResult, LongSummaryResult, SentimentResult, TLDRResult } from "@/types/ai";
import type { NewsArticle } from "@/types/news";

/**
 * AI enrichment steps (Summary, TL;DR, Tags, Sentiment, Bias). Every
 * step delegates to the existing `aiService` singleton (see
 * `services/ai/ai-service-instance.ts`) - this file does not talk to a
 * provider directly, doesn't duplicate any AI logic, and inherits the
 * AI layer's existing safety guarantees for free: `aiService` methods
 * already resolve to `null` (never throw) when no provider is
 * configured, and already skip regeneration via `AICache` when an
 * article's content hash + provider + prompt version haven't changed.
 *
 * Caps how many articles a single run enriches, so a 15-minute AI
 * pipeline tick has predictable provider cost/rate-limit usage. The
 * list this receives is already trust/trending-sorted by the time it
 * reaches these steps, so the cap keeps the highest-value articles.
 * Safe to raise later once real usage/cost data exists.
 */
const MAX_AI_ARTICLES_PER_RUN = 20;

function articlesForAI(articles: NewsArticle[]): NewsArticle[] {
  return articles.slice(0, MAX_AI_ARTICLES_PER_RUN);
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
 * per-run cost predictability the other steps have.
 */
function articlesNeedingLongSummary(articles: NewsArticle[]): NewsArticle[] {
  return articles.filter((article) => articleContent(article).trim().length < MIN_ACCEPTABLE_CONTENT_LENGTH).slice(0, MAX_AI_ARTICLES_PER_RUN);
}

export async function aiSummaryStep(articles: NewsArticle[]): Promise<PipelineStepResult<Map<string, AISummaryResult>>> {
  return runPipelineStep("ai-summary", async () => {
    const results = new Map<string, AISummaryResult>();
    for (const article of articlesForAI(articles)) {
      const result = await aiService.getSummary({ id: article.id, title: article.title, content: articleContent(article) });
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
