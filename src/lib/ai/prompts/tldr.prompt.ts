import { buildArticleContext, JSON_ONLY_INSTRUCTION, type PromptPair } from "@/lib/ai/prompts/shared";
import type { SummarizeInput } from "@/types/ai";

export const TLDR_PROMPT_VERSION = "tldr-v1";

/** Produces the `{ title, bullets[] }` shape from task item 4 ("TL;DR"). */
export function buildTLDRPrompt(input: SummarizeInput): PromptPair {
  return {
    system:
      "You are a news editor writing a TL;DR for busy readers. Produce a short, punchy title (max 8 words) and " +
      "3-5 bullet points capturing the essence of the article, each a short standalone sentence. " +
      `${JSON_ONLY_INSTRUCTION} Respond as JSON: {"title": string, "bullets": string[]}.`,
    user: buildArticleContext(input),
  };
}
