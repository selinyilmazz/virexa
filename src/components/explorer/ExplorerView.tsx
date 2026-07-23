import type { ReactNode } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ExplorerSidebar } from "@/components/explorer/ExplorerSidebar";
import { FiltersDrawer } from "@/components/explorer/FiltersDrawer";
import { NewsExplorerFilters } from "@/components/news-explorer/NewsExplorerFilters";
import { NewsExplorerPagination } from "@/components/news-explorer/NewsExplorerPagination";
import { NewsExplorerResults } from "@/components/news-explorer/NewsExplorerResults";
import { NewsExplorerSortControl } from "@/components/news-explorer/NewsExplorerSortControl";
import { ScrollToResultsOnPageChange } from "@/components/news-explorer/ScrollToResultsOnPageChange";
import type { PulseTopicKey } from "@/lib/explorer/developer-pulse-data";
import { SEARCH_CATEGORY_SLUGS } from "@/lib/news";
import {
  EXPLORER_PAGE_SIZE,
  resolveDateFrom,
  resolveExplorerSort,
  VALID_CONTENT_TYPES,
  type ExplorerSearchParams,
} from "@/lib/news-explorer/shared";
import {
  getNewsExplorerArticles,
  type ContentTypeFilter,
  type NewsExplorerParams,
  type NewsExplorerSort,
} from "@/services/articles/article-read-service";

const RESULTS_ANCHOR_ID = "explorer-results";

type ExplorerViewProps = {
  /** Page-specific heading, e.g. "News Explorer" / "Search Results" / "Artificial Intelligence". */
  title: string;
  /** Page-specific one-liner under the heading - a plain string for the static pages, JSX for Search's dynamic "Showing results for: ..." */
  subtitle: ReactNode;
  /** This route's own path, e.g. "/news"/"/search"/"/category/ai"/"/cloud" - used to build pagination links back to the SAME route (Sort/Filters already read `usePathname()` themselves, so only Pagination needs this explicitly). */
  basePath: string;
  searchParams: ExplorerSearchParams;
  /** Pre-selects this category slug in the Filters sidebar (and applies it as an active filter) whenever the URL's own `categories` param is absent - e.g. `/category/ai` defaults to "ai" so the AI checkbox is checked automatically on first visit, per the unified-Explorer spec. The user can still change/clear it afterward like any other filter. */
  defaultCategorySlug?: string;
  /** Pre-fills the search query whenever the URL's own `q` param is absent - e.g. `/cloud` defaults to "cloud" (Cloud has no real DB category, so a locked query is the honest way to scope this page to real cloud-related articles - see `CategoryNav`'s doc comment for the same reasoning). Reflected directly in the header's search box since `/cloud` is one of `HeaderSearchInput`'s in-place search paths. */
  defaultQuery?: string;
  /** Pre-selects this Content Type in the Filters sidebar whenever the URL's own `type` param is absent - e.g. `/open-source` defaults to "open-source" (a real heuristic Content Type value already classified for every article - see `classifyContentType` - so no fabricated category is needed here, unlike Cloud). */
  defaultContentType?: ContentTypeFilter;
  /** Pre-selects this Sort whenever the URL's own `sort` param is absent - e.g. `/most-read` defaults to "most-read" so it opens already ranked by real `trending_score` instead of Newest, without locking the visitor out of switching back (same "default only until overridden" pattern as every other `default*` prop here). */
  defaultSort?: NewsExplorerSort;
  /** Restricts results to real articles matching the "Developer Resources" watch-list (`RESOURCE_SEARCH_TERMS`) - backs `/resources`. See `getNewsExplorerArticles`'s doc comment. */
  resourcesOnly?: boolean;
  /**
   * Search Results-only: turns on the "Matched "X" • Found in Y" badge and
   * keyword highlighting on every card (see `NewsExplorerCard`'s
   * `highlightQuery` prop). Only `/search/page.tsx` passes this - every
   * other Explorer route (`/news`, category pages, `/cloud`,
   * `/open-source`, `/resources`) leaves it unset, so those pages never
   * show match explanations even when they also support a `q` param.
   */
  explainMatches?: boolean;
  /**
   * Which mock topic set/discussion the right-hand `DeveloperPulse`
   * sidebar shows - e.g. `/category/ai` passes `"ai"` so the panel talks
   * about GPT-5.5/Claude Code/Gemini instead of generic content.
   * Defaults to `"general"` ("overall trending developer discussions")
   * for routes with no more specific topic - `/news`, `/search`,
   * `/most-read`, `/resources`.
   */
  pulseTopic?: PulseTopicKey;
};

/**
 * The ONE shared Explorer template every browsing surface in the app
 * renders through - View All News, Search Results, Most Read, and the
 * AI/Programming/Cloud/Security/Open Source/Resources pages. Per the
 * unified-Explorer design: these pages only ever differ in their
 * title/subtitle and which filters start pre-applied - the Header,
 * Breadcrumb, Filters sidebar (`FiltersDrawer` - sticky
 * column at `xl`+, off-canvas drawer below it), Sort control, Article
 * Cards, right-hand `ExplorerSidebar` (a single `DeveloperPulse` panel -
 * collapses below the results on narrower screens), and
 * Pagination are the exact same components, imported once, here. No
 * listing page in the app should ever build its own bespoke version of
 * any of this - see `/most-read/page.tsx` for the canonical "just call
 * ExplorerView with different props" example.
 *
 * A category/query/content-type "default" only takes effect when the
 * corresponding URL param is absent - once a visitor interacts with the
 * Filters sidebar or search box, their explicit choice always wins, so
 * e.g. `/category/ai` behaves exactly like "`/news` with categories=ai
 * already applied," not a separate, locked mode.
 */
export async function ExplorerView({
  title,
  subtitle,
  basePath,
  searchParams,
  defaultCategorySlug,
  defaultQuery,
  defaultContentType,
  defaultSort,
  resourcesOnly,
  explainMatches,
  pulseTopic = "general",
}: ExplorerViewProps) {
  const query = (searchParams.q?.trim() || defaultQuery) ?? "";
  const highlightQuery = explainMatches && query ? query : undefined;

  const categoriesParam = searchParams.categories ?? defaultCategorySlug;
  const categorySlugs = categoriesParam ? categoriesParam.split(",").filter(Boolean) : [];
  const categoryNames = categorySlugs
    .map((slug) => SEARCH_CATEGORY_SLUGS.find((definition) => definition.slug === slug)?.name)
    .filter((name): name is (typeof SEARCH_CATEGORY_SLUGS)[number]["name"] => Boolean(name));

  const sourceIds = searchParams.sources ? searchParams.sources.split(",").filter(Boolean) : [];
  const typeParam = searchParams.type ?? defaultContentType;
  const contentType = VALID_CONTENT_TYPES.find((type) => type === typeParam);

  const requestedPage = Number(searchParams.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const filters: NewsExplorerParams = {
    query: query || undefined,
    categories: categoryNames.length > 0 ? categoryNames : undefined,
    sourceIds: sourceIds.length > 0 ? sourceIds : undefined,
    dateFrom: resolveDateFrom(searchParams.time),
    contentType,
    resourcesOnly,
    sort: resolveExplorerSort(searchParams.sort ?? defaultSort),
    page: currentPage,
    pageSize: EXPLORER_PAGE_SIZE,
  };

  const results = await getNewsExplorerArticles(filters);

  function buildPageHref(targetPage: number): string {
    const next = new URLSearchParams();
    if (searchParams.q) next.set("q", searchParams.q);
    if (searchParams.time) next.set("time", searchParams.time);
    if (searchParams.categories) next.set("categories", searchParams.categories);
    if (searchParams.sources) next.set("sources", searchParams.sources);
    if (searchParams.type) next.set("type", searchParams.type);
    if (searchParams.sort) next.set("sort", searchParams.sort);
    next.set("page", String(targetPage));
    return `${basePath}?${next.toString()}`;
  }

  return (
    <>
      <Header initialSearchQuery={query || undefined} />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="transition-colors duration-200 hover:text-slate-700">
              Home
            </Link>
            <span aria-hidden="true">›</span>
            <span className="font-medium text-slate-950">{title}</span>
          </nav>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Explore</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-500">{subtitle}</p>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
            <aside className="min-w-0 xl:sticky xl:top-28 xl:h-fit xl:self-start">
              <FiltersDrawer>
                <NewsExplorerFilters
                  time={searchParams.time}
                  categories={categoriesParam}
                  sources={searchParams.sources}
                  type={typeParam}
                />
              </FiltersDrawer>
            </aside>

            <div id={RESULTS_ANCHOR_ID} className="min-w-0 scroll-mt-28">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">
                  {results.total.toLocaleString("en-US")} result{results.total === 1 ? "" : "s"}
                  <span className="text-slate-400"> • </span>
                  Page {results.page} of {results.totalPages}
                </p>
                <NewsExplorerSortControl />
              </div>

              <NewsExplorerResults items={results.items} highlightQuery={highlightQuery} />

              <NewsExplorerPagination page={results.page} totalPages={results.totalPages} buildHref={buildPageHref} />
            </div>

            <aside className="min-w-0 xl:sticky xl:top-28 xl:h-fit xl:self-start">
              <ExplorerSidebar pulseTopic={pulseTopic} />
            </aside>
          </div>
        </div>
      </main>
      <ScrollToResultsOnPageChange anchorId={RESULTS_ANCHOR_ID} />
    </>
  );
}
