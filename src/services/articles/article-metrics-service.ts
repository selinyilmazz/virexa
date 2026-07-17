import { createServiceClient } from "@/lib/supabase/service-client";
import { createArticleMetricsRepository } from "@/repositories/article-metrics-repository";

/**
 * Server-only writes to `article_metrics` - view/bookmark/share counters
 * and reading-time tracking. Uses the service-role client
 * (`lib/supabase/service-client.ts`) because these writes happen outside
 * any user session context that would satisfy the table's RLS policies
 * (see `supabase/migrations/0002_article_storage.sql`: only the service
 * role can write).
 *
 * Every function here is fire-and-forget safe: it never throws. A
 * metrics write failing (storage unconfigured, network hiccup, article
 * not yet persisted) must never break the page that triggered it - it's
 * logged and swallowed, exactly like every other optional integration
 * in this app.
 */

async function withMetricsRepository(action: (repository: ReturnType<typeof createArticleMetricsRepository>) => Promise<void>) {
  try {
    const supabase = createServiceClient();
    if (!supabase) return; // Storage not configured yet - a normal, safe state.
    await action(createArticleMetricsRepository(supabase));
  } catch (error) {
    console.error("[article-metrics-service] write failed:", error);
  }
}

/** Called when an article's detail page is opened ("Makale açıldığında view_count otomatik artsın"). */
export async function incrementArticleView(articleId: string): Promise<void> {
  await withMetricsRepository((repository) => repository.incrementView(articleId));
}

/** Called when a user bookmarks an article ("Bookmark yapılınca bookmark_count güncellensin"). */
export async function incrementArticleBookmark(articleId: string): Promise<void> {
  await withMetricsRepository((repository) => repository.incrementBookmark(articleId));
}

/** Called when a user removes a bookmark - the counter's decrement counterpart, so it stays accurate as bookmarks are added and removed. */
export async function decrementArticleBookmark(articleId: string): Promise<void> {
  await withMetricsRepository((repository) => repository.decrementBookmark(articleId));
}

/** Ready to call from any share action ("Share metodu hazır olsun"). */
export async function incrementArticleShare(articleId: string): Promise<void> {
  await withMetricsRepository((repository) => repository.incrementShare(articleId));
}

/** Ready infrastructure for recording time-on-article ("Reading time kaydedilebilecek altyapı hazırlansın") - see `ArticleMetricsRepository.recordReadingTime` for the running-average approximation this uses. */
export async function recordArticleReadingTime(articleId: string, seconds: number): Promise<void> {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  await withMetricsRepository((repository) => repository.recordReadingTime(articleId, seconds));
}
