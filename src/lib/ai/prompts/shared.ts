/**
 * Building blocks shared by every `*.prompt.ts` file, so each one only
 * has to state its task-specific instruction rather than re-writing how
 * to format the article or how to ask a model for strict JSON
 * ("Benzer prompt tekrarlarını kaldır").
 */

/** Article bodies are truncated before being sent to a model - keeps token usage (and cost/latency) bounded for very long articles. */
const MAX_CONTENT_CHARS = 6000;

export function buildArticleContext(input: { title: string; content: string }): string {
  const content =
    input.content.length > MAX_CONTENT_CHARS ? `${input.content.slice(0, MAX_CONTENT_CHARS)}...` : input.content;
  return `Title: ${input.title}\n\nContent:\n${content}`;
}

/** Appended to every prompt whose result is parsed with `parseJsonResponse` - keeps the "respond with JSON only" instruction worded identically everywhere. */
export const JSON_ONLY_INSTRUCTION =
  "Respond with valid JSON only - no prose, no markdown code fences, no explanation before or after the JSON.";

export type PromptPair = {
  system: string;
  user: string;
};
