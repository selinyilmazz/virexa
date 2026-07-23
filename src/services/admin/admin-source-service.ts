import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createArticleRepository } from "@/repositories/article-repository";
import { createSourceRepository } from "@/repositories/source-repository";
import { paginateArray, type PagedArrayResult } from "@/lib/admin/paginate-array";
import type { ArticleSourceRow } from "@/types/database";

/**
 * Server-only read access for `/admin/sources` (requirement 5). Same
 * "never throws" convention as `admin-article-service.ts` - reads via
 * the public, RLS-respecting request-scoped client (`article_sources`
 * is publicly readable; only the Source Actions write path needs the
 * service-role client - see `/api/admin/sources/[id]/route.ts`).
 */

const getRepositories = cache(async () => {
  const supabase = await createClient();
  return {
    articles: createArticleRepository(supabase),
    sources: createSourceRepository(supabase),
  };
});

export type AdminSourceListItem = ArticleSourceRow & { totalArticles: number };

/**
 * Every source, each annotated with its real article count. Sources are
 * a small, bounded table (the news engine's static registry has ~15-20
 * entries - see `lib/news/sources.ts`), so running one
 * `count`-only query per source in parallel is a deliberate, cheap
 * tradeoff at this scale (no SQL `GROUP BY` support in the shimmed
 * query builder - the same constraint documented throughout
 * `article-read-service.ts`), not a per-row loop over unbounded data.
 */
export async function getAdminSourcesList(): Promise<AdminSourceListItem[]> {
  try {
    const { articles, sources } = await getRepositories();
    const sourceList = await sources.list();

    const counts = await Promise.all(
      sourceList.map((source) => articles.search({ sourceId: source.id, page: 1, pageSize: 1 }).then((result) => result.total))
    );

    return sourceList.map((source, index) => ({ ...source, totalArticles: counts[index] }));
  } catch (error) {
    console.error("[admin-source-service] getAdminSourcesList failed:", error);
    return [];
  }
}

/** Search + paginated sources list for `/admin/sources` (requirement 10: unified pagination). Small, bounded table (~15-20 rows) - fetches everything once (with article counts attached), then filters/paginates in application code, same convention as `admin-release-service.ts`'s `getAdminReleasesPage`. */
export async function getAdminSourcesPage(search: string | undefined, page: number, pageSize: number): Promise<PagedArrayResult<AdminSourceListItem>> {
  const all = await getAdminSourcesList();
  const needle = search?.trim().toLowerCase();
  const filtered = needle
    ? all.filter((source) => `${source.name} ${source.domain} ${source.country ?? ""}`.toLowerCase().includes(needle))
    : all;
  return paginateArray(filtered, page, pageSize);
}

/** Single source lookup for the `AdminSourceEditDrawer` (`?edit=<id>`). `article_sources` has no `visible`-style RLS filter, so the request-scoped client sees every row - no service-role client needed for this read. */
export async function getAdminSourceById(id: string): Promise<ArticleSourceRow | null> {
  try {
    const { sources } = await getRepositories();
    return await sources.getById(id);
  } catch (error) {
    console.error("[admin-source-service] getAdminSourceById failed:", error);
    return null;
  }
}
