"use client";

import Link from "next/link";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import type { CollectionWithCount } from "@/repositories/collection-repository";
import { useTranslations } from "@/i18n/i18n-provider";

export function AdminCollectionsTable({ collections }: { collections: CollectionWithCount[] }) {
  const t = useTranslations();
  const columns: AdminTableColumn<CollectionWithCount>[] = [
    { key: "name", header: t("admin.collections.columnCollection"), render: (row) => <div><p className="font-medium text-slate-950">{row.icon || "📁"} {row.name}</p><p className="max-w-xs truncate text-xs text-slate-500">{row.slug}</p></div> },
    { key: "repositoryCount", header: t("admin.nav.repositories"), render: (row) => row.repositoryCount },
    { key: "display_order", header: t("admin.catalog.columnOrder") },
    { key: "visible", header: t("admin.table.status"), render: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.visible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{row.visible ? t("admin.collections.visible") : t("admin.collections.hidden")}</span> },
    { key: "actions", header: t("admin.table.actions"), render: (row) => <AdminRowActionsMenu primary={<Link href={`/admin/collections?edit=${row.id}`} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2f67e8] hover:bg-blue-50">{t("admin.common.edit")}</Link>} label={t("admin.common.moreActionsFor", { name: row.name })}><AdminActionButton label={t("admin.common.delete")} pendingLabel={t("admin.common.deleting")} endpoint={`/api/admin/collections/${row.id}`} method="DELETE" variant="secondary" className="!w-full !border-0 !bg-transparent !text-left !text-red-600 hover:!bg-red-50" confirmTitle={t("admin.collections.deleteConfirmTitle")} confirmDescription={t("admin.collections.deleteConfirmDescription")} confirmLabel={t("admin.common.delete")} successMessage={t("admin.collections.deletedSuccess")} /></AdminRowActionsMenu> },
  ];
  return (
    <AdminTable
      columns={columns}
      rows={collections}
      getRowKey={(row) => row.id}
      emptyMessage={t("admin.collections.emptyMessage")}
      errorHeading={t("admin.common.loadError")}
    />
  );
}
