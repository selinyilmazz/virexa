import type { Source } from "@/types/news";

/**
 * Real engagement signals aren't wired up yet for view/bookmark counts
 * (that requires the Bookmark/Profile database work, which is separate
 * from this news pipeline). `engagementScore` IS wired up - it's the
 * one signal a provider can supply directly (Hacker News's own point
 * score; see `services/news/providers/hackernews-provider.ts`). This
 * type exists so `calculateTrendingScore` has a stable place for all of
 * these to plug into without changing its signature or any caller that
 * doesn't have a signal to offer.
 */
export type TrendingSignals = {
  viewCount?: number;
  bookmarkCount?: number;
  /** A provider-native community engagement number (e.g. Hacker News points). Blended in with its own small weight, capped the same way viewCount/bookmarkCount are, so one very high-engagement item can't dominate the score. */
  engagementScore?: number;
};

export type TrendingScoreParams = {
  publishedAt: string;
  trustScore: number;
  source: Source;
  signals?: TrendingSignals;
};

/** How many hours until a story's freshness contribution halves. */
const RECENCY_HALF_LIFE_HOURS = 18;

/** Exponential decay: 1 right at publish time, 0.5 at the half-life, approaching 0 as the story ages. */
function recencyFactor(publishedAt: string, now: number): number {
  const publishedAtMs = new Date(publishedAt).getTime();
  if (Number.isNaN(publishedAtMs)) return 0;
  const ageHours = Math.max(0, (now - publishedAtMs) / (1000 * 60 * 60));
  return Math.pow(0.5, ageHours / RECENCY_HALF_LIFE_HOURS);
}

/**
 * Computes a simple 0-100 "how hot is this right now" score from what
 * the pipeline actually knows today: how recently it was published, the
 * source's editorial trust score, and whether the source is an official
 * first-party origin (a company announcing its own news, weighted
 * slightly higher than third-party coverage of the same thing).
 *
 * Recency dominates on purpose - a fresh, moderately-trusted story
 * should outrank a stale, highly-trusted one - while trust prevents a
 * brand-new but low-quality source from topping the list just by
 * timing. `signals` is optional; `viewCount`/`bookmarkCount` are still
 * unused by any current caller (real counts aren't wired into the
 * pipeline yet), but `engagementScore` IS populated for Hacker News
 * articles (see `NewsAggregator.normalizeProviderItem` and
 * `runtime/pipeline/steps/finalize-steps.ts`'s `trendingScoreStep`, the
 * two places a trending score is computed).
 */
export function calculateTrendingScore(params: TrendingScoreParams, now: number = Date.now()): number {
  const { publishedAt, trustScore, source, signals } = params;

  const recency = recencyFactor(publishedAt, now);
  const trust = Math.max(0, Math.min(100, trustScore)) / 100;
  const officialBoost = source.official ? 1.05 : 1;

  let score = (recency * 70 + trust * 30) * officialBoost;

  if (signals?.viewCount) {
    score += Math.min(10, Math.log10(signals.viewCount + 1) * 2);
  }
  if (signals?.bookmarkCount) {
    score += Math.min(5, Math.log10(signals.bookmarkCount + 1) * 2);
  }
  if (signals?.engagementScore) {
    score += Math.min(8, Math.log10(signals.engagementScore + 1) * 2);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}
