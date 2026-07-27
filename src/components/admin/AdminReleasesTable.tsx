"use client";

import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { AdminReleaseRowActions } from "@/components/admin/AdminReleaseRowActions";
import type { DeveloperReleaseRow } from "@/types/database";
import { useTranslations } from "@/i18n/i18n-provider";

type AdminReleasesTableProps = {
  items: DeveloperReleaseRow[];
};

const CHANNEL_BADGE_CLASSES: Record<DeveloperReleaseRow["channel"], string> = {
  stable: "bg-emerald-50 text-emerald-700",
  beta: "bg-amber-50 text-amber-700",
  rc: "bg-purple-50 text-purple-700",
  lts: "bg-blue-50 text-blue-700",
};

/** Client wrapper around the reused `AdminTable` for `/admin/releases` (requirement 8). */
export function AdminReleasesTable({ items }: AdminReleasesTableProps) {
  const t = useTranslations();
  const columns: AdminTableColumn<DeveloperReleaseRow>[] = [
    {
      key: "product",
      header: t("admin.releases.columnProduct"),
      render: (row) => (
        <div>
          <p className="font-medium text-slate-950">{row.product}</p>
          <p className="text-xs text-slate-500">{row.slug}</p>
        </div>
      ),
    },
    { key: "version", header: t("admin.releases.columnVersion"), render: (row) => row.version },
    {
      key: "channel",
      header: t("admin.releases.columnChannel"),
      render: (row) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CHANNEL_BADGE_CLASSES[row.channel]}`}>
          {row.channel.toUpperCase()}
        </span>
      ),
    },
    { key: "release_date", header: t("admin.releases.columnReleaseDate"), render: (row) => row.release_date, className: "text-slate-500" },
    {
      key: "actions",
      header: t("admin.table.actions"),
      render: (row) => (
        <AdminReleaseRowActions id={row.id} slug={row.slug} featured={row.featured} trending={row.trending} visible={row.visible} />
      ),
    },
  ];

  return (
    <AdminTable
      columns={columns}
      rows={items}
      getRowKey={(row) => row.id}
      emptyMessage={t("admin.releases.emptyMessage")}
      errorHeading={t("admin.common.loadError")}
    />
  );
}
