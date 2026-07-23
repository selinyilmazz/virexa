"use client";

import Link from "next/link";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import type { CollectionWithCount } from "@/repositories/collection-repository";

export function AdminCollectionsTable({ collections }: { collections: CollectionWithCount[] }) {
  const columns: AdminTableColumn<CollectionWithCount>[] = [
    { key: "name", header: "Collection", render: (row) => <div><p className="font-medium text-slate-950">{row.icon || "📁"} {row.name}</p><p className="max-w-xs truncate text-xs text-slate-500">{row.slug}</p></div> },
    { key: "repositoryCount", header: "Repositories", render: (row) => row.repositoryCount },
    { key: "display_order", header: "Order" },
    { key: "visible", header: "Status", render: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.visible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{row.visible ? "Visible" : "Hidden"}</span> },
    { key: "actions", header: "Actions", render: (row) => <AdminRowActionsMenu primary={<Link href={`/admin/collections?edit=${row.id}`} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2f67e8] hover:bg-blue-50">Edit</Link>} label={`More actions for ${row.name}`}><AdminActionButton label="Delete" pendingLabel="Deleting…" endpoint={`/api/admin/collections/${row.id}`} method="DELETE" variant="secondary" className="!w-full !border-0 !bg-transparent !text-left !text-red-600 hover:!bg-red-50" confirmTitle="Delete this collection?" confirmDescription="Its repository memberships will be removed too." confirmLabel="Delete" successMessage="Collection deleted." /></AdminRowActionsMenu> },
  ];
  return <AdminTable columns={columns} rows={collections} getRowKey={(row) => row.id} emptyMessage="No collections created yet." />;
}
