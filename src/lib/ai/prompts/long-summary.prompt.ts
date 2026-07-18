import { buildArticleContext, JSON_ONLY_INSTRUCTION, type PromptPair } from "@/lib/ai/prompts/shared";
import type { SummarizeInput } from "@/types/ai";

export const LONG_SUMMARY_PROMPT_VERSION = "long-summary-v1";

/**
 * Produces the structured, longer-form briefing used as the article
 * detail page's Priority-2 fallback when the article's raw content is
 * too thin to actually read (product polishing phase, 3rd pass, item 5:
 * "tam içerik alınamıyorsa mevcut kısa açıklamayı göstermeyip çok daha
 * kapsamlı okunabilir özet oluştur"). One JSON call producing all four
 * sections together (rather than four separate prompts) keeps this to a
 * single provider round trip and a single cache entry per article.
 */
export function buildLongSummaryPrompt(input: SummarizeInput): PromptPair {
  return {
    system:
      "You are a news analyst writing a comprehensive briefing for a reader who will likely NOT visit the " +
      "original article. Base everything strictly on the provided article content - never invent facts, " +
      "numbers, or claims not present in it. Produce four sections: " +
      "(1) overview - a 3-4 sentence paragraph summarizing what happened; " +
      "(2) keyPoints - 3-5 concrete, standalone facts, numbers, or decisions a reader should remember; " +
      "(3) technicalDetails - a paragraph on the specific mechanism, technology, data, or process involved " +
      "(if the article has no technical dimension, use this paragraph for additional concrete context or " +
      "background instead of leaving it generic); " +
      "(4) whyItMatters - a paragraph on the real-world significance or implication of this story. " +
      `Plain text only, no markdown. ${JSON_ONLY_INSTRUCTION} Respond as JSON: ` +
      '{"overview": string, "keyPoints": string[], "technicalDetails": string, "whyItMatters": string}.',
    user: buildArticleContext(input),
  };
}
