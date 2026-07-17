import { Header } from "@/components/layout/Header";
import { SearchHeader } from "@/components/search/SearchHeader";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchSidebar } from "@/components/search/SearchSidebar";
import { Pagination } from "@/components/category/Pagination";
import { SEARCH_CATEGORY_SLUGS } from "@/lib/news";
import { searchArticlesReal } from "@/services/articles/article-read-service";

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
function resolveDateFrom(explicitDateFrom: string | undefined, timeFilterId: string | undefined): string | undefined {
  if (explicitDateFrom) return explicitDateFrom;
  const maxDays = timeFilterId ? TIME_FILTER_MAX_DAYS[timeFilterId] : undefined;
  if (!maxDays) return undefined;
  return new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000).toISOString();
}

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    time?: string;
    categories?: string;
    tag?: string;
    source?: string;
    language?: string;
    country?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  // Resolves EVERY checked category slug to its real DB category name
  // via `SEARCH_CATEGORY_SLUGS` (the canonical, 8-category list also
  // used by `SearchFilters`'s checkboxes/counts) - previously only the
  // first selected category was ever applied (`search_articles_fts`
  // only accepted one), silently dropping the rest of a multi-select.
  // `0007_search_multi_category.sql` added real array support, so every
  // checked box is now honored.
  const categorySlugs = params.categories ? params.categories.split(",").filter(Boolean) : [];
  const categoryNames = categorySlugs
    .map((slug) => SEARCH_CATEGORY_SLUGS.find((definition) => definition.slug === slug)?.name)
    .filter((name): name is (typeof SEARCH_CATEGORY_SLUGS)[number]["name"] => Boolean(name));

  const dateFrom = resolveDateFrom(params.dateFrom, params.time);

  const requestedPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  // Real, full-text-search-backed search - query (required to run a
  // search, matching the existing "type something to see results"
  // behavior), plus category(ies)/tag/source/language/country/date
  // passed through from the URL (tag/dateTo have no dedicated visible
  // filter widget yet, but are honored if present in the URL; source/
  // language/country/category now have widgets - see
  // AdvancedFilterCard/CategoryFilterCard).
  const results = await searchArticlesReal({
    query: query || undefined,
    categories: categoryNames.length > 0 ? categoryNames : undefined,
    tag: params.tag,
    sourceId: params.source,
    language: params.language,
    country: params.country,
    dateFrom,
    dateTo: params.dateTo,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  function buildPageHref(targetPage: number): string {
    const next = new URLSearchParams();
    if (params.q) next.set("q", params.q);
    if (params.time) next.set("time", params.time);
    if (params.categories) next.set("categories", params.categories);
    if (params.tag) next.set("tag", params.tag);
    if (params.source) next.set("source", params.source);
    if (params.language) next.set("language", params.language);
    if (params.country) next.set("country", params.country);
    if (params.dateTo) next.set("dateTo", params.dateTo);
    next.set("page", String(targetPage));
    return `/search?${next.toString()}`;
  }

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <SearchHeader query={query} resultCount={results.total} />

          <div className="mt-8 grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
            <aside className="min-w-0 xl:self-start">
              <SearchFilters />
            </aside>

            <div className="min-w-0">
              <SearchResults query={query} items={results.items} />
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
