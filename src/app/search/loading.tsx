import { Header } from "@/components/layout/Header";

/** Matches `SearchResultCard`'s compact horizontal footprint (small thumbnail + text) so the loading state doesn't shift once real results arrive. */
function SearchResultCardSkeleton() {
  return (
    <div className="flex animate-pulse gap-4 rounded-2xl border border-slate-200 bg-white p-3.5">
      <div className="size-20 shrink-0 rounded-xl bg-slate-200 sm:size-24" />
      <div className="flex-1 space-y-2.5 py-1">
        <div className="h-3 w-16 rounded bg-slate-200" />
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-1/3 rounded bg-slate-200" />
      </div>
    </div>
  );
}

/** Automatic Suspense fallback for `/search` while the real, repository-backed search (title/category/time/etc.) and filter counts resolve. */
export default function SearchLoading() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-48 rounded bg-slate-200" />
            <div className="h-9 w-72 rounded bg-slate-200" />
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
            <aside className="min-w-0 space-y-6">
              <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
              <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />
            </aside>

            <div className="min-w-0 space-y-2.5">
              {Array.from({ length: 8 }).map((_, index) => (
                <SearchResultCardSkeleton key={index} />
              ))}
            </div>

            <aside className="min-w-0">
              <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
