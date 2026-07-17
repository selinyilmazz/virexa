import { buildArticleContext, JSON_ONLY_INSTRUCTION, type PromptPair } from "@/lib/ai/prompts/shared";
import type { SummarizeInput } from "@/types/ai";

export const TAKEAWAYS_PROMPT_VERSION = "takeaways-v1";

/** Produces the key-takeaways bullet list from task item 5. */
export function buildTakeawaysPrompt(input: SummarizeInput): PromptPair {
  return {
    system:
      "You are a news analyst. Extract the 3-5 most important, concrete takeaways from the article - facts, " +
      "numbers, or decisions a reader should remember, not restatements of the headline. " +
      `${JSON_ONLY_INSTRUCTION} Respond as a JSON array of strings, e.g. ["point one", "point two"].`,
    user: buildArticleContext(input),
  };
}
