import { buildArticleContext, JSON_ONLY_INSTRUCTION, type PromptPair } from "@/lib/ai/prompts/shared";
import type { ExtractEntitiesInput } from "@/types/ai";

export const ENTITIES_PROMPT_VERSION = "entities-v1";

/**
 * Named-entity extraction for the expanded AI Insights card (product
 * polishing phase, 4th pass, item 8: "Companies Mentioned, Technologies
 * Mentioned, People Mentioned"). Deliberately conservative - an entity
 * only counts if it's actually named in the article content, not implied
 * or guessed from general knowledge of the topic. Empty arrays are a
 * valid, expected result for articles that genuinely don't mention any
 * named companies/technologies/people, not a failure.
 */
export function buildEntitiesPrompt(input: ExtractEntitiesInput): PromptPair {
  return {
    system:
      "Extract named entities that are ACTUALLY MENTIONED BY NAME in the provided article content - never add an " +
      "entity based on general knowledge of the topic if it isn't explicitly named in the text. Produce three " +
      "lists: (1) companies - organizations, companies, or institutions named in the article; (2) technologies - " +
      "specific named products, technologies, tools, protocols, or platforms named in the article (not generic " +
      "terms like \"software\" or \"AI\" unless that generic term is genuinely how the article refers to it); " +
      "(3) people - full names of individual people named in the article. Deduplicate each list, use the most " +
      "complete form of each name that appears in the text, and return an empty array for any category with no " +
      `genuine mentions rather than guessing. ${JSON_ONLY_INSTRUCTION} Respond as JSON: ` +
      '{"companies": string[], "technologies": string[], "people": string[]}.',
    user: buildArticleContext(input),
  };
}
