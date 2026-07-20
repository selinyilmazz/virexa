/**
 * Splits a block of plain text into readable paragraphs - the fix for
 * article bodies rendering as one unbroken wall of text ("Yazılar blok
 * blok görünmesin", "Paragraflar düzgün bölünsün").
 *
 * Root cause this addresses: `fetchArticleContent`'s strategy 1
 * (JSON-LD `articleBody`, see `article-content.ts`) returns whatever
 * single string the source CMS embedded in its structured data. Many
 * CMSs join the whole article into that one string with NO blank-line
 * separators at all - schema.org's `articleBody` is just "a string",
 * there's no standard requiring paragraph breaks to survive into it.
 * The previous render path (`buildContentBlocks` in
 * `article-read-service.ts`, and `ArticleContent.tsx`'s `paragraphsOf`)
 * only ever split on a double newline (`\n{2,}`), so any content
 * without one rendered as a single giant paragraph - readable, but
 * exactly the "generic RSS reader" wall-of-text feel Virexa is trying
 * to avoid, regardless of how long or short the underlying text is.
 *
 * This is presentation-only: it never adds, removes, or rewrites a
 * single word of the source text - it only decides where the paragraph
 * breaks go, using progressively looser signals:
 *
 *  1. Real double-newline paragraph breaks, when the source already has
 *     them (the common case for `<p>`-tag-extracted content, which
 *     already gets joined with `\n\n` - see `article-content.ts`).
 *  2. Single-newline breaks, when every resulting line is long enough
 *     to plausibly be its own paragraph rather than incidental line
 *     wrapping.
 *  3. Sentence-grouping: when the text truly has no structural line
 *     breaks (the JSON-LD case above), group consecutive sentences into
 *     paragraph-sized chunks. This is the same thing a human editor
 *     does when re-flowing a single-string API payload into readable
 *     copy - it changes wrapping, not content.
 */

/** Roughly one short-to-medium paragraph's worth of sentences - long enough that synthesized paragraphs don't look choppy, short enough that a 1500-word rewrite or a long scraped article still reads as multiple distinct paragraphs rather than 2-3 giant ones. */
const SENTENCES_PER_SYNTHESIZED_PARAGRAPH = 3;

/** Below this length, a single-newline-separated "line" is more likely incidental wrapping (e.g. a wrapped long sentence from a fixed-width source) than a real paragraph break. */
const MIN_LINE_LENGTH_FOR_PARAGRAPH_BREAK = 30;

function splitIntoSentenceGroups(text: string): string[] {
  // Matches a run of non-terminator characters followed by one or more
  // sentence terminators (.!?) and the whitespace after them - keeps the
  // terminator attached to its sentence. Falls back to the whole text as
  // one "sentence" when it contains no recognizable terminator at all
  // (e.g. a single clause, or non-Latin punctuation this heuristic
  // doesn't recognize) so nothing is ever silently dropped.
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
  if (!sentences || sentences.length === 0) return [text];

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += SENTENCES_PER_SYNTHESIZED_PARAGRAPH) {
    const chunk = sentences
      .slice(i, i + SENTENCES_PER_SYNTHESIZED_PARAGRAPH)
      .join("")
      .trim();
    if (chunk.length > 0) paragraphs.push(chunk);
  }
  return paragraphs.length > 0 ? paragraphs : [text];
}

/** See this module's doc comment for the 3-tier strategy. Always returns at least one non-empty paragraph for non-blank input, and `[]` for blank/empty input. */
export function splitIntoParagraphs(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) return [];

  const doubleNewlineSplit = trimmed
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
  if (doubleNewlineSplit.length > 1) return doubleNewlineSplit;

  const singleNewlineSplit = trimmed
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (singleNewlineSplit.length > 1 && singleNewlineSplit.every((line) => line.length >= MIN_LINE_LENGTH_FOR_PARAGRAPH_BREAK)) {
    return singleNewlineSplit;
  }

  // No real line-break structure at all (the JSON-LD `articleBody`
  // case) - the text we have at this point is a single logical block
  // (whether from `doubleNewlineSplit`/`singleNewlineSplit` collapsing
  // back to one entry, or `trimmed` itself) - synthesize readable
  // paragraph breaks from sentence boundaries instead of rendering it
  // as one block.
  return splitIntoSentenceGroups(trimmed);
}
