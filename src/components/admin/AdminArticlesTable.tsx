"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AdminTable, type AdminTableColumn } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminArticleRowActions } from "@/components/admin/AdminArticleRowActions";
import type { AdminArticleListItem } from "@/services/admin/admin-article-service";

type AdminArticlesTableProps = {
  items: AdminArticleListItem[];
};

/**
 * Client wrapper around the reused `AdminTable` - adds row selection
 * (Bulk Operations infrastructure) and a title link that opens the
 * read-only Article Detail Drawer via `?selected=<id>` (requirement 4
 * from the Articles & Sources phase). `AdminTable` itself is untouched;
 * this only supplies column config and local selection state.
 *
 * "Toplu refresh" (Operations phase, requirement 6) is now wired to
 * `/api/admin/articles/bulk` - recalculates `trending_score` for the
 * selected articles via the News Engine's own scoring function, applied
 * to stored rows instead of the live cache. Bulk activate/deactivate/
 * trust-score-update live on Sources instead (Articles has no such
 * fields), matching that requirement's own examples.
 */
export function AdminArticlesTable({ items }: AdminArticlesTableProps) {
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function buildDetailHref(id: string): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", id);
    return `/admin/articles?${params.toString()}`;
  }

  function toggleOne(id: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((previous) => (previous.size === items.length ? new Set() : new Set(items.map((item) => item.id))));
  }

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const selectedArray = Array.from(selectedIds);

  const columns: AdminTableColumn<AdminArticleListItem>[] = [
    {
      key: "select",
      header: "",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleOne(row.id)}
          aria-label={`Select ${row.title}`}
          className="size-4 rounded accent-[#2f67e8]"
        />
      ),
    },
    {
      key: "title",
      header: "Title",
      className: "max-w-[280px] whitespace-normal font-medium text-slate-950",
      render: (row) => (
        <Link href={buildDetailHref(row.id)} className="line-clamp-2 hover:text-[#2f67e8]">
          {row.title}
        </Link>
      ),
    },
    { key: "sourceName", header: "Source" },
    { key: "category", header: "Category" },
    { key: "language", header: "Language" },
    { key: "publishedDate", header: "Published" },
    { key: "trustScore", header: "Trust", render: (row) => `${row.trustScore}/100` },
    { key: "trendingScore", header: "Trending", render: (row) => `${row.trendingScore}/100` },
    { key: "viewCount", header: "Views", render: (row) => row.viewCount.toLocaleString() },
    { key: "bookmarkCount", header: "Bookmarks", render: (row) => row.bookmarkCount.toLocaleString() },
    {
      key: "aiStatus",
      header: "AI Status",
      render: (row) =>
        row.aiStatus === "enriched" ? (
          <StatusBadge status="healthy" label="AI Enriched" />
        ) : (
          <StatusBadge status="unknown" label="Pending AI" />
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={row.visible ? "healthy" : "offline"} label={row.visible ? "Published" : "Unpublished"} />
          {row.featured && <StatusBadge status="warning" label="Featured" />}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => <AdminArticleRowActions id={row.id} visible={row.visible} />,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
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
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{selectedIds.size} selected</span>
          <AdminActionButton
            label="Bulk Refresh"
            pendingLabel="Refreshing…"
            endpoint="/api/admin/articles/bulk"
            buildBody={() => ({ ids: selectedArray, action: "refresh-trending" })}
            confirmTitle="Recalculate trending scores?"
            confirmDescription={`Recomputes the trending score for ${selectedArray.length} selected article(s) from their current source trust and publish recency.`}
            confirmLabel="Refresh"
            successMessage={(json) => `${json.updated ?? selectedArray.length} article(s) refreshed.`}
            disabled={selectedIds.size === 0}
            className="!px-3 !py-1.5 text-sm"
          />
        </div>
      </div>

      <AdminTable columns={columns} rows={items} getRowKey={(row) => row.id} emptyMessage="No articles match these filters." />
    </div>
  );
}
