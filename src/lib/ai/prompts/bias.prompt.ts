import { buildArticleContext, JSON_ONLY_INSTRUCTION, type PromptPair } from "@/lib/ai/prompts/shared";
import type { AnalyzeBiasInput } from "@/types/ai";

export const BIAS_PROMPT_VERSION = "bias-v1";

/** Produces the `{ level, confidence }` shape from task item 8. */
export function buildBiasPrompt(input: AnalyzeBiasInput): PromptPair {
  const sourceHint = input.source ? `\n\nSource: ${input.source}` : "";
  return {
    system:
      "Assess the likely editorial bias level of THIS ARTICLE'S framing and word choice (not the publisher's " +
      'general reputation) as one of: "Very Low", "Low", "Medium", "High", with a confidence from 0 to 1. ' +
      `${JSON_ONLY_INSTRUCTION} Respond as JSON: {"level": "Very Low" | "Low" | "Medium" | "High", "confidence": number}.`,
    user: buildArticleContext(input) + sourceHint,
  };
}
