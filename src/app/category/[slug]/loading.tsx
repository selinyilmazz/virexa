import { Header } from "@/components/layout/Header";

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

/** Automatic Suspense fallback for `/category/[slug]` while the real, database-backed news + pagination resolve. */
export default function CategoryLoading() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-48 rounded bg-slate-200" />
            <div className="h-9 w-72 rounded bg-slate-200" />
            <div className="h-4 w-96 max-w-full rounded bg-slate-200" />
          </div>

          <div className="mt-5 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
            <div className="min-w-0 grid gap-6 md:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <NewsCardSkeleton key={index} />
              ))}
            </div>

            <aside className="min-w-0 space-y-6">
              <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />
              <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
