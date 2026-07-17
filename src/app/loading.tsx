import { Header } from "@/components/layout/Header";

/** Skeleton news-card placeholder, matching `NewsCard`'s footprint (image + text block) so the layout doesn't shift once real data arrives. */
function NewsCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="aspect-[3/2] w-full shrink-0 rounded-2xl bg-slate-200 sm:w-36" />
        <div className="min-w-0 flex-1 space-y-3 py-1">
          <div className="h-5 w-20 rounded-full bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

/**
 * Automatic Suspense fallback for `/` (Next.js's `loading.tsx`
 * convention) while `HeroSection`, `LatestNews`, `TrendingTopics` and
 * `MostRead` resolve their real database reads - "hiçbir zaman boş ekran
 * gösterilmeyecek". `Header` is included so the page chrome doesn't
 * disappear/reflow during the loading phase.
 */
export default function HomeLoading() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-[1820px] gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
          <div className="min-w-0 space-y-6">
            <div className="aspect-[12/5] w-full animate-pulse rounded-3xl bg-slate-200" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 w-40 shrink-0 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <NewsCardSkeleton key={index} />
              ))}
            </div>
          </div>
          <aside className="min-w-0 space-y-6">
            <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
            <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />
          </aside>
        </div>
      </main>
    </>
  );
}
