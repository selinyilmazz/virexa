import { LoadingCard } from "@/components/admin/LoadingCard";

/**
 * Route-specific skeleton for `/admin/analytics` (requirement 8) - shown
 * while the five parallel analytics reads
 * (`getAnalyticsSummary`/`getTimeSeries`/`getTopLists`/`getAIAnalytics`/
 * `getRuntimeAnalyticsSnapshot`) resolve. Shaped like the real page
 * (summary card grid, then one skeleton block per section) rather than
 * the generic `/admin/loading.tsx` fallback, so the layout doesn't jump
 * once real data arrives.
 */
export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-7 w-56 rounded bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingCard key={index} lines={2} />
        ))}
      </div>

      <LoadingCard lines={5} />
      <LoadingCard lines={6} />
      <LoadingCard lines={5} />
      <LoadingCard lines={4} />
    </div>
  );
}
