import { Header } from "@/components/layout/Header";

/** Matches `NewsCard`'s footprint (16:9 image on top, text block below) so the loading state doesn't shift once real data arrives. */
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

/** Matches the horizontal-scroll strip shape `BreakingNews` uses. */
function StripSkeleton({ count, cardWidth }: { count: number; cardWidth: string }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`h-20 shrink-0 animate-pulse rounded-2xl bg-slate-200 ${cardWidth}`} />
      ))}
    </div>
  );
}

/** Matches the compact vertical `TrendingTopicCard` list's footprint. */
function SidebarListSkeleton({ count }: { count: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-6 w-36 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-xl border border-slate-100 bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

/**
 * Automatic Suspense fallback for `/` (Next.js's `loading.tsx`
 * convention) while the homepage's real database reads resolve -
 * "hiçbir zaman boş ekran gösterilmeyecek". Mirrors the homepage's
 * actual layout (product polishing phase, 3rd pass, layout correction
 * #2): a left column (Hero, Breaking News, Latest News) beside an
 * independent right sidebar column (Trending Topics, Trending
 * Companies) - two `xl:col-span-*` columns in one 12-col grid, not a
 * single-row grid, so the skeleton's proportions match the real layout's
 * "columns never wait on each other" behavior. `Header` is included so
 * the page chrome doesn't disappear/reflow during loading.
 */
export default function HomeLoading() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="min-w-0 space-y-10 xl:col-span-8">
            <div className="aspect-video w-full animate-pulse rounded-3xl bg-slate-200 sm:aspect-[16/8] lg:aspect-[16/7]" />

            <StripSkeleton count={4} cardWidth="w-[280px] sm:w-[320px]" />

            <div className="grid gap-6 sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <NewsCardSkeleton key={index} />
              ))}
            </div>
          </div>

          <div className="min-w-0 space-y-6 xl:col-span-4">
            <SidebarListSkeleton count={6} />
            <SidebarListSkeleton count={5} />
          </div>
        </div>
      </main>
    </>
  );
}
