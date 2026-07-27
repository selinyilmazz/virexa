"use client";

import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { AdminCatalogItemRowActions } from "@/components/admin/AdminCatalogItemRowActions";
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPE_BADGE_CLASSES } from "@/lib/developer-hub/shared";
import type { CatalogItemRow } from "@/types/database";
import { useTranslations } from "@/i18n/i18n-provider";

type AdminCatalogItemsTableProps = {
  items: CatalogItemRow[];
};

/** Client wrapper around the reused `AdminTable` for `/admin/catalog-items`. */
export function AdminCatalogItemsTable({ items }: AdminCatalogItemsTableProps) {
  const t = useTranslations();
  const columns: AdminTableColumn<CatalogItemRow>[] = [
    {
      key: "title",
      header: t("admin.catalog.columnItem"),
      render: (row) => (
        <div>
          <p className="font-medium text-slate-950">
            {row.emoji ? `${row.emoji} ` : ""}
            {row.title}
          </p>
          <p className="max-w-xs truncate text-xs text-slate-500">{row.provider}</p>
        </div>
      ),
    },
    {
      key: "resource_type",
      header: t("admin.table.type"),
      render: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${RESOURCE_TYPE_BADGE_CLASSES[row.resource_type]}`}>
          {RESOURCE_TYPE_LABELS[row.resource_type]}
        </span>
      ),
    },
    { key: "difficulty", header: t("admin.catalog.columnDifficulty"), render: (row) => row.difficulty ?? "—" },
    { key: "price", header: t("admin.catalog.columnPrice"), render: (row) => row.price ?? "—" },
    { key: "display_order", header: t("admin.catalog.columnOrder") },
    {
      key: "actions",
      header: t("admin.table.actions"),
      render: (row) => <AdminCatalogItemRowActions id={row.id} featured={row.featured} visible={row.visible} />,
    },
  ];

  return (
    <AdminTable
      columns={columns}
      rows={items}
      getRowKey={(row) => row.id}
      emptyMessage={t("admin.catalog.emptyMessage")}
      errorHeading={t("admin.common.loadError")}
    />
  );
}
