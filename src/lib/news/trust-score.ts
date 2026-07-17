import type { Source } from "@/types/news";

/**
 * Resolves the trust score to stamp on a `NewsArticle`. Currently a
 * direct pass-through of the source's editorial score (see `SOURCES` in
 * `sources.ts` - wire services and official company/lab blogs score
 * highest). Kept as its own function, rather than inlining
 * `source.trustScore` at every call site, so a future per-article
 * adjustment (e.g. penalizing an article whose content couldn't be
 * fetched, or a domain-level trust signal) has exactly one place to land
 * without touching the aggregator or any consumer.
 */
export function resolveTrustScore(source: Source): number {
  return source.trustScore;
}
