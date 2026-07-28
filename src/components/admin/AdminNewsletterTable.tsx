"use client";

import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminNewsletterRowActions } from "@/components/admin/AdminNewsletterRowActions";
import type { NewsletterSubscriberRow } from "@/types/database";
import { useTranslations } from "@/i18n/i18n-provider";

type AdminNewsletterTableProps = {
  items: NewsletterSubscriberRow[];
};

/**
 * Client wrapper around the reused `AdminTable` for `/admin/newsletter` -
 * Email / Subscribed date / Status / Actions, exactly the four columns the
 * MVP spec asks for. No bulk selection here (unlike `AdminSourcesTable`) -
 * the spec's action list for this page is per-row only (deactivate/
 * reactivate/delete one subscriber at a time).
 */
export function AdminNewsletterTable({ items }: AdminNewsletterTableProps) {
  const t = useTranslations();

  const columns: AdminTableColumn<NewsletterSubscriberRow>[] = [
    { key: "email", header: t("admin.newsletter.columnEmail"), className: "font-medium text-slate-950" },
    {
      key: "created_at",
      header: t("admin.newsletter.columnSubscribed"),
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: "is_active",
      header: t("admin.table.status"),
      render: (row) => (
        <StatusBadge status={row.is_active ? "healthy" : "offline"} label={row.is_active ? t("admin.newsletter.active") : t("admin.newsletter.inactive")} />
      ),
    },
    {
      key: "actions",
      header: t("admin.table.actions"),
      render: (row) => <AdminNewsletterRowActions id={row.id} email={row.email} isActive={row.is_active} />,
    },
  ];

  return (
    <AdminTable
      columns={columns}
      rows={items}
      getRowKey={(row) => row.id}
      emptyMessage={t("admin.newsletter.emptyMessage")}
      errorHeading={t("admin.common.loadError")}
    />
  );
}
