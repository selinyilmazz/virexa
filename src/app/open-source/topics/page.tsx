import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Pagination } from "@/components/category/Pagination";
import { getOpenSourceRepos } from "@/services/open-source/open-source-service";

export const metadata = {
  title: "Open Source Topics | VIREXA",
  description: "Browse every repository topic tracked by Virexa's Open Source Explorer.",
};

const TOPICS_PAGE_SIZE = 24;

type TopicsPageSearchParams = {
  q?: string;
  page?: string;
};

type TopicsPageProps = {
  searchParams: Promise<TopicsPageSearchParams>;
};

/**
 * Open Source Explorer's "View all topics" destination - a dedicated
 * listing of every real topic across the tracked repository pool (see
 * `open-source-service.ts`'s `computeTopics`), each with its true repo
 * count, a simple name search, and pagination (mostly future-proofing:
 * the tracked pool is small today, but this page shouldn't need a
 * rewrite if it grows). Clicking a topic goes to the same repository
 * list the sidebar's topic links use (`/open-source?topic=...`) - one
 * filtering mechanism, two entry points.
 */
export default async function OpenSourceTopicsPage({ searchParams }: TopicsPageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const { topics: allTopics } = await getOpenSourceRepos({});
  const filtered = query ? allTopics.filter((topic) => topic.name.toLowerCase().includes(query.toLowerCase())) : allTopics;

  const totalPages = Math.max(1, Math.ceil(filtered.length / TOPICS_PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * TOPICS_PAGE_SIZE;
  const pageItems = filtered.slice(start, start + TOPICS_PAGE_SIZE);

  function buildHref(targetPage: number): string {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (targetPage > 1) next.set("page", String(targetPage));
    const qs = next.toString();
    return qs ? `/open-source/topics?${qs}` : "/open-source/topics";
  }

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 dark:bg-slate-950 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="transition-colors duration-200 hover:text-slate-700 dark:hover:text-slate-200">
              Home
            </Link>
            <span aria-hidden="true">›</span>
            <Link href="/open-source" className="transition-colors duration-200 hover:text-slate-700 dark:hover:text-slate-200">
              Open Source
            </Link>
            <span aria-hidden="true">›</span>
            <span className="font-medium text-slate-950 dark:text-white">Topics</span>
          </nav>

          <div className="mt-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Repository Topics</h1>
            <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-400">
              Browse every topic across the repositories Virexa tracks, and jump straight to a filtered list.
            </p>
          </div>

          <form action="/open-source/topics" method="GET" className="mt-6 max-w-md">
            <label htmlFor="topic-search" className="sr-only">
              Search topics
            </label>
            <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-colors focus-within:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
              <input
                id="topic-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search topics..."
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </form>

          <p className="mt-6 text-sm font-medium text-slate-500 dark:text-slate-400">
            {filtered.length.toLocaleString("en-US")} topic{filtered.length === 1 ? "" : "s"}
            {query && (
              <>
                <span className="text-slate-400"> • </span>
                Matching &quot;{query}&quot;
              </>
            )}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((topic) => (
              <Link
                key={topic.name}
                href={`/open-source?topic=${encodeURIComponent(topic.name)}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="truncate text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">{topic.name.replace(/-/g, " ")}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {topic.count} repo{topic.count === 1 ? "" : "s"}
                </span>
              </Link>
            ))}

            {pageItems.length === 0 && (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                No topics match &quot;{query}&quot;.
              </div>
            )}
          </div>

          <Pagination currentPage={clampedPage} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </main>
    </>
  );
}
