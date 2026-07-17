import { Header } from "@/components/layout/Header";

/** Automatic Suspense fallback for `/article/[slug]` while the article row, its AI enrichment, and similar articles resolve. */
export default function ArticleLoading() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />

          <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.42fr)]">
            <div className="min-w-0 space-y-6">
              <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="aspect-[12/5] w-full rounded-3xl bg-slate-200" />
                <div className="mt-6 h-6 w-24 rounded-full bg-slate-200" />
                <div className="mt-4 h-8 w-full rounded bg-slate-200" />
                <div className="mt-2 h-8 w-2/3 rounded bg-slate-200" />
                <div className="mt-6 space-y-3 border-y border-slate-200 py-5">
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                </div>
                <div className="mt-6 space-y-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-4 w-full rounded bg-slate-200" />
                  ))}
                </div>
              </div>
              <div className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" />
            </div>

            <aside className="min-w-0">
              <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
