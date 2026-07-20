import { hashArticleContent } from "@/lib/ai/content-hash";
import { createServiceClient } from "@/lib/supabase/service-client";
import type { ArticleAIInput, ArticleInput, ArticleSourceInput } from "@/lib/validation/article-storage-schema";
import { runPipelineStep } from "@/runtime/pipeline/types";
import type { PipelineStepResult } from "@/runtime/pipeline/types";
import { createArticleAIRepository } from "@/repositories/article-ai-repository";
import { createArticleMetricsRepository } from "@/repositories/article-metrics-repository";
import { createArticleRepository } from "@/repositories/article-repository";
import { createSourceRepository } from "@/repositories/source-repository";
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

export type PipelineAIResults = {
  summaries: Map<string, AISummaryResult>;
  takeaways: Map<string, KeyTakeawaysResult>;
  tldrs: Map<string, TLDRResult>;
  longSummaries: Map<string, LongSummaryResult>;
  rewrites: Map<string, ArticleRewriteResult>;
  entities: Map<string, ArticleEntitiesResult>;
  tags: Map<string, AITagResult>;
  sentiments: Map<string, SentimentResult>;
  biases: Map<string, BiasResult>;
};

export type DatabaseStepData = {
  sourcesSaved: number;
  articlesSaved: number;
  articlesRemapped: number;
  aiRowsSaved: number;
  metricsEnsured: number;
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
 * Builds one combined `article_ai` row per article from the 6 separate
 * AI pipeline steps' results (`pipeline/steps/ai-steps.ts`), keyed by
 * the article's content hash - see `repositories/article-ai-repository.ts`'s
 * doc for why that hash IS the version key. Articles with no AI result
 * at all (no provider configured, or this run's `MAX_AI_ARTICLES_PER_RUN`
 * cap excluded them) are skipped - nothing to persist for them yet.
 *
 * `idMap` (original pipeline article id -> the id actually persisted to
 * `articles.id` by `articleRepository.bulkUpsert`) resolves the emitted
 * `articleId` - `article_ai.article_id` has `references articles (id)`,
 * so a remapped article's AI row must point at the SAME id its article
 * row actually landed under, not the original pre-remap id (see
 * `article-repository.ts`'s `bulkUpsert` doc for the full root-cause
 * explanation - this was the exact class of bug that produced the
 * `article_metrics_article_id_fkey` violation). AI results are still
 * looked up by the original id, since `ai-steps.ts` computed them
 * against the pipeline's in-memory (pre-remap) `NewsArticle` objects.
 */
function toAIInputs(articles: NewsArticle[], results: PipelineAIResults, idMap: Map<string, string>): ArticleAIInput[] {
  const inputs: ArticleAIInput[] = [];

  for (const article of articles) {
    const summary = results.summaries.get(article.id);
    const takeaways = results.takeaways.get(article.id);
    const tldr = results.tldrs.get(article.id);
    const longSummary = results.longSummaries.get(article.id);
    const rewrite = results.rewrites.get(article.id);
    const entities = results.entities.get(article.id);
    const tags = results.tags.get(article.id);
    const sentiment = results.sentiments.get(article.id);
    const bias = results.biases.get(article.id);

    if (!summary && !takeaways && !tldr && !longSummary && !rewrite && !entities && !tags && !sentiment && !bias) continue;

    const provider =
      summary?.provider ??
      takeaways?.provider ??
      tldr?.provider ??
      longSummary?.provider ??
      rewrite?.provider ??
      entities?.provider ??
      tags?.provider ??
      sentiment?.provider ??
      bias?.provider ??
      "unknown";
    const promptVersion =
      summary?.version ??
      takeaways?.version ??
      tldr?.version ??
      longSummary?.version ??
      rewrite?.version ??
      entities?.version ??
      tags?.version ??
      sentiment?.version ??
      bias?.version ??
      "";

    inputs.push({
      articleId: idMap.get(article.id) ?? article.id,
      summary: summary?.summary ?? null,
      tldr: tldr ? { title: tldr.title, bullets: tldr.bullets } : null,
      longSummary: longSummary
        ? {
            overview: longSummary.overview,
            keyPoints: longSummary.keyPoints,
            technicalDetails: longSummary.technicalDetails,
            whyItMatters: longSummary.whyItMatters,
          }
        : null,
      rewrittenArticle: rewrite
        ? {
            intro: rewrite.intro,
            mainContent: rewrite.mainContent,
            background: rewrite.background,
            whyItMatters: rewrite.whyItMatters,
            technicalDetails: rewrite.technicalDetails,
            keyHighlights: rewrite.keyHighlights,
            conclusion: rewrite.conclusion,
            wordCount: rewrite.wordCount,
          }
        : null,
      entities: entities
        ? { companies: entities.companies, technologies: entities.technologies, people: entities.people }
        : null,
      keyTakeaways: takeaways ? { points: takeaways.points } : null,
      tags: tags?.tags ?? [],
      sentiment: sentiment ? { label: sentiment.label, confidence: sentiment.confidence } : null,
      bias: bias ? { level: bias.level, confidence: bias.confidence } : null,
      provider,
      model: "",
      promptVersion,
      cacheKey: hashArticleContent(article.title, article.content ?? article.summary),
    });
  }

  return inputs;
}

/**
 * Persists the pipeline's final output - sources, articles, AI results,
 * and (zeroed, if new) metrics rows. Real writes now, no longer a
 * no-op ("No-op tamamen kaldırılsın").
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
export async function databaseStep(
  articles: NewsArticle[],
  aiResults: PipelineAIResults
): Promise<PipelineStepResult<DatabaseStepData>> {
  return runPipelineStep("database", async () => {
    const supabase = createServiceClient();
    if (!supabase) {
      console.warn("[pipeline:database] SUPABASE_SERVICE_ROLE_KEY not set - skipping persistence (no-op).");
      return { sourcesSaved: 0, articlesSaved: 0, articlesRemapped: 0, aiRowsSaved: 0, metricsEnsured: 0 };
    }

    if (articles.length === 0) {
      return { sourcesSaved: 0, articlesSaved: 0, articlesRemapped: 0, aiRowsSaved: 0, metricsEnsured: 0 };
    }

    const sourceRepository = createSourceRepository(supabase);
    const articleRepository = createArticleRepository(supabase);
    const aiRepository = createArticleAIRepository(supabase);
    const metricsRepository = createArticleMetricsRepository(supabase);

    // Sources first - `articles.source_id` has a foreign key to
    // `article_sources.id`, so every source referenced by this batch
    // must already exist before the article upsert runs.
    const uniqueSources = new Map(articles.map((article) => [article.source.id, toSourceInput(article)]));
    await sourceRepository.bulkUpsert([...uniqueSources.values()]);

    const { saved: articlesSaved, remapped: articlesRemapped, idMap } = await articleRepository.bulkUpsert(
      articles.map(toArticleInput)
    );

    const aiInputs = toAIInputs(articles, aiResults, idMap);
    await aiRepository.bulkUpsert(aiInputs);

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

    return {
      sourcesSaved: uniqueSources.size,
      articlesSaved,
      articlesRemapped,
      aiRowsSaved: aiInputs.length,
      metricsEnsured: articleIds.length,
    };
  });
}
