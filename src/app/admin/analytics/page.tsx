import type { Metadata } from "next";
import Link from "next/link";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminSparklineCard } from "@/components/admin/AdminSparklineCard";
import { AdminBarChart } from "@/components/admin/AdminBarChart";
import {
  getAnalyticsSummary,
  getTimeSeries,
  getTopLists,
  getAIAnalytics,
  getRuntimeAnalyticsSnapshot,
  type AnalyticsWindow,
} from "@/services/admin/admin-analytics-service";

export const metadata: Metadata = {
  title: "Analytics | Virexa Admin",
};

const WINDOWS: { value: AnalyticsWindow; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

type AdminAnalyticsPageProps = {
  searchParams: Promise<{ window?: string }>;
};

function isAnalyticsWindow(value: string | undefined): value is AnalyticsWindow {
  return value === "24h" || value === "7d" || value === "30d";
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function formatTimestamp(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "No runs recorded yet";
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

/**
 * Admin Analytics & Monitoring (all 11 requirements). Server Component -
 * every data source is a service-layer read
 * (`admin-analytics-service.ts`), fetched in parallel via `Promise.all`
 * (requirement 9). Reused Admin Foundation components throughout
 * (`SectionCard`/`StatCard`/`StatusBadge`/`EmptyState`) plus two new,
 * dependency-free chart components (`AdminSparklineCard`,
 * `AdminBarChart` - requirement 6). Export buttons are plain `<a>` tags
 * to the new `/api/admin/export/[type]` route - no client JS needed,
 * the browser's native download handling does the rest.
 */
export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
  const params = await searchParams;
  const window: AnalyticsWindow = isAnalyticsWindow(params.window) ? params.window : "24h";

  const [summary, timeSeries, topLists, aiAnalytics, runtime] = await Promise.all([
    getAnalyticsSummary(),
    getTimeSeries(window),
    getTopLists(),
    getAIAnalytics(),
    Promise.resolve(getRuntimeAnalyticsSnapshot()),
  ]);

  const bucketLabels = timeSeries.map((point) => point.label);
  const sumBy = (pick: (point: (typeof timeSeries)[number]) => number) => timeSeries.reduce((total, point) => total + pick(point), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Traffic, engagement, AI, and runtime analytics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- CSV download, not a page navigation */}
          <a
            href="/api/admin/export/articles"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Export Articles CSV
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- CSV download, not a page navigation */}
          <a
            href="/api/admin/export/sources"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Export Sources CSV
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- CSV download, not a page navigation */}
          <a
            href="/api/admin/export/summary"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Export Summary CSV
          </a>
        </div>
      </div>

      {summary.totalArticles === 0 ? (
        <SectionCard title="Analytics">
          <EmptyState
            icon="📊"
            title="No data yet"
            description="Analytics will populate once articles have been ingested into Article Storage."
          />
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Total Articles" value={summary.totalArticles} />
            <StatCard label="Total Views" value={summary.totalViews} />
            <StatCard label="Total Bookmarks" value={summary.totalBookmarks} />
            <StatCard label="Total Shares" value={summary.totalShares} />
            <StatCard label="Active Sources" value={summary.activeSources} />
            <StatCard label="AI Enriched Articles" value={summary.aiEnrichedArticles} />
          </div>

          <SectionCard
            title="Time Series"
            description="Articles are bucketed by real publish date. View/bookmark/share numbers are each bucket's articles' current cumulative totals, not per-bucket events - Article Storage has no historical event log, and this phase doesn't change the schema."
            action={
              <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {WINDOWS.map((option) => (
                  <Link
                    key={option.value}
                    href={`/admin/analytics?window=${option.value}`}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                      window === option.value ? "bg-[#2f67e8] text-white" : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            }
          >
            {timeSeries.length === 0 ? (
              <EmptyState icon="📈" title="No time series data" description="No articles were published in this window." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <AdminSparklineCard
                  label="Article Count"
                  points={timeSeries.map((point) => point.articleCount)}
                  bucketLabels={bucketLabels}
                  total={sumBy((point) => point.articleCount)}
                  color="#2f67e8"
                />
                <AdminSparklineCard
                  label="Views"
                  points={timeSeries.map((point) => point.viewCount)}
                  bucketLabels={bucketLabels}
                  total={sumBy((point) => point.viewCount)}
                  color="#10b981"
                />
                <AdminSparklineCard
                  label="Bookmarks"
                  points={timeSeries.map((point) => point.bookmarkCount)}
                  bucketLabels={bucketLabels}
                  total={sumBy((point) => point.bookmarkCount)}
                  color="#f59e0b"
                />
                <AdminSparklineCard
                  label="Shares"
                  points={timeSeries.map((point) => point.shareCount)}
                  bucketLabels={bucketLabels}
                  total={sumBy((point) => point.shareCount)}
                  color="#8b5cf6"
                />
              </div>
            )}
          </SectionCard>

          <SectionCard title="Top Lists">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Most Viewed Articles</h3>
                <AdminBarChart
                  items={topLists.mostViewed.map((item) => ({ label: item.title, value: item.value, href: `/admin/articles?selected=${item.id}` }))}
                  emptyMessage="No article views yet."
                />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Most Bookmarked Articles</h3>
                <AdminBarChart
                  items={topLists.mostBookmarked.map((item) => ({ label: item.title, value: item.value, href: `/admin/articles?selected=${item.id}` }))}
                  color="#f59e0b"
                  emptyMessage="No bookmarks yet."
                />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Highest Trust Score</h3>
                <AdminBarChart
                  items={topLists.highestTrustScore.map((item) => ({ label: item.title, value: item.value, href: `/admin/articles?selected=${item.id}` }))}
                  color="#10b981"
                  formatValue={(value) => `${value}/100`}
                  emptyMessage="No articles yet."
                />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Highest Trending Score</h3>
                <AdminBarChart
                  items={topLists.highestTrendingScore.map((item) => ({ label: item.title, value: item.value, href: `/admin/articles?selected=${item.id}` }))}
                  color="#8b5cf6"
                  formatValue={(value) => `${value}/100`}
                  emptyMessage="No articles yet."
                />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Most Active Sources</h3>
                <AdminBarChart
                  items={topLists.mostActiveSources.map((item) => ({ label: item.name, value: item.value }))}
                  emptyMessage="No sources yet."
                />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Most Used Categories</h3>
                <AdminBarChart
                  items={topLists.mostUsedCategories.map((item) => ({
                    label: item.category,
                    value: item.value,
                    href: `/admin/articles?category=${item.category}`,
                  }))}
                  color="#f59e0b"
                  emptyMessage="No categories yet."
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="AI Analytics" description={`${aiAnalytics.totalEnriched.toLocaleString()} article(s) AI-enriched.`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg. Summary Length</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{aiAnalytics.avgSummaryLength} chars</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg. Tag Count</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{aiAnalytics.avgTagCount}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Provider Distribution</h3>
                <AdminBarChart items={aiAnalytics.providerDistribution} emptyMessage="No AI-enriched articles yet." />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Model Distribution</h3>
                <AdminBarChart items={aiAnalytics.modelDistribution} color="#10b981" emptyMessage="No AI-enriched articles yet." />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Sentiment Distribution</h3>
                <AdminBarChart items={aiAnalytics.sentimentDistribution} color="#f59e0b" emptyMessage="No sentiment data yet." />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Bias Distribution</h3>
                <AdminBarChart items={aiAnalytics.biasDistribution} color="#8b5cf6" emptyMessage="No bias data yet." />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Runtime Monitoring"
            description="Read-only snapshot of the background job engine."
            action={
              <StatusBadge
                status={runtime.isSchedulerRunning ? "healthy" : "unknown"}
                label={runtime.isSchedulerRunning ? "Scheduler Running" : "Scheduler Stopped"}
              />
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Run</p>
                <p className="mt-1 text-sm font-medium text-slate-950">{formatTimestamp(runtime.lastRunAt)}</p>
                {runtime.lastRunJobType && <p className="mt-0.5 text-xs text-slate-500">{runtime.lastRunJobType}</p>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg. Run Duration</p>
                <p className="mt-1 text-sm font-medium text-slate-950">{formatDuration(runtime.avgDurationMs)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Error</p>
                <p className="mt-1 text-sm font-medium text-slate-950">{formatTimestamp(runtime.lastErrorAt)}</p>
                {runtime.lastErrorMessage && <p className="mt-0.5 line-clamp-2 text-xs text-red-600">{runtime.lastErrorMessage}</p>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Success Rate</p>
                <p className="mt-1 text-sm font-medium text-slate-950">{formatPercent(runtime.successRatePercent)}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Queue</p>
              <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {Object.entries(runtime.queueStats).map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                    <p className="text-lg font-bold text-slate-950">{value}</p>
                    <p className="text-xs capitalize text-slate-500">{key}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
