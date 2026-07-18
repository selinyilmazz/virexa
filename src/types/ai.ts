/**
 * Shared domain types for Virexa's AI Intelligence layer.
 *
 * Deliberately independent of `src/types/news.ts`: this task's brief is
 * explicit ("Haber motoruna dokunma") that the news engine isn't to be
 * touched, so AI-generated insights are modeled as their own overlay
 * (`AIArticleInsights`, keyed by an article's `id`) rather than new
 * fields bolted onto `NewsArticle`. A future UI layer would look up an
 * article's `AIArticleInsights` alongside its `NewsArticle` the same way
 * it already looks up bookmarks alongside articles - two related but
 * independently-owned pieces of data, not one merged type.
 */

export type AIProviderId = "openai" | "anthropic" | "openrouter";

/** Minimal shape every AI operation needs from an article - callers pass exactly this, nothing more. */
export type ArticleAIInput = {
  id: string;
  title: string;
  content: string;
};

export type SummarizeInput = {
  title: string;
  content: string;
};

export type GenerateTagsInput = {
  title: string;
  content: string;
  category?: string;
};

export type AnalyzeSentimentInput = {
  title: string;
  content: string;
};

export type AnalyzeBiasInput = {
  title: string;
  content: string;
  source?: string;
};

export type AISummaryResult = {
  summary: string;
  generatedAt: string;
  provider: AIProviderId;
  version: string;
};

/** Model for item 4 - "TL;DR": a short title plus 3-5 standalone bullet points. */
export type TLDRResult = {
  title: string;
  bullets: string[];
  generatedAt: string;
  provider: AIProviderId;
  version: string;
};

export type KeyTakeawaysResult = {
  points: string[];
  generatedAt: string;
  provider: AIProviderId;
  version: string;
};

/**
 * The structured, longer-form briefing shown on the article detail page
 * when raw content is too thin to read (product polishing phase, 3rd
 * pass, item 5 - "Overview / Key Points / Technical Details / Why It
 * Matters"). One combined result rather than four separate ones, since
 * a single prompt produces all four sections together.
 */
export type LongSummaryResult = {
  overview: string;
  keyPoints: string[];
  technicalDetails: string;
  whyItMatters: string;
  generatedAt: string;
  provider: AIProviderId;
  version: string;
};

export type AITagResult = {
  tags: string[];
  generatedAt: string;
  provider: AIProviderId;
  version: string;
};

export type SentimentLabel = "Positive" | "Neutral" | "Negative";

export type SentimentResult = {
  label: SentimentLabel;
  /** 0-1 */
  confidence: number;
  generatedAt: string;
  provider: AIProviderId;
  version: string;
};

export type BiasLevel = "Very Low" | "Low" | "Medium" | "High";

export type BiasResult = {
  level: BiasLevel;
  /** 0-1 */
  confidence: number;
  generatedAt: string;
  provider: AIProviderId;
  version: string;
};

/** The subset of article fields `findSimilarArticles` compares - see `lib/ai/similar-articles.ts`. */
export type SimilarArticleCandidate = {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  source: string;
  category: string;
};

export type SimilarArticleMatch = {
  id: string;
  slug: string;
  title: string;
  /** 0-1 relative similarity score, highest first. */
  score: number;
};

export type FindSimilarArticlesInput = {
  article: SimilarArticleCandidate;
  candidates: SimilarArticleCandidate[];
  limit?: number;
};

/**
 * The AI-owned enrichment record for one article. `contentHash` is what
 * cache invalidation keys off of (see `lib/ai/ai-cache.ts`) - if an
 * article's title/content changes, its hash changes, and every field
 * below is regenerated on next request rather than served stale.
 */
export type AIArticleInsights = {
  articleId: string;
  contentHash: string;
  summary?: AISummaryResult;
  tldr?: TLDRResult;
  keyTakeaways?: KeyTakeawaysResult;
  longSummary?: LongSummaryResult;
  tags?: AITagResult;
  sentiment?: SentimentResult;
  bias?: BiasResult;
};
