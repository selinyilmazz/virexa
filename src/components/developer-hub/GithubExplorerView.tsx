import { Header } from "@/components/layout/Header";
import { FiltersDrawer } from "@/components/explorer/FiltersDrawer";
import { GithubHero } from "@/components/developer-hub/GithubHero";
import { GithubFeaturedCollections } from "@/components/developer-hub/GithubFeaturedCollections";
import { GithubQuickStats } from "@/components/developer-hub/GithubQuickStats";
import { GithubLibraryFiltersPanel } from "@/components/developer-hub/GithubLibraryFiltersPanel";
import { GithubLibraryCard } from "@/components/developer-hub/GithubLibraryCard";
import { GithubLibrarySortControl } from "@/components/developer-hub/GithubLibrarySortControl";
import { NewsExplorerPagination } from "@/components/news-explorer/NewsExplorerPagination";
import { ScrollToResultsOnPageChange } from "@/components/news-explorer/ScrollToResultsOnPageChange";
import type { GithubLibrarySearchParams } from "@/lib/developer-hub/shared";
import {
  getFeaturedCategoryCollections,
  getGithubLibraryRepos,
  getGithubQuickStats,
  getHeroCarouselRepos,
  getVisibleCollections,
  parseGithubLibrarySearchParams,
  GITHUB_LIBRARY_PAGE_SIZE,
} from "@/services/developer-hub/github-explorer-service";

const RESULTS_ANCHOR_ID = "github-library-results";

/**
 * GitHub Explorer, rebuilt as a "Developer Knowledge Library" rather than
 * a GitHub Trending clone (redesign spec). Every section reads real,
 * admin-curated `repositories` table data via `github-explorer-service.ts`
 * (built in the migration/service-layer phase of this redesign) - nothing
 * here is a hardcoded list or a live, un-curatable GitHub API pool
 * anymore (that's what the OLD `GithubExplorerView` did via
 * `getGithubExplorerItems`/`getTrendingGithubRepos`, both still used
 * elsewhere in Developer Hub's generic catalog and intentionally left
 * alone - this file is the one dedicated surface being redesigned).
 *
 * Section order matches the spec: Hero (auto-sliding curated showcase) ->
 * Featured Collections (9-category grid + admin collections) -> Quick
 * Stats (4 real counts) -> Filters/Sort/Results/Pagination. Every filter
 * round-trips through the URL (`GithubLibrarySearchParams`) so a reload
 * or shared link reproduces the exact same result set - no client-only
 * filter state.
 */
export async function GithubExplorerView({ searchParams }: { searchParams: GithubLibrarySearchParams }) {
  const filters = parseGithubLibrarySearchParams(searchParams);
  const currentPage = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;

  const [results, quickStats, featuredCategories, namedCollections, heroRepos] = await Promise.all([
    getGithubLibraryRepos({ ...filters, page: currentPage, pageSize: GITHUB_LIBRARY_PAGE_SIZE }),
    getGithubQuickStats(),
    getFeaturedCategoryCollections(),
    getVisibleCollections(),
    getHeroCarouselRepos(10),
  ]);

  function buildPageHref(targetPage: number): string {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || !value) continue;
      next.set(key, value as string);
    }
    next.set("page", String(targetPage));
    return `/developer-hub/github?${next.toString()}`;
  }

  return (
    <>
      <Header initialSearchQuery={searchParams.q || undefined} />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px] space-y-10">
          <GithubHero repos={heroRepos} totalCurated={quickStats.curatedRepositoriesCount} />

          <GithubFeaturedCollections categories={featuredCategories} namedCollections={namedCollections} activeCategory={searchParams.category} />

          <section>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">Quick Stats</h2>
            <div className="mt-4">
              <GithubQuickStats stats={quickStats} />
            </div>
          </section>

          <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="min-w-0 xl:sticky xl:top-28 xl:h-fit xl:self-start">
              <FiltersDrawer>
                <GithubLibraryFiltersPanel facets={results.facets} collections={namedCollections} />
              </FiltersDrawer>
            </aside>

            <div id={RESULTS_ANCHOR_ID} className="min-w-0 scroll-mt-28">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">
                  {results.total.toLocaleString("en-US")} repositor{results.total === 1 ? "y" : "ies"}
                  <span className="text-slate-400"> • </span>
                  Page {results.page} of {results.totalPages}
                </p>
                <GithubLibrarySortControl />
              </div>

              {results.dataUnavailable ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/50 px-6 py-16 text-center">
                  <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-red-100 text-3xl">
                    ⚠️
                  </span>
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-950">Something went wrong loading repositories</h3>
                  <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">
                    We couldn&apos;t reach the repository library right now. Please try again in a moment.
                  </p>
                </div>
              ) : results.items.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center">
                  <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
                    🔍
                  </span>
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-950">No repositories match these filters</h3>
                  <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">Try widening your filters or clearing the search.</p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {results.items.map((repo) => (
                    <GithubLibraryCard key={repo.id} repo={repo} />
                  ))}
                </div>
              )}

              <NewsExplorerPagination page={results.page} totalPages={results.totalPages} buildHref={buildPageHref} />
            </div>
          </div>
        </div>
      </main>
      <ScrollToResultsOnPageChange anchorId={RESULTS_ANCHOR_ID} />
    </>
  );
}
