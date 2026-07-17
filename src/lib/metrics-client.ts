export type MetricsAction = "bookmark_add" | "bookmark_remove" | "share" | "reading_time";

/**
 * Fire-and-forget POST to `/api/metrics` for client-side actions that
 * need to update `article_metrics` counters (bookmark_count,
 * share_count, reading_time_avg) but can't call the service-role-only
 * metrics service directly (see
 * `services/articles/article-metrics-service.ts` - the service role key
 * must never reach the browser). Never throws - a metrics call failing
 * must never break the bookmark/share interaction that triggered it.
 */
export async function reportArticleMetric(slug: string, action: MetricsAction, seconds?: number): Promise<void> {
  try {
    await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(seconds !== undefined ? { slug, action, seconds } : { slug, action }),
    });
  } catch {
    // Best-effort side channel - swallow network errors.
  }
}
