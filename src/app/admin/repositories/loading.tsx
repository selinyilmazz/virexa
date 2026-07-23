/**
 * Route-specific skeleton for `/admin/repositories`, matching the
 * convention of `admin/sources/loading.tsx` and `admin/articles/loading.tsx`.
 */
export default function AdminRepositoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-7 w-40 rounded bg-slate-200" />
        <div className="h-4 w-64 rounded bg-slate-200" />
      </div>

      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-36 rounded bg-slate-200" />
        <div className="mt-5 h-11 w-full max-w-xl rounded-xl bg-slate-100" />
      </div>

      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="h-10 bg-slate-50" />
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-14 bg-white px-4" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
