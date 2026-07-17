import { LoadingCard } from "@/components/admin/LoadingCard";

/**
 * Automatic Suspense fallback for every route under `/admin`
 * (Next.js's `loading.tsx` convention - one file here covers the whole
 * segment tree, so every admin page gets a non-blank loading state
 * without a per-page copy: "Tüm admin sayfalarında ... loading.tsx").
 * `AdminSidebar`/`AdminHeader` (part of `layout.tsx`) stay mounted
 * throughout - only the page content area swaps to this skeleton.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-7 w-48 rounded bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingCard key={index} lines={2} />
        ))}
      </div>

      <LoadingCard lines={4} />
      <LoadingCard lines={4} />
    </div>
  );
}
