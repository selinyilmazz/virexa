import { Header } from "@/components/layout/Header";

/** Matches the redesigned `NewsCard`'s footprint (16:9 image on top, text block below) so the loading state doesn't shift once real data arrives. */
function NewsCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-video w-full bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-2/3 rounded bg-slate-200" />
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

            <div className="min-w-0 space-y-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <NewsCardSkeleton key={index} />
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
