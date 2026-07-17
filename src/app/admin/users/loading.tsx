/** Route-specific skeleton for `/admin/users` (requirement 7/8) - table-shaped, matching the real page's layout while `getAdminUsersPage()` resolves. */
export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-7 w-40 rounded bg-slate-200" />
      </div>

      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-24 rounded bg-slate-200" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-9 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>

      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-32 rounded bg-slate-200" />
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="h-10 bg-slate-50" />
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-12 bg-white px-4" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
