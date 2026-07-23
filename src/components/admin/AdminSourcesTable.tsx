"use client";

import { useState } from "react";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminSourceActions } from "@/components/admin/AdminSourceActions";
import { AdminSourceRowActions } from "@/components/admin/AdminSourceRowActions";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import type { AdminSourceListItem } from "@/services/admin/admin-source-service";

type AdminSourcesTableProps = {
  items: AdminSourceListItem[];
};

/**
 * Client wrapper around the reused `AdminTable`. Bulk Active/Inactive
 * and bulk Trust Score update post to `/api/admin/sources/bulk` (same
 * selection-checkbox pattern as `AdminArticlesTable.tsx`). Per-row,
 * `AdminSourceActions` keeps the quick Active/Trust Score inline
 * controls, and `AdminSourceRowActions` (additive "actions" column)
 * covers Edit/Sync/Delete - completing the full "Create/Edit/Delete/
 * Enable-Disable/Manual Sync" set from the current Admin Panel spec.
 */
export function AdminSourcesTable({ items }: AdminSourcesTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [trustInput, setTrustInput] = useState("50");

  function toggleOne(id: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((previous) => (previous.size === items.length ? new Set() : new Set(items.map((item) => item.id))));
  }

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const selectedArray = Array.from(selectedIds);

  const columns: AdminTableColumn<AdminSourceListItem>[] = [
    {
      key: "select",
      header: "",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleOne(row.id)}
          aria-label={`Select ${row.name}`}
          className="size-4 rounded accent-[#2f67e8]"
        />
      ),
    },
    { key: "name", header: "Name", className: "font-medium text-slate-950" },
    { key: "domain", header: "Domain", className: "text-slate-500" },
    { key: "country", header: "Country", render: (row) => row.country || "—" },
    {
      key: "active",
      header: "Active",
      render: (row) => <StatusBadge status={row.active ? "healthy" : "offline"} label={row.active ? "Active" : "Inactive"} />,
    },
    {
      key: "official",
      header: "Official",
      render: (row) => <StatusBadge status={row.official ? "healthy" : "unknown"} label={row.official ? "Official" : "Unofficial"} />,
    },
    { key: "trust_score", header: "Trust Score", render: (row) => `${row.trust_score}/100` },
    { key: "totalArticles", header: "Total Articles", render: (row) => row.totalArticles.toLocaleString() },
    {
      key: "quickActions",
      header: "Trust Score",
      render: (row) => <AdminSourceActions sourceId={row.id} trustScore={row.trust_score} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => <AdminSourceRowActions id={row.id} name={row.name} active={row.active} totalArticles={row.totalArticles} />,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            disabled={items.length === 0}
            className="size-4 rounded accent-[#2f67e8]"
          />
          Select all
        </label>
        <span className="text-sm text-slate-500">{selectedIds.size} selected</span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <AdminActionButton
            label="Activate"
            endpoint="/api/admin/sources/bulk"
            buildBody={() => ({ ids: selectedArray, action: "activate" })}
            confirmTitle="Activate selected sources?"
            confirmDescription={`${selectedArray.length} source(s) will be marked Active.`}
            confirmLabel="Activate"
            successMessage={(json) => `${json.updated ?? selectedArray.length} source(s) activated.`}
            disabled={selectedIds.size === 0}
            className="!px-3 !py-1.5 text-xs"
          />
          <AdminActionButton
            label="Deactivate"
            endpoint="/api/admin/sources/bulk"
            buildBody={() => ({ ids: selectedArray, action: "deactivate" })}
            confirmTitle="Deactivate selected sources?"
            confirmDescription={`${selectedArray.length} source(s) will be marked Inactive.`}
            confirmLabel="Deactivate"
            successMessage={(json) => `${json.updated ?? selectedArray.length} source(s) deactivated.`}
            variant="warning"
            disabled={selectedIds.size === 0}
            className="!px-3 !py-1.5 text-xs"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={100}
              value={trustInput}
              onChange={(event) => setTrustInput(event.target.value)}
              disabled={selectedIds.size === 0}
              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-950 focus:border-[#2f67e8] focus:outline-none disabled:opacity-50"
            />
            <AdminActionButton
              label="Set Trust Score"
              endpoint="/api/admin/sources/bulk"
              buildBody={() => ({ ids: selectedArray, action: "set-trust-score", trustScore: Number(trustInput) })}
              confirmTitle="Update trust score for selected sources?"
              confirmDescription={`${selectedArray.length} source(s) will be set to trust score ${trustInput}.`}
              confirmLabel="Update"
              successMessage={(json) => `${json.updated ?? selectedArray.length} source(s) updated.`}
              disabled={selectedIds.size === 0 || trustInput.trim() === ""}
              className="!px-3 !py-1.5 text-xs"
            />
          </div>
        </div>
      </div>

      <AdminTable columns={columns} rows={items} getRowKey={(row) => row.id} emptyMessage="No sources found." />
    </div>
  );
}
