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

/** Matches the horizontal-scroll strip shape `BreakingNews`/`RecentlyAdded` both use. */
function StripSkeleton({ count, cardWidth }: { count: number; cardWidth: string }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`h-20 shrink-0 animate-pulse rounded-2xl bg-slate-200 ${cardWidth}`} />
      ))}
    </div>
  );
}

/**
 * Automatic Suspense fallback for `/` (Next.js's `loading.tsx`
 * convention) while the homepage's real database reads resolve -
 * "hiçbir zaman boş ekran gösterilmeyecek". Mirrors the redesigned
 * page's actual section order/shapes (dominant hero, breaking news
 * strip, company row, latest news grid, editor's picks grid, AI
 * Explained dark panel, recently added strip, sidebar) so there's no
 * layout jump once real content arrives. `Header` is included so the
 * page chrome doesn't disappear/reflow during the loading phase.
 */
export default function HomeLoading() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-[1820px] gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
          <div className="min-w-0">
            <div className="aspect-video w-full animate-pulse rounded-3xl bg-slate-200 sm:aspect-[16/8] lg:aspect-[16/7]" />

            <div className="mt-6">
              <StripSkeleton count={4} cardWidth="w-[280px] sm:w-[320px]" />
            </div>

            <div className="mt-6 grid animate-pulse gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 rounded-2xl bg-slate-200" />
              ))}
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <NewsCardSkeleton key={index} />
              ))}
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <NewsCardSkeleton key={index} />
              ))}
            </div>

            <div className="mt-12 h-64 animate-pulse rounded-3xl bg-slate-800/80" />

            <div className="mt-12">
              <StripSkeleton count={6} cardWidth="w-[220px]" />
            </div>
          </div>
          <aside className="min-w-0 space-y-6">
            <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />
            <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
          </aside>
        </div>
      </main>
    </>
  );
}
