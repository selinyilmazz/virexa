"use client";

import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { AdminRepositoryRowActions } from "@/components/admin/AdminRepositoryRowActions";
import { StatusBadge, type AdminStatus } from "@/components/admin/StatusBadge";
import type { RepositoryRow } from "@/types/database";
import { useTranslations } from "@/i18n/i18n-provider";
import type { TFunction } from "@/i18n/translate";

type AdminRepositoriesTableProps = {
  items: RepositoryRow[];
};

const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function statusFor(row: RepositoryRow, t: TFunction): { status: AdminStatus; label: string } {
  if (row.archived) return { status: "unknown", label: t("admin.repositories.archived") };
  if (!row.visible) return { status: "warning", label: t("admin.repositories.hidden") };
  return { status: "healthy", label: t("admin.repositories.active") };
}

function healthFor(row: RepositoryRow, t: TFunction): { status: AdminStatus; label: string } {
  if (!row.last_synced_at) return { status: "unknown", label: t("admin.repositories.neverSynced") };
  const age = Date.now() - new Date(row.last_synced_at).getTime();
  return age < STALE_AFTER_MS ? { status: "healthy", label: t("admin.status.healthy") } : { status: "warning", label: t("admin.repositories.stale") };
}

function formatRelative(iso: string | null, t: TFunction): string {
  if (!iso) return t("admin.repositories.never");
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return t("admin.repositories.today");
  if (days === 1) return t("admin.repositories.oneDayAgo");
  if (days < 30) return t("admin.repositories.daysAgo", { days });
  const months = Math.floor(days / 30);
  return months === 1 ? t("admin.repositories.oneMonthAgo") : t("admin.repositories.monthsAgo", { months });
}

/** Client wrapper around the reused `AdminTable` for `/admin/repositories`, extended with GitHub Watchers/Latest Release plus computed Status/Health columns. */
export function AdminRepositoriesTable({ items }: AdminRepositoriesTableProps) {
  const t = useTranslations();
  const columns: AdminTableColumn<RepositoryRow>[] = [
    {
      key: "id",
      header: t("admin.repositories.columnRepository"),
      render: (row) => (
        <div>
          <p className="font-medium text-slate-950">{row.id}</p>
          <p className="max-w-xs truncate text-xs text-slate-500">{row.description || t("admin.repositories.noDescription")}</p>
        </div>
      ),
    },
    { key: "language", header: t("admin.table.language"), render: (row) => row.language ?? "—" },
    { key: "stars", header: t("admin.repositories.columnStars"), render: (row) => row.stars.toLocaleString() },
    { key: "forks", header: t("admin.repositories.columnForks"), render: (row) => row.forks.toLocaleString() },
    { key: "watchers", header: t("admin.repositories.columnWatchers"), render: (row) => row.watchers.toLocaleString() },
    {
      key: "latest_release",
      header: t("admin.repositories.columnLatestRelease"),
      render: (row) =>
        row.latest_release_tag ? (
          <div>
            <p className="font-medium text-slate-800">{row.latest_release_tag}</p>
            <p className="text-xs text-slate-500">{formatRelative(row.latest_release_published_at, t)}</p>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "status",
      header: t("admin.table.status"),
      render: (row) => {
        const { status, label } = statusFor(row, t);
        return <StatusBadge status={status} label={label} />;
      },
    },
    {
      key: "health",
      header: t("admin.repositories.columnHealth"),
      render: (row) => {
        const { status, label } = healthFor(row, t);
        return <StatusBadge status={status} label={label} />;
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <AdminRepositoryRowActions id={row.id} featured={row.featured} trending={row.trending} visible={row.visible} archived={row.archived} />
      ),
    },
  ];

  return (
    <AdminTable
      columns={columns}
      rows={items}
      getRowKey={(row) => row.id}
      emptyMessage={t("admin.repositories.emptyMessage")}
      errorHeading={t("admin.common.loadError")}
    />
  );
}
