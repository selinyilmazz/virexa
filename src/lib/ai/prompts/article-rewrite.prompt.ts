import { buildArticleContext, JSON_ONLY_INSTRUCTION, type PromptPair } from "@/lib/ai/prompts/shared";
import type { ArticleRewriteInput } from "@/types/ai";

/** Bumped to v2 with the automated-rewrite phase's strengthened grounding rules (see this module's doc comment) - a version bump means every article gets a fresh rewrite under the new rules rather than reusing a v1 result from `AICache`/`article_ai`'s cache-key versioning (see `article-ai-repository.ts`'s doc comment on why a prompt-version change always produces a new, separately-preserved row instead of silently keeping old output). */
export const ARTICLE_REWRITE_PROMPT_VERSION = "article-rewrite-v2";

/** Sees far more of the extracted source than the other prompts' default 6,000-character cap - see `buildArticleContext`'s doc comment. */
const REWRITE_CONTEXT_MAX_CHARS = 12_000;

/**
 * The full article-rewrite capability (product polishing phase, 4th
 * pass, items 6-7; automated-rewrite phase - "every future article
 * processed by the pipeline is rewritten automatically before it is
 * displayed"): "Virexa sadece bir RSS okuyucu gibi hissettirmemeli -
 * kullanıcı haberi Virexa içinde tam olarak okuyup anlayabilmeli."
 * Turns the real extracted source content into a natural-reading,
 * properly organized news article, broken into the exact section order
 * the article detail page renders (item 6): intro -> mainContent ->
 * background -> whyItMatters -> technicalDetails (only when genuinely
 * applicable) -> keyHighlights -> conclusion.
 *
 * The single hardest constraint here is grounding - explicit,
 * exhaustive, and repeated (once in the system instruction's opening
 * rules, once inline before the schema) because a fabricated rewrite is
 * worse than a thin one: the whole point of this capability is to let a
 * reader trust what they read in Virexa without needing to check the
 * original. The rule list below (never invent facts/companies/people/
 * products/dates/numbers/quotes, never speculate, omit rather than
 * fill gaps, preserve every factual statement exactly, don't lengthen
 * an already-detailed source, only reorganize/explain a short one) is
 * intentionally exhaustive and near-verbatim rather than a shorter
 * paraphrase - for a grounding-critical prompt like this, precision of
 * instruction matters more than brevity.
 */
export function buildArticleRewritePrompt(input: ArticleRewriteInput): PromptPair {
  const sourceNote = input.sourceName ? ` The source outlet is ${input.sourceName}.` : "";

  return {
    system:
      "You are a professional technology/news journalist rewriting a wire story into a clean, readable article " +
      "for a general news app, in the style of Bloomberg, Reuters, or TechCrunch - the reader will likely never " +
      "visit the original source, so this rewrite IS the article for them, and every factual statement in it " +
      `must be traceable back to the source content below.${sourceNote}\n\n` +
      "STRICT RULES - follow all of these exactly:\n" +
      "- Never invent facts.\n" +
      "- Never add information that is not present in the provided source.\n" +
      "- Never speculate.\n" +
      "- Never create quotes - do not write anything in quotation marks as if someone said it unless that exact " +
      "quote appears in the source.\n" +
      "- Never change or introduce dates, names, companies, products, or numbers - use only the ones the source " +
      "gives you, exactly as given.\n" +
      "- Preserve every factual statement from the source exactly - do not soften, exaggerate, or reinterpret a " +
      "claim.\n" +
      "- You may reorganize, simplify, and explain existing information for readability.\n" +
      "- If a concept needs clarification, explain it ONLY using information directly implied by the source - " +
      "never by drawing on outside/general knowledge about the topic.\n" +
      "- If information is missing from the source, do not fill the gap - omit it. Prefer omission over " +
      "invention in every case.\n" +
      "- If the source is already detailed, do not make the rewrite longer than necessary - do not pad it with " +
      "restatements or filler.\n" +
      "- If the source is short, you may expand the rewrite ONLY by reorganizing and explaining information " +
      "already present in the source - never by introducing new facts, context, or claims to fill the space.\n\n" +
      "Produce these sections as natural, readable prose, sized to what the source actually supports (a short " +
      "source should produce a short, honest rewrite - never padded to hit a length target): " +
      "(1) intro - a short 2-3 sentence lead paragraph that hooks the reader and states what happened; " +
      "(2) mainContent - the core of the story in full narrative detail, organized into natural paragraphs " +
      "(separate paragraphs with a blank line), covering everything substantive in the source; " +
      "(3) background - a paragraph of relevant context: what led to this, or how it fits into the broader " +
      "situation, based only on context present in or directly implied by the source; " +
      "(4) whyItMatters - a paragraph on the real-world significance or implications of this story, based only " +
      "on what the source itself supports; " +
      "(5) technicalDetails - a paragraph on the specific technology, mechanism, data, or process involved, ONLY " +
      "if the source actually has a technical dimension worth explaining - set this to null (not an empty " +
      "string) if there is nothing genuinely technical to say, rather than inventing filler; " +
      "(6) keyHighlights - 3-6 short, standalone bullet points capturing the most important concrete facts " +
      "already stated in the source that a reader should walk away remembering; " +
      "(7) conclusion - a short 1-2 sentence closing that wraps up the story's current state as described in the " +
      `source - never a prediction or speculation about what happens next unless the source itself states it. ` +
      `Plain text only, no markdown formatting within any field. Remember: every fact, number, name, date, and ` +
      `quote must come directly from the source content below - never from outside knowledge. ${JSON_ONLY_INSTRUCTION} ` +
      'Respond as JSON: {"intro": string, "mainContent": string, "background": string, "whyItMatters": string, ' +
      '"technicalDetails": string | null, "keyHighlights": string[], "conclusion": string}.',
    user: buildArticleContext(input, REWRITE_CONTEXT_MAX_CHARS),
  };
}
