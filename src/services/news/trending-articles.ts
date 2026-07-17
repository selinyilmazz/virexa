import { getLiveArticlesSync } from "@/services/news/live-articles";
import type { NewsArticle } from "@/types/news";

/**
 * Returns the `limit` highest-`trendingScore` live articles - the
 * data-layer seam a future "Trending" screen would call into. Not wired
 * into any page this turn: the existing `TrendingTopics` widget on Home
 * shows static topic names by an earlier, explicit decision made
 * earlier in this project ("Trending Topics'i statik hale getir"), and
 * this task's brief is infrastructure only ("Bu turda kesinlikle UI
 * geliştirmiyoruz") - so this function exists and is ready, without
 * touching that widget or adding a new page.
 */
export function getTrendingArticlesSync(limit = 10): NewsArticle[] {
  return [...getLiveArticlesSync()].sort((a, b) => b.trendingScore - a.trendingScore).slice(0, limit);
}
