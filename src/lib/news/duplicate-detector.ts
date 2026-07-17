import type { NewsArticle } from "@/types/news";

/**
 * Duplicate detection for articles aggregated across multiple sources.
 *
 * The same story frequently gets published by several outlets (e.g. a
 * Reuters wire story reprinted by CNBC) or re-fetched from the same
 * source across pipeline runs. This module compares the fields that are
 * cheapest and most reliable to compare - exact URL, exact slug, a
 * normalized title, and publish-time proximity across sources - before
 * any article reaches the UI or a database.
 *
 * This is deliberately simple, deterministic matching. A future phase
 * can layer semantic/embedding-based similarity on top (see
 * `DuplicateStrategy` below and DESIGN.md), but that requires an AI
 * provider and is out of scope here.
 */

/** How close two articles' publish times must be to be considered "the same news moment" across sources. */
const CROSS_SOURCE_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

/** Minimum fraction of shared title words to treat cross-source articles as the same story. */
const CROSS_SOURCE_SIMILARITY_THRESHOLD = 0.75;

/** Lowercases, strips punctuation and collapses whitespace for comparison. */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fraction of words shared between two already-normalized titles (0 = nothing in common, 1 = identical word sets). */
function titleSimilarity(normalizedA: string, normalizedB: string): number {
  const wordsA = new Set(normalizedA.split(" ").filter(Boolean));
  const wordsB = new Set(normalizedB.split(" ").filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let shared = 0;
  wordsA.forEach((word) => {
    if (wordsB.has(word)) shared += 1;
  });

  return shared / Math.max(wordsA.size, wordsB.size);
}

/**
 * A duplicate-detection strategy: given two articles, decides whether
 * they represent the same underlying story. `heuristicDuplicateStrategy`
 * (below) is the only implementation today; the type exists so a future
 * AI/embedding-based strategy can be swapped into `dedupeArticles`'s
 * second argument without changing any caller.
 */
export type DuplicateStrategy = (a: NewsArticle, b: NewsArticle) => boolean;

/**
 * Two articles are treated as duplicates when:
 *  - their URLs match exactly, or
 *  - their slugs match exactly, or
 *  - they share the same source AND a normalized title match, or
 *  - they come from *different* sources but were published within
 *    `CROSS_SOURCE_WINDOW_MS` of each other and their titles are highly
 *    similar (the classic "wire story reprinted elsewhere" case).
 *
 * The cross-source check requires both a tight time window and high
 * title similarity together - either alone is too weak (lots of stories
 * publish the same day; lots of stories share a few words like a
 * company name) and would start merging genuinely different articles.
 */
export function isDuplicateArticle(a: NewsArticle, b: NewsArticle): boolean {
  if (a.url === b.url) return true;
  if (a.slug === b.slug) return true;

  const normalizedA = normalizeTitle(a.title);
  const normalizedB = normalizeTitle(b.title);

  if (a.source.id === b.source.id && normalizedA === normalizedB) return true;

  if (a.source.id !== b.source.id) {
    const publishedGapMs = Math.abs(new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    if (
      publishedGapMs <= CROSS_SOURCE_WINDOW_MS &&
      titleSimilarity(normalizedA, normalizedB) >= CROSS_SOURCE_SIMILARITY_THRESHOLD
    ) {
      return true;
    }
  }

  return false;
}

/** Default strategy used by `dedupeArticles` - see `isDuplicateArticle` for the rules it applies. */
export const heuristicDuplicateStrategy: DuplicateStrategy = isDuplicateArticle;

/**
 * Removes duplicates from a list of articles, keeping the first
 * occurrence of each unique story. Callers should sort articles by
 * priority (e.g. trust score) before calling this so the "kept" copy is
 * the preferred one - see `NewsAggregator`, which sorts by `trustScore`
 * before deduping and by `publishedAt` after.
 *
 * `strategy` defaults to the heuristic rules above; pass a different
 * `DuplicateStrategy` (e.g. an embedding-similarity check) to change how
 * duplicates are identified without touching this function.
 */
export function dedupeArticles(articles: NewsArticle[], strategy: DuplicateStrategy = heuristicDuplicateStrategy): NewsArticle[] {
  const unique: NewsArticle[] = [];

  for (const candidate of articles) {
    const isDuplicate = unique.some((existing) => strategy(existing, candidate));
    if (!isDuplicate) {
      unique.push(candidate);
    }
  }

  return unique;
}
