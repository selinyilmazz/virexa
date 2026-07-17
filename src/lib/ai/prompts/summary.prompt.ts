import { buildArticleContext, type PromptPair } from "@/lib/ai/prompts/shared";
import type { SummarizeInput } from "@/types/ai";

/** Bump when the wording below changes meaningfully - see `AICache`, which keys on this. */
export const SUMMARY_PROMPT_VERSION = "summary-v1";

export function buildSummaryPrompt(input: SummarizeInput): PromptPair {
  return {
    system:
      "You are a neutral news editor. Write a concise, factual summary of the article in 2-3 sentences. " +
      "Do not add opinions, speculation, or information not present in the article. Plain text only, no markdown.",
    user: buildArticleContext(input),
  };
}
