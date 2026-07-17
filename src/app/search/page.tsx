import { Header } from "@/components/layout/Header";
import { SearchHeader } from "@/components/search/SearchHeader";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchSidebar } from "@/components/search/SearchSidebar";
import { Pagination } from "@/components/category/Pagination";
import { SEARCH_CATEGORY_SLUGS } from "@/lib/news";
import { searchArticlesReal, type SearchSortOrder } from "@/services/articles/article-read-service";

const PAGE_SIZE = 10;

// Mirrors TimeFilterCard's filter ids - kept in sync manually since
// these are simple, stable UI definitions rather than DB-driven data.
const TIME_FILTER_MAX_DAYS: Record<string, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "1y": 365,
};

/** Isolated in its own function (rather than inline in the page body) so the one-time `Date.now()` read for a relative date-range filter doesn't count as an impure call inside the page component itself. */
function resolveDateFrom(timeFilterId: string | undefined): string | undefined {
  const maxDays = timeFilterId ? TIME_FILTER_MAX_DAYS[timeFilterId] : undefined;
  if (!maxDays) return undefined;
  return new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000).toISOString();
}

function resolveSort(raw: string | undefined, hasQuery: boolean): SearchSortOrder {
  if (raw === "newest" || raw === "oldest") return raw;
  if (raw === "relevance" && hasQuery) return "relevance";
  return hasQuery ? "relevance" : "newest";
}

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    time?: string;
    categories?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const hasQuery = query.length > 0;

  // Resolves EVERY checked category slug to its real DB category name
  // via `SEARCH_CATEGORY_SLUGS` (the canonical, 8-category list also
  // used by `SearchFilters`'s checkboxes/counts) - every checked box is
  // honored (see `0007_search_multi_category.sql` and
  // `ArticleRepository.search()`'s multi-category `.in()` support).
  const categorySlugs = params.categories ? params.categories.split(",").filter(Boolean) : [];
  const categoryNames = categorySlugs
    .map((slug) => SEARCH_CATEGORY_SLUGS.find((definition) => definition.slug === slug)?.name)
    .filter((name): name is (typeof SEARCH_CATEGORY_SLUGS)[number]["name"] => Boolean(name));

  const dateFrom = resolveDateFrom(params.time);
  const hasFilters = categoryNames.length > 0 || Boolean(dateFrom);
  const sort = resolveSort(params.sort, hasQuery);

  const requestedPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  // Dual-path real search (see `searchArticlesReal`): relevance-ranked
  // full-text search when there's a text query, a plain filtered browse
  // listing when there's only Time/Category filters, and an empty
  // landing page when there's neither - so Time/Category filters
  // actually filter results on their own, with no query required.
  const results = await searchArticlesReal({
    query: hasQuery ? query : undefined,
    categories: categoryNames.length > 0 ? categoryNames : undefined,
    dateFrom,
    sort,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  function buildPageHref(targetPage: number): string {
    const next = new URLSearchParams();
    if (params.q) next.set("q", params.q);
    if (params.time) next.set("time", params.time);
    if (params.categories) next.set("categories", params.categories);
    if (params.sort) next.set("sort", params.sort);
    next.set("page", String(targetPage));
    return `/search?${next.toString()}`;
  }

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <SearchHeader query={query} resultCount={results.total} hasFilters={hasFilters} />

          <div className="mt-8 grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
            <aside className="min-w-0 xl:self-start">
              <SearchFilters time={params.time} categories={params.categories} />
            </aside>

            <div className="min-w-0">
              <SearchResults query={query} items={results.items} hasFilters={hasFilters} />
              <Pagination currentPage={results.page} totalPages={results.totalPages} buildHref={buildPageHref} />
            </div>

            <aside className="min-w-0 xl:self-start">
              <SearchSidebar />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
