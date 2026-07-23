"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/admin/ToastProvider";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminMenuActionButton } from "@/components/admin/AdminMenuActionButton";

type AdminSourceRowActionsProps = {
  id: string;
  name: string;
  active: boolean;
  totalArticles: number;
};

/**
 * Edit/Active-toggle/Sync/Delete for a single source, converted to the
 * shared `AdminRowActionsMenu` overflow pattern (requirement 12): Edit
 * stays the primary, always-visible action; Active, Sync, and Delete move
 * into the three-dot menu, consistent with `AdminRepositoryRowActions`/
 * `AdminReleaseRowActions`.
 *
 * "Sync" reuses the existing safe `run-pipeline` Runtime Operation
 * (`/api/admin/runtime/actions`) rather than inventing a new, narrower
 * per-source job type - the pipeline's fetch steps don't support
 * filtering to a single source, so the confirm dialog says so up front.
 *
 * "Delete" is genuinely destructive - `article_sources.id` cascades onto
 * `articles.source_id` - so the confirm description states the exact
 * article count that will be removed with it.
 */
export function AdminSourceRowActions({ id, name, active, totalArticles }: AdminSourceRowActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const encodedId = encodeURIComponent(id);

  function buildEditHref(): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("edit", id);
    return `/admin/sources?${params.toString()}`;
  }

  async function toggleActive() {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/sources/${encodedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Update failed.");
      toast.success(active ? "Source deactivated." : "Source activated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AdminRowActionsMenu
      label={`More actions for ${name}`}
      primary={
        <Link href={buildEditHref()} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2f67e8] hover:bg-blue-50">
          Edit
        </Link>
      }
    >
      <button
        type="button"
        onClick={() => void toggleActive()}
        disabled={pending}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Active
        <span className={active ? "text-[#2f67e8]" : "text-slate-400"}>{active ? "On" : "Off"}</span>
      </button>

      <AdminMenuActionButton
        label="Sync"
        pendingLabel="Syncing…"
        endpoint="/api/admin/runtime/actions"
        buildBody={() => ({ action: "run-pipeline" })}
        confirmTitle={`Sync ${name}?`}
        confirmDescription="Runs the full news pipeline across every configured source (RSS/NewsAPI/GNews/Hacker News) - per-source syncing isn't supported by the current pipeline architecture, so this refreshes all sources, including this one. Queues a background job and returns immediately."
        confirmLabel="Run Sync"
        successMessage={(json) => (typeof json.message === "string" ? json.message : "Sync queued.")}
      />

      <div className="my-1 h-px bg-slate-100" />

      <AdminMenuActionButton
        label="Delete"
        pendingLabel="Deleting…"
        endpoint={`/api/admin/sources/${encodedId}`}
        method="DELETE"
        destructive
        confirmTitle={`Delete ${name}?`}
        confirmDescription={
          totalArticles > 0
            ? `This source has ${totalArticles.toLocaleString()} article(s). Deleting it permanently deletes all of them too (articles cascade on their source). This can't be undone.`
            : "This source has no articles yet. This can't be undone."
        }
        confirmLabel="Delete"
        successMessage="Source deleted."
      />
    </AdminRowActionsMenu>
  );
}
