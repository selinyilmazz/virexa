import type {
  AIProviderId,
  AnalyzeBiasInput,
  AnalyzeSentimentInput,
  BiasLevel,
  GenerateTagsInput,
  SentimentLabel,
  SummarizeInput,
} from "@/types/ai";

/**
 * Contract every AI provider must implement. `AIService` only ever
 * talks to this interface - it never knows or cares whether an
 * implementation calls OpenAI, Anthropic, OpenRouter, or anything else.
 *
 * Adding a new provider means writing one class that implements this
 * interface (see `providers/base-ai-provider.ts` for the shared plumbing
 * every implementation gets for free) and wiring it into
 * `ai-provider-instance.ts` - nothing else in the app needs to change
 * ("Provider seçimi sadece configuration üzerinden değiştirilebilsin").
 *
 * `findSimilarArticles` is intentionally NOT part of this interface -
 * see `lib/ai/similar-articles.ts`: today it's a heuristic that doesn't
 * call a model at all, so it isn't a "provider operation" yet. The
 * natural place for a provider-backed version (via embeddings) would be
 * a future `embed(text: string): Promise<number[]>` method here.
 */
export interface AIProvider {
  readonly id: AIProviderId;
  readonly name: string;

  /** 2-3 sentence factual summary. */
  summarize(input: SummarizeInput): Promise<string>;

  /** Short title + 3-5 bullet points ("TL;DR"). */
  generateTLDR(input: SummarizeInput): Promise<{ title: string; bullets: string[] }>;

  /** 3-5 concrete, standalone key takeaways. */
  generateKeyTakeaways(input: SummarizeInput): Promise<string[]>;

  /** Structured 4-section briefing (overview/keyPoints/technicalDetails/whyItMatters) - the article detail page's thin-content fallback. */
  generateLongSummary(input: SummarizeInput): Promise<{
    overview: string;
    keyPoints: string[];
    technicalDetails: string;
    whyItMatters: string;
  }>;

  /** 3-6 short topical tags. */
  generateTags(input: GenerateTagsInput): Promise<string[]>;

  analyzeSentiment(input: AnalyzeSentimentInput): Promise<{ label: SentimentLabel; confidence: number }>;

  analyzeBias(input: AnalyzeBiasInput): Promise<{ level: BiasLevel; confidence: number }>;
}
