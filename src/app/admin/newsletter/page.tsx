import type { Metadata } from "next";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatCard } from "@/components/admin/StatCard";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminNewsletterFilters } from "@/components/admin/AdminNewsletterFilters";
import { AdminNewsletterTable } from "@/components/admin/AdminNewsletterTable";
import {
  getAdminNewsletterSubscribersPage,
  getAdminNewsletterStats,
  type AdminNewsletterSortOrder,
} from "@/services/admin/admin-newsletter-service";
import { getServerTranslations } from "@/i18n/get-server-translations";

export const metadata: Metadata = {
  title: "Newsletter | Virexa Admin",
};

const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

type AdminNewsletterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toStringParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function toNumberParam(value: string | string[] | undefined): number | undefined {
  const raw = toStringParam(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toPageSizeParam(value: string | string[] | undefined): number {
  const parsed = toNumberParam(value);
  return parsed && ALLOWED_PAGE_SIZES.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

function toSortParam(value: string | string[] | undefined): AdminNewsletterSortOrder {
  return toStringParam(value) === "oldest" ? "oldest" : "newest";
}

/**
 * Newsletter MVP, requirement 5 (Admin Panel). Server Component - search/
 * sort/pagination mirror `/admin/sources` exactly (requirement 10: unified
 * pagination/filtering feel across the whole admin area). Deliberately no
 * "Add Subscriber" form here (unlike `/admin/sources`' "Add Source") -
 * subscribers are only ever created through the public homepage signup
 * flow, never manually by an admin.
 */
export default async function AdminNewsletterPage({ searchParams }: AdminNewsletterPageProps) {
  const { t } = await getServerTranslations();
  const params = await searchParams;
  const page = Math.max(1, toNumberParam(params.page) ?? 1);
  const pageSize = toPageSizeParam(params.pageSize);
  const search = toStringParam(params.q);
  const sort = toSortParam(params.sort);

  const [subscribersPage, stats] = await Promise.all([
    getAdminNewsletterSubscribersPage(search, sort, page, pageSize),
    getAdminNewsletterStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">{t("admin.newsletter.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("admin.newsletter.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("admin.newsletter.statTotal")} value={stats.total} />
        <StatCard label={t("admin.newsletter.statActive")} value={stats.active} />
        <StatCard label={t("admin.newsletter.statNewest")} value={stats.newLast7Days} hint={t("admin.newsletter.statNewestHint")} />
      </div>

      <SectionCard title={t("admin.newsletter.allSubscribersTitle")}>
        <div className="mb-5">
          <AdminNewsletterFilters />
        </div>
        {subscribersPage.items.length === 0 ? (
          <EmptyState icon="📬" title={t("admin.newsletter.emptyTitle")} description={t("admin.newsletter.emptyDescription")} />
        ) : (
          <>
            <AdminNewsletterTable items={subscribersPage.items} />
            <AdminPagination
              page={subscribersPage.page}
              pageSize={subscribersPage.pageSize}
              totalItems={subscribersPage.total}
              itemLabel={t("admin.newsletter.itemLabel")}
            />
          </>
        )}
      </SectionCard>
    </div>
  );
}
