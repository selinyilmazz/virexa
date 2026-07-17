import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createArticleRepository } from "@/repositories/article-repository";
import { createArticleMetricsRepository } from "@/repositories/article-metrics-repository";
import { createSourceRepository } from "@/repositories/source-repository";
import { createProfileRepository } from "@/repositories/profile-repository";
import { createBookmarkRepository } from "@/repositories/bookmark-repository";

/**
 * Server-only aggregate reads for the Admin Dashboard home
 * (`/admin`) - the same "service wraps repositories, never throws"
 * convention as `services/articles/article-read-service.ts`. Every
 * repository call here runs in parallel (`Promise.all`), never
 * sequentially ("Repository çağrılarını gereksiz tekrar etme ...
 * verileri paralel çek").
 *
 * `articles`/`article_sources`/`article_metrics` are publicly readable
 * (see `0002_article_storage.sql`'s RLS), so those counts use the
 * normal request-scoped client. `profiles`/`bookmarks` are per-user
 * RLS-protected (`0001_production_schema.sql`) - a request-scoped
 * client would only ever count the signed-in admin's own row, so a
 * true site-wide total requires the service-role client. If the
 * service role key isn't configured, those two stats safely fall back
 * to `0` rather than throwing (mirrors every other "missing config is
 * a normal, safe state" spot in this app).
 */

export type DashboardStats = {
  totalArticles: number;
  totalSources: number;
  totalUsers: number;
  articlesLast24h: number;
  totalBookmarks: number;
  totalViews: number;
};

const EMPTY_STATS: DashboardStats = {
  totalArticles: 0,
  totalSources: 0,
  totalUsers: 0,
  articlesLast24h: 0,
  totalBookmarks: 0,
  totalViews: 0,
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    const articleRepository = createArticleRepository(supabase);
    const sourceRepository = createSourceRepository(supabase);
    const metricsRepository = createArticleMetricsRepository(supabase);

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [totalArticles, totalSources, articlesLast24h, totalViews, totalUsers, totalBookmarks] = await Promise.all([
      articleRepository.count(),
      sourceRepository.count(),
      articleRepository.countCreatedSince(since24h),
      metricsRepository.sumViewCounts(),
      serviceClient ? createProfileRepository(serviceClient).count() : Promise.resolve(0),
      serviceClient ? createBookmarkRepository(serviceClient).count() : Promise.resolve(0),
    ]);

    return { totalArticles, totalSources, totalUsers, articlesLast24h, totalBookmarks, totalViews };
  } catch (error) {
    console.error("[admin-dashboard-service] getDashboardStats failed:", error);
    return EMPTY_STATS;
  }
}
