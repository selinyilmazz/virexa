import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { NewsCard } from "@/components/news/NewsCard";
import { Pagination } from "@/components/category/Pagination";
import { getMostReadPage } from "@/services/articles/article-read-service";

const PAGE_SIZE = 10;

export const metadata: Metadata = {
  title: "Most Read | Virexa",
};

type MostReadPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function MostReadPage({ searchParams }: MostReadPageProps) {
  const { page } = await searchParams;
  const requestedPage = Number(page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  // Exact, DB-ordered pagination by trending_score - see
  // `article-read-service.ts`'s `getMostReadPage` for why this is a
  // separate function from the Home widget's heuristic view-count ranking.
  const mostRead = await getMostReadPage(currentPage, PAGE_SIZE);

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="transition-colors hover:text-[#2f67e8]">
              Home
            </Link>
            <span aria-hidden="true">›</span>
            <span className="font-medium text-slate-950">Most Read</span>
          </nav>

          <div className="mt-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">📈 Most Read</h1>
            <p className="mt-2 text-base text-slate-500">The most viewed articles on Virexa today.</p>
          </div>

          {mostRead.items.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <span className="text-4xl" aria-hidden="true">
                📈
              </span>
              <p className="mt-3 text-base font-semibold text-slate-700">No articles yet</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Once articles start gathering views, the most-read ranking will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-8 max-w-3xl space-y-6">
                {mostRead.items.map((item) => (
                  <NewsCard key={item.slug} {...item} />
                ))}
              </div>
              <Pagination
                currentPage={mostRead.page}
                totalPages={mostRead.totalPages}
                buildHref={(targetPage) => `/most-read?page=${targetPage}`}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
