"use client";

import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { AdminRepositoryRowActions } from "@/components/admin/AdminRepositoryRowActions";
import { StatusBadge, type AdminStatus } from "@/components/admin/StatusBadge";
import type { RepositoryRow } from "@/types/database";

type AdminRepositoriesTableProps = {
  items: RepositoryRow[];
};

const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function statusFor(row: RepositoryRow): { status: AdminStatus; label: string } {
  if (row.archived) return { status: "unknown", label: "Archived" };
  if (!row.visible) return { status: "warning", label: "Hidden" };
  return { status: "healthy", label: "Active" };
}

function healthFor(row: RepositoryRow): { status: AdminStatus; label: string } {
  if (!row.last_synced_at) return { status: "unknown", label: "Never Synced" };
  const age = Date.now() - new Date(row.last_synced_at).getTime();
  return age < STALE_AFTER_MS ? { status: "healthy", label: "Healthy" } : { status: "warning", label: "Stale" };
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

/** Client wrapper around the reused `AdminTable` for `/admin/repositories`, extended with GitHub Watchers/Latest Release plus computed Status/Health columns. */
export function AdminRepositoriesTable({ items }: AdminRepositoriesTableProps) {
  const columns: AdminTableColumn<RepositoryRow>[] = [
    {
      key: "id",
      header: "Repository",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-950">{row.id}</p>
          <p className="max-w-xs truncate text-xs text-slate-500">{row.description || "No description provided."}</p>
        </div>
      ),
    },
    { key: "language", header: "Language", render: (row) => row.language ?? "—" },
    { key: "stars", header: "Stars", render: (row) => row.stars.toLocaleString() },
    { key: "forks", header: "Forks", render: (row) => row.forks.toLocaleString() },
    { key: "watchers", header: "Watchers", render: (row) => row.watchers.toLocaleString() },
    {
      key: "latest_release",
      header: "Latest Release",
      render: (row) =>
        row.latest_release_tag ? (
          <div>
            <p className="font-medium text-slate-800">{row.latest_release_tag}</p>
            <p className="text-xs text-slate-500">{formatRelative(row.latest_release_published_at)}</p>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const { status, label } = statusFor(row);
        return <StatusBadge status={status} label={label} />;
      },
    },
    {
      key: "health",
      header: "Health",
      render: (row) => {
        const { status, label } = healthFor(row);
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

  return <AdminTable columns={columns} rows={items} getRowKey={(row) => row.id} emptyMessage="No repositories found." />;
}
