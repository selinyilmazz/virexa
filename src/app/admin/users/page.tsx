import type { Metadata } from "next";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminUserFilters } from "@/components/admin/AdminUserFilters";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { getAdminUsersPage, type AdminUserFilters as UserFilters, type AdminUserListItem } from "@/services/admin/admin-user-service";
import { getServerTranslations } from "@/i18n/get-server-translations";
import type { TFunction } from "@/i18n/translate";

export const metadata: Metadata = {
  title: "Users | Virexa Admin",
};

const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toStringParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function toPageSizeParam(value: string | string[] | undefined): number {
  const raw = toStringParam(value);
  const parsed = raw ? Number(raw) : undefined;
  return parsed && ALLOWED_PAGE_SIZES.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

function toBooleanParam(value: string | string[] | undefined): boolean | undefined {
  const raw = toStringParam(value);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

function formatDate(value: string | null, t: TFunction): string {
  return value ? new Date(value).toLocaleDateString() : t("admin.repositories.never");
}

/**
 * Admin Users Management (requirement 1). Server Component - reads
 * filters/search/pagination from `searchParams`, calls
 * `getAdminUsersPage()` (service-role backed, see that file's doc
 * comment for why), renders through the reused `AdminTable`/
 * `SectionCard`/`Pagination`/`StatusBadge`. Role change and Suspend/
 * Reactivate are the only two write actions (requirement 1's explicit
 * list), both via `/api/admin/users/[id]`.
 */
export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { t } = await getServerTranslations();
  const params = await searchParams;
  const currentAdmin = await getAdminUserOrNull();

  const page = Math.max(1, Number(toStringParam(params.page)) || 1);
  const pageSize = toPageSizeParam(params.pageSize);
  const filters: UserFilters = {
    search: toStringParam(params.q),
    role: toStringParam(params.role) === "admin" || toStringParam(params.role) === "user" ? (toStringParam(params.role) as "admin" | "user") : undefined,
    emailVerified: toBooleanParam(params.verified),
    suspended: toBooleanParam(params.suspended),
  };

  const usersPage = await getAdminUsersPage(filters, page, pageSize);

  const columns: AdminTableColumn<AdminUserListItem>[] = [
    { key: "displayName", header: t("admin.users.columnUser"), className: "font-medium text-slate-950" },
    { key: "email", header: t("admin.users.columnEmail"), className: "text-slate-500" },
    {
      key: "role",
      header: t("admin.users.columnRole"),
      render: (row) => <StatusBadge status={row.role === "admin" ? "healthy" : "unknown"} label={row.role === "admin" ? t("admin.common.admin") : t("admin.users.roleUser")} />,
    },
    {
      key: "emailVerified",
      header: t("admin.users.columnEmailVerified"),
      render: (row) => <StatusBadge status={row.emailVerified ? "healthy" : "warning"} label={row.emailVerified ? t("admin.users.verified") : t("admin.users.unverified")} />,
    },
    { key: "createdAt", header: t("admin.users.columnCreated"), render: (row) => formatDate(row.createdAt, t) },
    { key: "lastSignInAt", header: t("admin.users.columnLastSignIn"), render: (row) => formatDate(row.lastSignInAt, t) },
    { key: "bookmarkCount", header: t("admin.table.bookmarks"), render: (row) => row.bookmarkCount.toLocaleString() },
    { key: "articlesReadCount", header: t("admin.users.columnArticlesRead"), render: () => "—" },
    {
      key: "status",
      header: t("admin.table.status"),
      render: (row) => <StatusBadge status={row.suspended ? "offline" : "healthy"} label={row.suspended ? t("admin.users.suspended") : t("admin.sources.active")} />,
    },
    {
      key: "actions",
      header: t("admin.table.actions"),
      render: (row) => (
        <AdminUserActions userId={row.id} role={row.role} suspended={row.suspended} isSelf={row.id === currentAdmin?.id} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">{t("admin.nav.users")}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("admin.users.totalCount", { count: usersPage.total.toLocaleString() })}
          {usersPage.truncated && ` ${t("admin.users.truncatedNotice")}`}
        </p>
      </div>

      <SectionCard title={t("admin.common.filters")}>
        <AdminUserFilters />
      </SectionCard>

      <SectionCard title={t("admin.users.allUsers")} description={t("admin.users.articlesReadNote")}>
        {usersPage.items.length === 0 ? (
          <EmptyState
            icon="👤"
            title={t("admin.users.emptyTitle")}
            description={t("admin.users.emptyDescription")}
          />
        ) : (
          <>
            <AdminTable
              columns={columns}
              rows={usersPage.items}
              getRowKey={(row) => row.id}
              emptyMessage={t("admin.users.emptyTitle")}
              errorHeading={t("admin.common.loadError")}
            />
            <AdminPagination page={usersPage.page} pageSize={pageSize} totalItems={usersPage.total} itemLabel={t("admin.users.itemLabel")} />
          </>
        )}
      </SectionCard>
    </div>
  );
}
