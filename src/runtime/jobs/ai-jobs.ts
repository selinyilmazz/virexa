import { aiSummaryStep, biasStep, sentimentStep, tagsStep } from "@/runtime/pipeline/steps/ai-steps";
import type { JobDefinition } from "@/runtime/types";
import { getLiveArticlesSync } from "@/services/news";

/**
 * AI enrichment jobs. Each operates on the current live-articles cache
 * and delegates to the matching pipeline step (`runtime/pipeline/steps/ai-steps.ts`),
 * which itself delegates to `aiService` - so these jobs inherit the AI
 * layer's existing safety guarantees (no provider configured -> safe
 * no-op, hash-based cache skips unchanged articles) with no duplicated
 * logic.
 */

export const aiSummaryJob: JobDefinition = {
  type: "ai-summary",
  description: "Generates/refreshes AI summaries for the current live-articles cache.",
  run: async () => {
    const result = await aiSummaryStep(getLiveArticlesSync());
    if (!result.success) throw new Error(result.error ?? "AI summary step failed");
    return { processed: result.itemCount ?? 0 };
  },
};

export const aiTagJob: JobDefinition = {
  type: "ai-tag",
  description: "Generates/refreshes AI tags for the current live-articles cache.",
  run: async () => {
    const result = await tagsStep(getLiveArticlesSync());
    if (!result.success) throw new Error(result.error ?? "AI tag step failed");
    return { processed: result.itemCount ?? 0 };
  },
};

export const sentimentJob: JobDefinition = {
  type: "sentiment",
  description: "Runs sentiment analysis for the current live-articles cache.",
  run: async () => {
    const result = await sentimentStep(getLiveArticlesSync());
    if (!result.success) throw new Error(result.error ?? "Sentiment step failed");
    return { processed: result.itemCount ?? 0 };
  },
};

export const biasAnalysisJob: JobDefinition = {
  type: "bias-analysis",
  description: "Runs bias analysis for the current live-articles cache.",
  run: async () => {
    const result = await biasStep(getLiveArticlesSync());
    if (!result.success) throw new Error(result.error ?? "Bias analysis step failed");
    return { processed: result.itemCount ?? 0 };
  },
};
