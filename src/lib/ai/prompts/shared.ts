/**
 * Building blocks shared by every `*.prompt.ts` file, so each one only
 * has to state its task-specific instruction rather than re-writing how
 * to format the article or how to ask a model for strict JSON
 * ("Benzer prompt tekrarlarını kaldır").
 */

/** Article bodies are truncated before being sent to a model - keeps token usage (and cost/latency) bounded for very long articles. */
const MAX_CONTENT_CHARS = 6000;

/**
 * `maxChars` defaults to `MAX_CONTENT_CHARS` for every existing prompt
 * (summary/tags/sentiment/etc. only need a representative sample of the
 * article to do their job), but the article-rewrite prompt
 * (`article-rewrite.prompt.ts`) passes a larger cap - it needs to see
 * as much of the real extracted content as `lib/news/article-content.ts`
 * now captures (up to 12,000 characters), since a 700-1500 word rewrite
 * grounded in a truncated 6,000-character sample would either run out of
 * real material or start filling gaps with invented detail.
 */
export function buildArticleContext(input: { title: string; content: string }, maxChars: number = MAX_CONTENT_CHARS): string {
  const content = input.content.length > maxChars ? `${input.content.slice(0, maxChars)}...` : input.content;
  return `Title: ${input.title}\n\nContent:\n${content}`;
}

/** Appended to every prompt whose result is parsed with `parseJsonResponse` - keeps the "respond with JSON only" instruction worded identically everywhere. */
export const JSON_ONLY_INSTRUCTION =
  "Respond with valid JSON only - no prose, no markdown code fences, no explanation before or after the JSON.";

export type PromptPair = {
  system: string;
  user: string;
};
