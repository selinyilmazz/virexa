import { Header } from "@/components/layout/Header";
import { DeveloperHubStatsStrip } from "@/components/developer-hub/DeveloperHubStatsStrip";
import { GithubFiltersPanel } from "@/components/developer-hub/GithubFiltersPanel";
import { GithubRepoCard } from "@/components/developer-hub/GithubRepoCard";
import { GithubSortControl } from "@/components/developer-hub/GithubSortControl";
import { DeveloperPulse } from "@/components/explorer/DeveloperPulse";
import { NewsExplorerPagination } from "@/components/news-explorer/NewsExplorerPagination";
import { ScrollToResultsOnPageChange } from "@/components/news-explorer/ScrollToResultsOnPageChange";
import { CATALOG_PAGE_SIZE, type GithubExplorerSearchParams } from "@/lib/developer-hub/shared";
import { getGithubExplorerItems, type GithubExplorerSort, type GithubUpdatedWindow } from "@/services/developer-hub/developer-hub-service";

const RESULTS_ANCHOR_ID = "github-explorer-results";

function splitParam(value: string | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

/**
 * GitHub Explorer's dedicated page template - same overall shell as
 * `CatalogExplorerView` (Header / stats strip / title / sidebar+results+
 * pagination grid / smooth scroll-to-results, matching the News Explorer
 * design language the user asked for) but wired to
 * `getGithubExplorerItems` and its own Language/License/Stars/Updated/
 * Topics/Organization facets instead of the generic Type/Difficulty/
 * Price filters, since a repo has neither a difficulty nor a price.
 * Deliberately a separate component from `CatalogExplorerView` (not a
 * variant/prop-flag on it) so every other Developer Hub sub-page keeps
 * working exactly as before.
 *
 * Also gets its own `DeveloperPulse` sidebar (Developer Pulse redesign
 * pass), scoped to `"open-source"` - the user's explicit example for
 * "GitHub Explorer" is React/Next.js/Supabase/Shadcn/ui/Biome/Bun, i.e.
 * the same open-source-flavored topic set `/open-source` uses.
 */
export async function GithubExplorerView({ searchParams }: { searchParams: GithubExplorerSearchParams }) {
  const query = searchParams.q?.trim() ?? "";
  const languages = splitParam(searchParams.lang);
  const licenses = splitParam(searchParams.license);
  const organizations = splitParam(searchParams.org);
  const topics = splitParam(searchParams.topic);
  const minStars = searchParams.stars ? Number(searchParams.stars) : undefined;
  const updatedWithin = (searchParams.updated as GithubUpdatedWindow | undefined) || undefined;
  const sort: GithubExplorerSort = searchParams.sort === "updated" ? "updated" : searchParams.sort === "name" ? "name" : "stars";

  const requestedPage = Number(searchParams.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const results = await getGithubExplorerItems({
    query: query || undefined,
    languages: languages.length > 0 ? languages : undefined,
    licenses: licenses.length > 0 ? licenses : undefined,
    organizations: organizations.length > 0 ? organizations : undefined,
    topics: topics.length > 0 ? topics : undefined,
    minStars,
    updatedWithin,
    sort,
    page: currentPage,
    pageSize: CATALOG_PAGE_SIZE,
  });

  function buildPageHref(targetPage: number): string {
    const next = new URLSearchParams();
    if (searchParams.q) next.set("q", searchParams.q);
    if (searchParams.lang) next.set("lang", searchParams.lang);
    if (searchParams.license) next.set("license", searchParams.license);
    if (searchParams.org) next.set("org", searchParams.org);
    if (searchParams.topic) next.set("topic", searchParams.topic);
    if (searchParams.stars) next.set("stars", searchParams.stars);
    if (searchParams.updated) next.set("updated", searchParams.updated);
    if (searchParams.sort) next.set("sort", searchParams.sort);
    next.set("page", String(targetPage));
    return `/developer-hub/github?${next.toString()}`;
  }

  return (
    <>
      <Header initialSearchQuery={query || undefined} />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <DeveloperHubStatsStrip />

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Developer Hub</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">GitHub Explorer</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-500">
              Live stars, forks and activity for well-known open source repositories.
            </p>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
            <aside className="min-w-0 xl:sticky xl:top-28 xl:h-fit xl:self-start">
              <GithubFiltersPanel
                facets={results.facets}
                languages={languages}
                licenses={licenses}
                organizations={organizations}
                topics={topics}
                minStars={searchParams.stars}
                updatedWithin={searchParams.updated}
              />
            </aside>

            <div id={RESULTS_ANCHOR_ID} className="min-w-0 scroll-mt-28">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">
                  {results.total.toLocaleString("en-US")} repositor{results.total === 1 ? "y" : "ies"}
                  <span className="text-slate-400"> • </span>
                  Page {results.page} of {results.totalPages}
                </p>
                <GithubSortControl />
              </div>

              {results.items.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center">
                  <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
                    🔍
                  </span>
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-950">No repositories match these filters</h3>
                  <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">Try widening your filters or clearing the search.</p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {results.items.map((item) => (
                    <GithubRepoCard key={item.id} item={item} />
                  ))}
                </div>
              )}

              <NewsExplorerPagination page={results.page} totalPages={results.totalPages} buildHref={buildPageHref} />
            </div>

            <aside className="min-w-0 xl:sticky xl:top-28 xl:h-fit xl:self-start">
              <DeveloperPulse topic="open-source" />
            </aside>
          </div>
        </div>
      </main>
      <ScrollToResultsOnPageChange anchorId={RESULTS_ANCHOR_ID} />
    </>
  );
}
