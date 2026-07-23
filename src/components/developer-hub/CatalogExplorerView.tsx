import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { CatalogFiltersPanel } from "@/components/developer-hub/CatalogFiltersPanel";
import { CatalogResults } from "@/components/developer-hub/CatalogResults";
import { CatalogSortControl } from "@/components/developer-hub/CatalogSortControl";
import { DeveloperHubStatsStrip } from "@/components/developer-hub/DeveloperHubStatsStrip";
import { NewsExplorerPagination } from "@/components/news-explorer/NewsExplorerPagination";
import { ScrollToResultsOnPageChange } from "@/components/news-explorer/ScrollToResultsOnPageChange";
import type { CatalogDifficulty as Difficulty, CatalogPrice as Price } from "@/types/database";
import { CATALOG_PAGE_SIZE, type DeveloperHubSearchParams } from "@/lib/developer-hub/shared";
import { getCatalogItems, type CatalogResourceType, type CatalogSort } from "@/services/developer-hub/developer-hub-service";

const RESULTS_ANCHOR_ID = "developer-hub-results";

type CatalogExplorerViewProps = {
  /** Page-specific heading, e.g. "Certifications" / "GitHub Explorer". */
  title: string;
  subtitle: ReactNode;
  /** This route's own path - used to build pagination links, same role as `ExplorerView`'s `basePath`. */
  basePath: string;
  searchParams: DeveloperHubSearchParams;
  /** Pre-selects this resource type in the Filters sidebar whenever the URL's own `types` param is absent - e.g. `/developer-hub/certifications` defaults to "certification". The user can still add other types afterward, same "default only applies when the param is absent" pattern as `ExplorerView`. */
  defaultResourceType?: CatalogResourceType;
};

/**
 * The shared template most Developer Hub catalog pages render through -
 * `/developer-hub/certifications`, `/courses`, `/learning-paths`,
 * `/tools`, `/roadmaps`, `/cheat-sheets`. Deliberately mirrors
 * `ExplorerView`'s structure (same `Header`, same stats-strip-then-title-
 * then-filters-sidebar-then-results-then-pagination layout, same
 * instant-filter/no-Apply-button convention, same
 * `NewsExplorerPagination`/`ScrollToResultsOnPageChange` reused as-is) so
 * Developer Hub feels like part of the same product, even though its
 * data comes from `getCatalogItems` (curated + live GitHub) instead of
 * the articles database.
 *
 * Two pages deliberately DON'T use this template:
 * `/developer-hub/releases` reuses `ExplorerView` directly
 * (`defaultContentType: "release"`), since Releases are real DB-backed
 * articles already served perfectly by the unified News Explorer - see
 * that page's own doc comment. `/developer-hub/github` uses the
 * dedicated `GithubExplorerView` instead (premium redesign pass) - a
 * repo has real facets (language/license/organization/topics/stars/last-
 * updated) that don't map onto this template's generic Type/Difficulty/
 * Price filters, so it gets its own filter sidebar and card design
 * rather than being forced into this shape.
 */
export async function CatalogExplorerView({ title, subtitle, basePath, searchParams, defaultResourceType }: CatalogExplorerViewProps) {
  const query = searchParams.q?.trim() ?? "";

  const typesParam = searchParams.types ?? defaultResourceType;
  const resourceTypes = typesParam ? (typesParam.split(",").filter(Boolean) as CatalogResourceType[]) : [];

  const difficulties = searchParams.difficulty ? (searchParams.difficulty.split(",").filter(Boolean) as Difficulty[]) : [];
  const prices = searchParams.price ? (searchParams.price.split(",").filter(Boolean) as Price[]) : [];
  const sort: CatalogSort = searchParams.sort === "az" ? "az" : "featured";

  const requestedPage = Number(searchParams.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const results = await getCatalogItems({
    query: query || undefined,
    resourceTypes: resourceTypes.length > 0 ? resourceTypes : undefined,
    difficulties: difficulties.length > 0 ? difficulties : undefined,
    prices: prices.length > 0 ? prices : undefined,
    sort,
    page: currentPage,
    pageSize: CATALOG_PAGE_SIZE,
  });

  function buildPageHref(targetPage: number): string {
    const next = new URLSearchParams();
    if (searchParams.q) next.set("q", searchParams.q);
    if (searchParams.types) next.set("types", searchParams.types);
    if (searchParams.difficulty) next.set("difficulty", searchParams.difficulty);
    if (searchParams.price) next.set("price", searchParams.price);
    if (searchParams.sort) next.set("sort", searchParams.sort);
    next.set("page", String(targetPage));
    return `${basePath}?${next.toString()}`;
  }

  return (
    <>
      <Header initialSearchQuery={query || undefined} />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <DeveloperHubStatsStrip />

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Developer Hub</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-500">{subtitle}</p>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="min-w-0 xl:sticky xl:top-28 xl:h-fit xl:self-start">
              <CatalogFiltersPanel types={resourceTypes} difficulties={difficulties} prices={prices} />
            </aside>

            <div id={RESULTS_ANCHOR_ID} className="min-w-0 scroll-mt-28">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">
                  {results.total.toLocaleString("en-US")} result{results.total === 1 ? "" : "s"}
                  <span className="text-slate-400"> • </span>
                  Page {results.page} of {results.totalPages}
                </p>
                <CatalogSortControl />
              </div>

              <CatalogResults items={results.items} />

              <NewsExplorerPagination page={results.page} totalPages={results.totalPages} buildHref={buildPageHref} />
            </div>
          </div>
        </div>
      </main>
      <ScrollToResultsOnPageChange anchorId={RESULTS_ANCHOR_ID} />
    </>
  );
}
