import type { Metadata } from "next";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { Pagination } from "@/components/category/Pagination";
import { AdminArticleFilters } from "@/components/admin/AdminArticleFilters";
import { AdminArticlesTable } from "@/components/admin/AdminArticlesTable";
import { ArticleDetailDrawer } from "@/components/admin/ArticleDetailDrawer";
import { AdminArticleDetailContent } from "@/components/admin/AdminArticleDetailContent";
import {
  getAdminArticlesPage,
  getAdminArticleDetail,
  type AdminArticleFilters as ArticleFilters,
} from "@/services/admin/admin-article-service";
import { getAdminSourcesList } from "@/services/admin/admin-source-service";

export const metadata: Metadata = {
  title: "Articles | Virexa Admin",
};

const PAGE_SIZE = 20;

type AdminArticlesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toStringParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function toNumberParam(value: string | string[] | undefined): number | undefined {
  const raw = toStringParam(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Admin Articles Management (requirements 1-4). Server Component - reads
 * filters/search/pagination straight from `searchParams`, calls
 * `getAdminArticlesPage()` (no client-side fetch for the list), and
 * renders through the reused `AdminTable`/`SectionCard`/`Pagination`
 * components. The Article Detail Drawer opens via `?selected=<id>` and
 * is resolved server-side too (`getAdminArticleDetail()`), keeping the
 * whole read path Server-Component-first (requirement 9).
 */
export default async function AdminArticlesPage({ searchParams }: AdminArticlesPageProps) {
  const params = await searchParams;

  const page = Math.max(1, toNumberParam(params.page) ?? 1);
  const selectedId = toStringParam(params.selected);

  const filters: ArticleFilters = {
    sourceId: toStringParam(params.source),
    category: toStringParam(params.category),
    language: toStringParam(params.language),
    country: toStringParam(params.country),
    dateFrom: toStringParam(params.dateFrom),
    dateTo: toStringParam(params.dateTo),
    minTrustScore: toNumberParam(params.minTrust),
    maxTrustScore: toNumberParam(params.maxTrust),
    minTrendingScore: toNumberParam(params.minTrending),
    maxTrendingScore: toNumberParam(params.maxTrending),
    search: toStringParam(params.q),
  };

  const [articlesPage, sourceList, detail] = await Promise.all([
    getAdminArticlesPage(filters, page, PAGE_SIZE),
    getAdminSourcesList(),
    selectedId ? getAdminArticleDetail(selectedId) : Promise.resolve(null),
  ]);

  function buildPageHref(targetPage: number): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || key === "selected") continue;
      const raw = toStringParam(value);
      if (raw) query.set(key, raw);
    }
    query.set("page", String(targetPage));
    return `/admin/articles?${query.toString()}`;
  }

  const closeDrawerHref = (() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "selected") continue;
      const raw = toStringParam(value);
      if (raw) query.set(key, raw);
    }
    const queryString = query.toString();
    return queryString ? `/admin/articles?${queryString}` : "/admin/articles";
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Articles</h1>
        <p className="mt-1 text-sm text-slate-500">
          {articlesPage.total.toLocaleString()} article{articlesPage.total === 1 ? "" : "s"} in Article Storage.
        </p>
      </div>

      <SectionCard title="Filters" description="Narrow down articles by source, category, language, date range, or score.">
        <AdminArticleFilters sources={sourceList.map((source) => ({ id: source.id, name: source.name }))} />
      </SectionCard>

      <SectionCard title="All Articles">
        {articlesPage.items.length === 0 ? (
          <EmptyState
            icon="📰"
            title="No articles found"
            description="No articles match the current filters. Try adjusting or clearing them."
          />
        ) : (
          <>
            <AdminArticlesTable items={articlesPage.items} />
            <Pagination currentPage={articlesPage.page} totalPages={articlesPage.totalPages} buildHref={buildPageHref} />
          </>
        )}
      </SectionCard>

      {selectedId && (
        <ArticleDetailDrawer closeHref={closeDrawerHref}>
          {detail ? (
            <AdminArticleDetailContent detail={detail} />
          ) : (
            <EmptyState icon="🔍" title="Article not found" description="This article may have been removed." />
          )}
        </ArticleDetailDrawer>
      )}
    </div>
  );
}
