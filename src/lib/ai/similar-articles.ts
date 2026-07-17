import type { SimilarArticleCandidate, SimilarArticleMatch } from "@/types/ai";

/** Lowercases, strips punctuation, drops very short words (articles/prepositions add noise, not signal). */
function normalizeWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );
}

/** Intersection-over-union of two word sets - 0 (nothing shared) to 1 (identical). */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  a.forEach((item) => {
    if (b.has(item)) intersection += 1;
  });

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Scores how similar `candidate` is to `article` using only fields the
 * pipeline already has for every article - title word overlap, shared
 * tags, same source, same category ("Şimdilik title, tags, source,
 * category alanlarını kullansın"). No AI call, no embeddings: this is
 * intentionally the "good enough, always available, zero cost" baseline.
 *
 * Swap-in point for later: once articles have real embeddings (e.g. via
 * a future `AIProvider.embed()`), replace this function's body with a
 * cosine-similarity lookup against a vector index. `findSimilarArticles`
 * below (its only caller) wouldn't need to change - the signature
 * (candidates in, ranked matches out) stays the same either way
 * ("İleride embedding tabanlı sisteme geçilebilecek şekilde tasarla").
 */
function scoreCandidate(article: SimilarArticleCandidate, candidate: SimilarArticleCandidate): number {
  const titleScore = jaccardSimilarity(normalizeWords(article.title), normalizeWords(candidate.title));

  const articleTags = new Set(article.tags.map((tag) => tag.toLowerCase()));
  const candidateTags = new Set(candidate.tags.map((tag) => tag.toLowerCase()));
  const tagScore = jaccardSimilarity(articleTags, candidateTags);

  const sourceScore = article.source === candidate.source ? 1 : 0;
  const categoryScore = article.category === candidate.category ? 1 : 0;

  // Shared tags are the strongest signal, then title overlap, then
  // category, then same-source (weakest - one outlet covers many
  // unrelated stories).
  return titleScore * 0.35 + tagScore * 0.4 + categoryScore * 0.15 + sourceScore * 0.1;
}

/** Ranks `candidates` by similarity to `article`, dropping the article itself and anything scoring zero. */
export function findSimilarArticlesHeuristic(
  article: SimilarArticleCandidate,
  candidates: SimilarArticleCandidate[],
  limit = 5
): SimilarArticleMatch[] {
  return candidates
    .filter((candidate) => candidate.id !== article.id)
    .map((candidate) => ({
      id: candidate.id,
      slug: candidate.slug,
      title: candidate.title,
      score: scoreCandidate(article, candidate),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
