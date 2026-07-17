/**
 * Route-specific skeleton for `/admin/sources` (requirement 8) - shown
 * while `getAdminSourcesList()` resolves. Table-shaped rather than the
 * generic `/admin/loading.tsx` fallback.
 */
export default function AdminSourcesLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-7 w-56 rounded bg-slate-200" />
      </div>

      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-32 rounded bg-slate-200" />
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
