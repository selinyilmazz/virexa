import { buildArticleContext, JSON_ONLY_INSTRUCTION, type PromptPair } from "@/lib/ai/prompts/shared";
import type { AnalyzeSentimentInput } from "@/types/ai";

export const SENTIMENT_PROMPT_VERSION = "sentiment-v1";

/** Produces the `{ label, confidence }` shape from task item 7. */
export function buildSentimentPrompt(input: AnalyzeSentimentInput): PromptPair {
  return {
    system:
      "Classify the overall sentiment/tone of this news article's writing as Positive, Neutral, or Negative, " +
      "and how confident you are in that classification from 0 to 1. " +
      `${JSON_ONLY_INSTRUCTION} Respond as JSON: {"label": "Positive" | "Neutral" | "Negative", "confidence": number}.`,
    user: buildArticleContext(input),
  };
}
