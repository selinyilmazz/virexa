/** Average adult silent-reading speed used for the estimate, in words per minute. */
const WORDS_PER_MINUTE = 200;

/**
 * Estimates minutes to read an article from its content (falling back to
 * its summary when a provider doesn't supply full content - RSS feeds
 * frequently only expose a short description). Always returns at least
 * 1, so the UI never has to special-case a "0 min read" article.
 */
export function estimateReadingTime(content: string | undefined, summary: string): number {
  const text = content && content.trim().length > 0 ? content : summary;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}
