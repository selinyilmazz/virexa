import { Header } from "@/components/layout/Header";

/** Matches `NewsExplorerCard`'s row footprint (thumbnail left, text block right) so the loading state doesn't shift once the real, `trending_score`-ranked list arrives - same skeleton shape `search/loading.tsx` uses for the same reason. */
function NewsExplorerCardSkeleton() {
  return (
    <div className="flex animate-pulse gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="hidden size-28 shrink-0 rounded-xl bg-slate-200 sm:block" />
      <div className="flex-1 space-y-2.5 py-1">
        <div className="h-5 w-20 rounded-full bg-slate-200" />
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-3 w-1/3 rounded bg-slate-200" />
      </div>
    </div>
  );
}

/** Automatic Suspense fallback for `/most-read` while the real, `trending_score`-ranked, paginated Explorer listing resolves - mirrors `ExplorerView`'s actual layout (stats strip, breadcrumb/title, filters/results/sidebar grid) so nothing shifts once real data arrives. */
export default function MostReadLoading() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <div className="h-[72px] animate-pulse rounded-2xl bg-slate-200" />

          <div className="mt-6 animate-pulse space-y-3">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-9 w-56 rounded bg-slate-200" />
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
            <aside className="min-w-0">
              <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
            </aside>

            <div className="min-w-0 space-y-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <NewsExplorerCardSkeleton key={index} />
              ))}
            </div>

            <aside className="min-w-0 space-y-6">
              <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
