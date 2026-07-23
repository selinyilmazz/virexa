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

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "Never";
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
    { key: "displayName", header: "User", className: "font-medium text-slate-950" },
    { key: "email", header: "Email", className: "text-slate-500" },
    {
      key: "role",
      header: "Role",
      render: (row) => <StatusBadge status={row.role === "admin" ? "healthy" : "unknown"} label={row.role === "admin" ? "Admin" : "User"} />,
    },
    {
      key: "emailVerified",
      header: "Email Verified",
      render: (row) => <StatusBadge status={row.emailVerified ? "healthy" : "warning"} label={row.emailVerified ? "Verified" : "Unverified"} />,
    },
    { key: "createdAt", header: "Created", render: (row) => formatDate(row.createdAt) },
    { key: "lastSignInAt", header: "Last Sign-in", render: (row) => formatDate(row.lastSignInAt) },
    { key: "bookmarkCount", header: "Bookmarks", render: (row) => row.bookmarkCount.toLocaleString() },
    { key: "articlesReadCount", header: "Articles Read", render: () => "—" },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.suspended ? "offline" : "healthy"} label={row.suspended ? "Suspended" : "Active"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <AdminUserActions userId={row.id} role={row.role} suspended={row.suspended} isSelf={row.id === currentAdmin?.id} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          {usersPage.total.toLocaleString()} user{usersPage.total === 1 ? "" : "s"}.
          {usersPage.truncated && " Showing the most recent 1,000 accounts."}
        </p>
      </div>

      <SectionCard title="Filters">
        <AdminUserFilters />
      </SectionCard>

      <SectionCard title="All Users" description='"Articles Read" is not shown ("—") - Virexa does not yet track per-user article reads.'>
        {usersPage.items.length === 0 ? (
          <EmptyState
            icon="👤"
            title="No users found"
            description="No users match the current filters, or Supabase's service role key isn't configured yet."
          />
        ) : (
          <>
            <AdminTable columns={columns} rows={usersPage.items} getRowKey={(row) => row.id} emptyMessage="No users found." />
            <AdminPagination page={usersPage.page} pageSize={pageSize} totalItems={usersPage.total} itemLabel="users" />
          </>
        )}
      </SectionCard>
    </div>
  );
}
