import { AICache, buildCacheKey, hashArticleContent } from "@/lib/ai";
import { findSimilarArticlesHeuristic } from "@/lib/ai/similar-articles";
import {
  BIAS_PROMPT_VERSION,
  LONG_SUMMARY_PROMPT_VERSION,
  SENTIMENT_PROMPT_VERSION,
  SUMMARY_PROMPT_VERSION,
  TAGS_PROMPT_VERSION,
  TAKEAWAYS_PROMPT_VERSION,
  TLDR_PROMPT_VERSION,
} from "@/lib/ai/prompts";
import type { AIProvider } from "@/services/ai/ai-provider.interface";
import type {
  AISummaryResult,
  AITagResult,
  BiasResult,
  FindSimilarArticlesInput,
  KeyTakeawaysResult,
  LongSummaryResult,
  SentimentResult,
  SimilarArticleMatch,
  TLDRResult,
} from "@/types/ai";

/** The minimal article shape every cached AI operation needs. */
type ArticleAIInput = {
  id: string;
  title: string;
  content: string;
};

/**
 * The single entry point for every AI-backed operation in Virexa
 * ("Tüm AI işlemlerini yöneten merkezi bir servis" / "Hiçbir component
 * doğrudan provider çağırmasın"). Every method here is safe to call
 * regardless of configuration: with no provider configured (no API key
 * for the selected `AI_PROVIDER`), every method resolves to `null`
 * (or, for `findSimilarArticles`, its normal heuristic result, which
 * never needed a provider to begin with) instead of throwing - callers
 * never need a try/catch, and a provider outage never breaks the app
 * ("Provider çökerse uygulama çalışmaya devam etsin").
 *
 * Every provider-backed method is cached via `AICache`, keyed on the
 * article's content hash, the active provider, and the prompt version -
 * see `runCached` below and `lib/ai/ai-cache.ts` for what that buys.
 */
export class AIService {
  constructor(
    private readonly provider: AIProvider | null,
    private readonly cache: AICache
  ) {}

  /** Whether a real provider is configured (has an API key) - useful for a future UI to know whether to even offer AI features. */
  get isConfigured(): boolean {
    return this.provider !== null;
  }

  private async runCached<T>(
    task: string,
    articleId: string,
    contentHash: string,
    providerId: string,
    version: string,
    fn: () => Promise<T>
  ): Promise<T | null> {
    const cacheKey = buildCacheKey(task, articleId, contentHash, providerId, version);
    const cached = this.cache.get<T>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const result = await fn();
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`[AIService] "${task}" failed:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async getSummary(article: ArticleAIInput): Promise<AISummaryResult | null> {
    const provider = this.provider;
    if (!provider) return null;

    const contentHash = hashArticleContent(article.title, article.content);
    return this.runCached("summary", article.id, contentHash, provider.id, SUMMARY_PROMPT_VERSION, async () => ({
      summary: await provider.summarize({ title: article.title, content: article.content }),
      generatedAt: new Date().toISOString(),
      provider: provider.id,
      version: SUMMARY_PROMPT_VERSION,
    }));
  }

  async getTLDR(article: ArticleAIInput): Promise<TLDRResult | null> {
    const provider = this.provider;
    if (!provider) return null;

    const contentHash = hashArticleContent(article.title, article.content);
    return this.runCached("tldr", article.id, contentHash, provider.id, TLDR_PROMPT_VERSION, async () => {
      const { title, bullets } = await provider.generateTLDR({ title: article.title, content: article.content });
      return {
        title,
        bullets,
        generatedAt: new Date().toISOString(),
        provider: provider.id,
        version: TLDR_PROMPT_VERSION,
      };
    });
  }

  async getKeyTakeaways(article: ArticleAIInput): Promise<KeyTakeawaysResult | null> {
    const provider = this.provider;
    if (!provider) return null;

    const contentHash = hashArticleContent(article.title, article.content);
    return this.runCached("takeaways", article.id, contentHash, provider.id, TAKEAWAYS_PROMPT_VERSION, async () => ({
      points: await provider.generateKeyTakeaways({ title: article.title, content: article.content }),
      generatedAt: new Date().toISOString(),
      provider: provider.id,
      version: TAKEAWAYS_PROMPT_VERSION,
    }));
  }

  /**
   * The structured "Overview / Key Points / Technical Details / Why It
   * Matters" briefing - `article-read-service.ts`'s article detail
   * fallback for articles whose real content is too thin to read.
   */
  async getLongSummary(article: ArticleAIInput): Promise<LongSummaryResult | null> {
    const provider = this.provider;
    if (!provider) return null;

    const contentHash = hashArticleContent(article.title, article.content);
    return this.runCached("long-summary", article.id, contentHash, provider.id, LONG_SUMMARY_PROMPT_VERSION, async () => {
      const { overview, keyPoints, technicalDetails, whyItMatters } = await provider.generateLongSummary({
        title: article.title,
        content: article.content,
      });
      return {
        overview,
        keyPoints,
        technicalDetails,
        whyItMatters,
        generatedAt: new Date().toISOString(),
        provider: provider.id,
        version: LONG_SUMMARY_PROMPT_VERSION,
      };
    });
  }

  async getTags(article: ArticleAIInput & { category?: string }): Promise<AITagResult | null> {
    const provider = this.provider;
    if (!provider) return null;

    const contentHash = hashArticleContent(article.title, article.content);
    return this.runCached("tags", article.id, contentHash, provider.id, TAGS_PROMPT_VERSION, async () => ({
      tags: await provider.generateTags({
        title: article.title,
        content: article.content,
        category: article.category,
      }),
      generatedAt: new Date().toISOString(),
      provider: provider.id,
      version: TAGS_PROMPT_VERSION,
    }));
  }

  async getSentiment(article: ArticleAIInput): Promise<SentimentResult | null> {
    const provider = this.provider;
    if (!provider) return null;

    const contentHash = hashArticleContent(article.title, article.content);
    return this.runCached("sentiment", article.id, contentHash, provider.id, SENTIMENT_PROMPT_VERSION, async () => {
      const { label, confidence } = await provider.analyzeSentiment({
        title: article.title,
        content: article.content,
      });
      return {
        label,
        confidence,
        generatedAt: new Date().toISOString(),
        provider: provider.id,
        version: SENTIMENT_PROMPT_VERSION,
      };
    });
  }

  async getBias(article: ArticleAIInput & { source?: string }): Promise<BiasResult | null> {
    const provider = this.provider;
    if (!provider) return null;

    const contentHash = hashArticleContent(article.title, article.content);
    return this.runCached("bias", article.id, contentHash, provider.id, BIAS_PROMPT_VERSION, async () => {
      const { level, confidence } = await provider.analyzeBias({
        title: article.title,
        content: article.content,
        source: article.source,
      });
      return {
        level,
        confidence,
        generatedAt: new Date().toISOString(),
        provider: provider.id,
        version: BIAS_PROMPT_VERSION,
      };
    });
  }

  /**
   * Purely algorithmic (see `lib/ai/similar-articles.ts`) - doesn't call
   * a provider, doesn't need caching, and works identically whether or
   * not an AI provider is configured.
   */
  findSimilarArticles(input: FindSimilarArticlesInput): SimilarArticleMatch[] {
    return findSimilarArticlesHeuristic(input.article, input.candidates, input.limit);
  }
}
