import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { HealthOverviewSection } from "@/components/admin/HealthOverviewSection";
import { RuntimeStatusSection } from "@/components/admin/RuntimeStatusSection";
import { getDashboardStats } from "@/services/admin/admin-dashboard-service";
import { getAdminRecentActivity, type AdminActivityKind } from "@/services/admin/admin-activity-service";

export const metadata: Metadata = {
  title: "Dashboard | Virexa Admin",
};

/** Forces this page to always render fresh, per-request - see `RuntimeStatusSection`'s doc comment (`components/admin/RuntimeStatusSection.tsx`) for why this matters alongside that component's data-source fix. */
export const dynamic = "force-dynamic";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  className: "size-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
} as const;

const icons = {
  articles: (
    <svg {...ICON_PROPS}>
      <path d="M6 3.5h9L19 8v12.5H6z" strokeLinejoin="round" />
      <path d="M9 12h6M9 15.5h6" strokeLinecap="round" />
    </svg>
  ),
  sources: (
    <svg {...ICON_PROPS}>
      <path d="M4 4.5c8 0 15.5 7.5 15.5 15.5" strokeLinecap="round" />
      <circle cx="5" cy="19" r="1.8" />
    </svg>
  ),
  users: (
    <svg {...ICON_PROPS}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" strokeLinecap="round" />
    </svg>
  ),
  fresh: (
    <svg {...ICON_PROPS}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" strokeLinecap="round" />
    </svg>
  ),
  bookmarks: (
    <svg {...ICON_PROPS}>
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
    </svg>
  ),
  views: (
    <svg {...ICON_PROPS}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ),
  repositories: (
    <svg {...ICON_PROPS}>
      <path d="M4 3.5h16v8.5H4z" strokeLinejoin="round" />
      <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" strokeLinejoin="round" />
    </svg>
  ),
  releases: (
    <svg {...ICON_PROPS}>
      <path d="M12 3v10M12 13l4-4M12 13 8 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/**
 * Admin Dashboard home (`/admin`). Real summary numbers (requirement
 * 3) plus a compact preview of System Health and Runtime Status
 * (requirements 4/5 both literally say "Dashboard üzerinde ... kartlar
 * oluştur") - the same two sections, full-detail, also live at their
 * own sidebar destinations (`/admin/health`, `/admin/runtime`).
 */
const ACTIVITY_ICON: Record<AdminActivityKind, string> = {
  article: "📰",
  user: "👤",
  audit: "🛠",
};

export default async function AdminDashboardPage() {
  const [stats, activity] = await Promise.all([getDashboardStats(), getAdminRecentActivity()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Live overview of Virexa&apos;s content, users, and system status.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Articles" value={stats.totalArticles} icon={icons.articles} />
        <StatCard label="Total Sources" value={stats.totalSources} icon={icons.sources} />
        <StatCard label="Repositories" value={stats.totalRepositories} icon={icons.repositories} />
        <StatCard label="Developer Releases" value={stats.totalDeveloperReleases} icon={icons.releases} />
        <StatCard label="Total Users" value={stats.totalUsers} icon={icons.users} />
        <StatCard label="Total Bookmarks" value={stats.totalBookmarks} icon={icons.bookmarks} />
        <StatCard label="Total Views" value={stats.totalViews} icon={icons.views} />
        <StatCard label="Articles Today" value={stats.articlesLast24h} icon={icons.fresh} />
      </div>

      <SectionCard title="Recent Activity" description="Real-time feed of published articles, new users, and admin actions - the Audit Log lives here now instead of its own page.">
        {activity.length === 0 ? (
          <EmptyState icon="🕒" title="No recent activity" description="Activity will show up here as articles are published, users sign up, or admins make changes." />
        ) : (
          <ul className="space-y-1">
            {activity.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50"
                >
                  <span aria-hidden="true" className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm">
                    {ACTIVITY_ICON[item.kind]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-950">{item.title}</span>
                    <span className="block truncate text-xs text-slate-500">{item.description}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{item.timestamp}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* System Health now lives only on the Dashboard (the standalone
          /admin/health page was removed - see admin-nav-items.tsx). Full
          detail (raw checks table included), not the compact preview,
          since there's no separate "view full report" destination anymore. */}
      <HealthOverviewSection />

      <RuntimeStatusSection compact />
      <div className="flex justify-end">
        <Link href="/admin/runtime" className="text-sm font-semibold text-[#2f67e8] hover:text-[#2556c9]">
          View full runtime status →
        </Link>
      </div>
    </div>
  );
}
