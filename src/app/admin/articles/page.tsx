import type { Metadata } from "next";
import Link from "next/link";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminArticleFilters } from "@/components/admin/AdminArticleFilters";
import { AdminArticlesTable } from "@/components/admin/AdminArticlesTable";
import { ArticleDetailDrawer } from "@/components/admin/ArticleDetailDrawer";
import { AdminArticleDetailContent } from "@/components/admin/AdminArticleDetailContent";
import { AdminArticleEditForm } from "@/components/admin/AdminArticleEditForm";
import {
  getAdminArticlesPage,
  getAdminArticleDetail,
  type AdminArticleFilters as ArticleFilters,
} from "@/services/admin/admin-article-service";
import { getAdminSourcesList } from "@/services/admin/admin-source-service";
import { categories as ALL_CATEGORIES } from "@/data/categories";

export const metadata: Metadata = {
  title: "Articles | Virexa Admin",
};

const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

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

function toPageSizeParam(value: string | string[] | undefined): number {
  const parsed = toNumberParam(value);
  return parsed && ALLOWED_PAGE_SIZES.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
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
  const pageSize = toPageSizeParam(params.pageSize);
  const selectedId = toStringParam(params.selected);
  const editId = toStringParam(params.edit);
  const isEditingNew = editId === "new";

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

  const [articlesPage, sourceList, detail, editingArticle] = await Promise.all([
    getAdminArticlesPage(filters, page, pageSize),
    getAdminSourcesList(),
    selectedId ? getAdminArticleDetail(selectedId) : Promise.resolve(null),
    editId && !isEditingNew ? getAdminArticleDetail(editId) : Promise.resolve(null),
  ]);

  const categoryNames = ALL_CATEGORIES.map((category) => category.name);
  const sourceOptions = sourceList.map((source) => ({ id: source.id, name: source.name }));

  const closeDrawerHref = (() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "selected" || key === "edit") continue;
      const raw = toStringParam(value);
      if (raw) query.set(key, raw);
    }
    const queryString = query.toString();
    return queryString ? `/admin/articles?${queryString}` : "/admin/articles";
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Articles</h1>
          <p className="mt-1 text-sm text-slate-500">
            {articlesPage.total.toLocaleString()} article{articlesPage.total === 1 ? "" : "s"} in Article Storage.
          </p>
        </div>
        <Link
          href="/admin/articles?edit=new"
          className="rounded-xl bg-[#2f67e8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9]"
        >
          + New Article
        </Link>
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
            <AdminPagination
              page={articlesPage.page}
              pageSize={articlesPage.pageSize}
              totalItems={articlesPage.total}
              itemLabel="articles"
            />
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

      {(isEditingNew || editingArticle) && (
        <AdminArticleEditForm
          article={isEditingNew ? null : editingArticle}
          sources={sourceOptions}
          categories={categoryNames}
          closeHref={closeDrawerHref}
        />
      )}
    </div>
  );
}
