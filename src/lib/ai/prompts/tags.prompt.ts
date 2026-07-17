import { buildArticleContext, JSON_ONLY_INSTRUCTION, type PromptPair } from "@/lib/ai/prompts/shared";
import type { GenerateTagsInput } from "@/types/ai";

export const TAGS_PROMPT_VERSION = "tags-v1";

/**
 * Produces 3-6 short tags (task item 6). The example vocabulary in the
 * instruction ("AI", "LLM", "Security", ...) nudges the model toward
 * terms that already line up with Virexa's category system
 * (`src/lib/news/category-mapper.ts`) without hard-coding a closed list
 * - a model is free to return a term outside the list when it's clearly
 * the better fit.
 */
export function buildTagsPrompt(input: GenerateTagsInput): PromptPair {
  const categoryHint = input.category ? `\n\nExisting category: ${input.category}` : "";
  return {
    system:
      "You are a content tagger for a technology news site. Generate 3-6 short, relevant tags for this article. " +
      "Prefer concise, well-known terms such as: AI, LLM, Security, Startup, Funding, Cloud, GPU, Open Source, " +
      "Robotics, Quantum. Avoid duplicating the tag with the category if one is given below. " +
      `${JSON_ONLY_INSTRUCTION} Respond as a JSON array of strings.`,
    user: buildArticleContext(input) + categoryHint,
  };
}
