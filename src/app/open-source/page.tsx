import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Pagination } from "@/components/category/Pagination";
import { OpenSourceHero } from "@/components/open-source/OpenSourceHero";
import { OpenSourceFilterBar } from "@/components/open-source/OpenSourceFilterBar";
import { RepositoryListCard } from "@/components/open-source/RepositoryListCard";
import { OpenSourceSidebar } from "@/components/open-source/OpenSourceSidebar";
import { getOpenSourceRepos, type OpenSourceSort } from "@/services/open-source/open-source-service";

// Stabilization pass: force-dynamic (never statically cached) so an
// admin-added/edited/hidden repository (`/admin/repositories`) shows up
// here on the very next request, not after the next deploy/cache purge.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Open Source | VIREXA",
  description: "Discover trending open source repositories from GitHub.",
};

const VALID_SORTS: OpenSourceSort[] = ["trending", "new", "stars", "forks", "updated"];

type OpenSourcePageSearchParams = {
  q?: string;
  sort?: string;
  topic?: string;
  page?: string;
};

type OpenSourcePageProps = {
  searchParams: Promise<OpenSourcePageSearchParams>;
};

/**
 * Open Source Explorer - a bespoke repository-discovery page. Deliberately
 * NOT built on `ExplorerView`/`CatalogExplorerView` (those are the
 * news-category/generic-catalog templates this page is explicitly asked
 * not to resemble - "This page is not a news page. It is a repository
 * explorer."). Shares the Navbar/CategoryNav/global search (`Header`)
 * with the rest of the app per "use the existing Virexa design system,"
 * but everything below the hero - filter tabs, repository list, the
 * two-card sidebar - is purpose-built. See `open-source-service.ts` for
 * the data layer (live GitHub data, honest filtering/sorting/pagination).
 */
export default async function OpenSourcePage({ searchParams }: OpenSourcePageProps) {
  const params = await searchParams;
  const sort = params.sort && VALID_SORTS.includes(params.sort as OpenSourceSort) ? (params.sort as OpenSourceSort) : "trending";
  const topic = params.topic || undefined;
  const query = params.q || undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const results = await getOpenSourceRepos({ query, topic, sort, page });

  function buildHref(overrides: Partial<{ sort: OpenSourceSort; topic: string | null; page: number }>): string {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    const nextSort = overrides.sort ?? sort;
    if (nextSort !== "trending") next.set("sort", nextSort);
    const nextTopic = overrides.topic === undefined ? topic : overrides.topic;
    if (nextTopic) next.set("topic", nextTopic);
    const nextPage = overrides.page ?? 1;
    if (nextPage > 1) next.set("page", String(nextPage));
    const qs = next.toString();
    return qs ? `/open-source?${qs}` : "/open-source";
  }

  return (
    <>
      <Header initialSearchQuery={query} />
      <main className="bg-[#f8fafc] px-5 py-8 dark:bg-slate-950 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="transition-colors duration-200 hover:text-slate-700 dark:hover:text-slate-200">
              Home
            </Link>
            <span aria-hidden="true">›</span>
            <span className="font-medium text-slate-950 dark:text-white">Open Source</span>
          </nav>

          <OpenSourceHero />

          <OpenSourceFilterBar activeSort={sort} buildSortHref={(nextSort) => buildHref({ sort: nextSort, page: 1 })} />

          <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {results.total.toLocaleString("en-US")} repositor{results.total === 1 ? "y" : "ies"}
                {topic && (
                  <>
                    <span className="text-slate-400"> • </span>
                    Filtered by <span className="font-semibold text-slate-700 dark:text-slate-200">{topic}</span>
                  </>
                )}
              </p>

              <div className="mt-4 flex flex-col gap-3">
                {results.items.map((repo) => (
                  <RepositoryListCard key={repo.id} repo={repo} />
                ))}

                {results.items.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    No repositories match this filter yet.
                  </div>
                )}
              </div>

              <Pagination currentPage={results.page} totalPages={results.totalPages} buildHref={(targetPage) => buildHref({ page: targetPage })} />
            </div>

            <aside className="min-w-0 xl:sticky xl:top-28 xl:h-fit xl:self-start">
              <OpenSourceSidebar topics={results.topics} activeTopic={topic} buildTopicHref={(nextTopic) => buildHref({ topic: nextTopic, page: 1 })} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
