import { buildArticleContext, JSON_ONLY_INSTRUCTION, type PromptPair } from "@/lib/ai/prompts/shared";
import type { ArticleRewriteInput } from "@/types/ai";

export const ARTICLE_REWRITE_PROMPT_VERSION = "article-rewrite-v1";

/** Sees far more of the extracted source than the other prompts' default 6,000-character cap - see `buildArticleContext`'s doc comment. */
const REWRITE_CONTEXT_MAX_CHARS = 12_000;

/**
 * The full article-rewrite capability (product polishing phase, 4th
 * pass, items 6-7): "Virexa sadece bir RSS okuyucu gibi hissettirmemeli
 * - kullanıcı haberi Virexa içinde tam olarak okuyup anlayabilmeli."
 * Turns the real extracted source content into a natural-reading,
 * properly organized news article of roughly 700-1500 words, broken into
 * the exact section order the article detail page renders (item 6):
 * intro -> mainContent -> background -> whyItMatters -> technicalDetails
 * (only when genuinely applicable) -> keyHighlights -> conclusion.
 *
 * The single hardest constraint here is grounding: "kaynakta olmayan
 * hiçbir bilgi asla uydurulmamalı." This is emphasized twice (once in
 * the system instruction, once inline before the schema) because a
 * fabricated rewrite is worse than a thin one - the whole point of this
 * capability is to let a reader trust what they read in Virexa without
 * needing to check the original.
 */
export function buildArticleRewritePrompt(input: ArticleRewriteInput): PromptPair {
  const sourceNote = input.sourceName ? ` The source outlet is ${input.sourceName}.` : "";

  return {
    system:
      "You are a professional news editor rewriting a wire story into a complete, well-organized article for a " +
      "general news app - the reader will likely never visit the original source, so this rewrite IS the article " +
      "for them. Base every single fact, number, quote, and claim STRICTLY on the provided source content - " +
      "never invent details, statistics, quotes, or context that are not present in it. If the source content is " +
      "itself thin, write a shorter but still fully honest and well-organized piece rather than padding it with " +
      `invented material.${sourceNote} ` +
      "Produce these sections, aiming for a combined total of roughly 700-1500 words of natural, readable prose " +
      "(shorter is fine and expected when the source itself is short - never pad past what the source supports): " +
      "(1) intro - a short 2-3 sentence lead paragraph that hooks the reader and states what happened; " +
      "(2) mainContent - the core of the story in full narrative detail, organized into natural paragraphs " +
      "(separate paragraphs with a blank line), covering everything substantive in the source; " +
      "(3) background - a paragraph of relevant context: what led to this, or how it fits into the broader " +
      "situation, based only on context present in or directly implied by the source; " +
      "(4) whyItMatters - a paragraph on the real-world significance or implications of this story; " +
      "(5) technicalDetails - a paragraph on the specific technology, mechanism, data, or process involved, ONLY " +
      "if the source actually has a technical dimension worth explaining - set this to null (not an empty " +
      "string) if there is nothing genuinely technical to say, rather than inventing filler; " +
      "(6) keyHighlights - 3-6 short, standalone bullet points capturing the most important concrete facts a " +
      "reader should walk away remembering; " +
      "(7) conclusion - a short 1-2 sentence closing that wraps up the story's current state or what to watch " +
      `for next. Plain text only, no markdown formatting within any field. ${JSON_ONLY_INSTRUCTION} Respond as ` +
      'JSON: {"intro": string, "mainContent": string, "background": string, "whyItMatters": string, ' +
      '"technicalDetails": string | null, "keyHighlights": string[], "conclusion": string}.',
    user: buildArticleContext(input, REWRITE_CONTEXT_MAX_CHARS),
  };
}
