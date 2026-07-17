import type { NewsArticle } from "@/types/news";

/**
 * Duplicate detection for articles aggregated across multiple sources.
 *
 * The same story frequently gets published by several outlets (e.g. a
 * Reuters wire story reprinted by CNBC) or re-fetched from the same
 * source across pipeline runs. This module compares the fields that are
 * cheapest and most reliable to compare — exact URL, exact slug, and a
 * normalized title — before any article reaches the UI or a database.
 *
 * This is deliberately simple, deterministic string matching. A future
 * phase can layer semantic/embedding-based similarity on top (see
 * DESIGN.md), but that requires an AI provider and is out of scope here.
 */

/** Lowercases, strips punctuation and collapses whitespace for comparison. */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Two articles are treated as duplicates when either:
 *  - their URLs match exactly, or
 *  - their slugs match exactly, or
 *  - they share the same source AND a normalized title match.
 *
 * Same-title matches are scoped to the same source because independent
 * outlets legitimately publish differently-worded coverage of the same
 * event under similar titles — that's cross-source *related* coverage,
 * not a duplicate record of the same article.
 */
export function isDuplicateArticle(a: NewsArticle, b: NewsArticle): boolean {
  if (a.url === b.url) return true;
  if (a.slug === b.slug) return true;
  if (a.source.id === b.source.id && normalizeTitle(a.title) === normalizeTitle(b.title)) return true;
  return false;
}

/**
 * Removes duplicates from a list of articles, keeping the first
 * occurrence of each unique story. Callers should sort articles by
 * recency/priority before calling this so the "kept" copy is the
 * preferred one.
 */
export function dedupeArticles(articles: NewsArticle[]): NewsArticle[] {
  const unique: NewsArticle[] = [];

  for (const candidate of articles) {
    const isDuplicate = unique.some((existing) => isDuplicateArticle(existing, candidate));
    if (!isDuplicate) {
      unique.push(candidate);
    }
  }

  return unique;
}
