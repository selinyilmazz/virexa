import { LoadingCard } from "@/components/admin/LoadingCard";

/** Route-specific skeleton for `/admin/settings` (requirement 7/8). */
export default function AdminSettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-7 w-48 rounded bg-slate-200" />
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <LoadingCard key={index} lines={3} />
      ))}
    </div>
  );
}
