import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import { HealthOverviewSection } from "@/components/admin/HealthOverviewSection";
import { RuntimeStatusSection } from "@/components/admin/RuntimeStatusSection";
import { getDashboardStats } from "@/services/admin/admin-dashboard-service";

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
};

/**
 * Admin Dashboard home (`/admin`). Real summary numbers (requirement
 * 3) plus a compact preview of System Health and Runtime Status
 * (requirements 4/5 both literally say "Dashboard üzerinde ... kartlar
 * oluştur") - the same two sections, full-detail, also live at their
 * own sidebar destinations (`/admin/health`, `/admin/runtime`).
 */
export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Live overview of Virexa&apos;s content, users, and system status.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Articles" value={stats.totalArticles} icon={icons.articles} />
        <StatCard label="Total Sources" value={stats.totalSources} icon={icons.sources} />
        <StatCard label="Total Users" value={stats.totalUsers} icon={icons.users} />
        <StatCard label="Added in Last 24h" value={stats.articlesLast24h} icon={icons.fresh} />
        <StatCard label="Total Bookmarks" value={stats.totalBookmarks} icon={icons.bookmarks} />
        <StatCard label="Total Views" value={stats.totalViews} icon={icons.views} />
      </div>

      <HealthOverviewSection compact />
      <div className="flex justify-end">
        <Link href="/admin/health" className="text-sm font-semibold text-[#2f67e8] hover:text-[#2556c9]">
          View full health report →
        </Link>
      </div>

      <RuntimeStatusSection compact />
      <div className="flex justify-end">
        <Link href="/admin/runtime" className="text-sm font-semibold text-[#2f67e8] hover:text-[#2556c9]">
          View full runtime status →
        </Link>
      </div>
    </div>
  );
}
