"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/admin/ToastProvider";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminMenuActionButton } from "@/components/admin/AdminMenuActionButton";

type AdminRepositoryRowActionsProps = {
  id: string;
  featured: boolean;
  trending: boolean;
  visible: boolean;
  archived: boolean;
};

/**
 * Per-row actions for `/admin/repositories` (requirement 12: "Show only
 * the primary action (Edit). Move secondary actions... into a three-dot
 * context menu"). Edit stays a plain, always-visible link; everything
 * else (Sync, Featured/Trending/Visible toggles, Archive, Delete) moves
 * into `AdminRowActionsMenu` via `AdminMenuActionButton`, which keeps
 * every toggle's real fetch/confirm/toast behavior unchanged - only the
 * layout moved.
 */
export function AdminRepositoryRowActions({ id, featured, trending, visible, archived }: AdminRepositoryRowActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [pending, setPending] = useState<string | null>(null);

  const encodedId = encodeURIComponent(id);

  function buildEditHref(): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("edit", id);
    return `/admin/repositories?${params.toString()}`;
  }

  async function toggle(field: "featured" | "trending" | "visible" | "archived", nextValue: boolean) {
    setPending(field);
    try {
      const response = await fetch(`/api/admin/repositories/${encodedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextValue }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Update failed.");
      toast.success("Repository updated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setPending(null);
    }
  }

  return (
    <AdminRowActionsMenu label={`More actions for ${id}`} primary={<Link href={buildEditHref()} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2f67e8] hover:bg-blue-50">Edit</Link>}>
      <AdminMenuActionButton
        label="Sync from GitHub"
        pendingLabel="Syncing…"
        endpoint={`/api/admin/repositories/${encodedId}/sync`}
        successMessage={(json) => (typeof json.message === "string" ? json.message : "Synced.")}
      />

      <button
        type="button"
        onClick={() => void toggle("featured", !featured)}
        disabled={pending === "featured"}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Featured
        <span className={featured ? "text-[#2f67e8]" : "text-slate-400"}>{featured ? "On" : "Off"}</span>
      </button>

      <button
        type="button"
        onClick={() => void toggle("trending", !trending)}
        disabled={pending === "trending"}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Trending
        <span className={trending ? "text-[#2f67e8]" : "text-slate-400"}>{trending ? "On" : "Off"}</span>
      </button>

      <button
        type="button"
        onClick={() => void toggle("visible", !visible)}
        disabled={pending === "visible"}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Enabled
        <span className={visible ? "text-[#2f67e8]" : "text-slate-400"}>{visible ? "On" : "Off"}</span>
      </button>

      <div className="my-1 h-px bg-slate-100" />

      <AdminMenuActionButton
        label={archived ? "Unarchive" : "Archive"}
        pendingLabel="Working…"
        endpoint={`/api/admin/repositories/${encodedId}`}
        method="PATCH"
        buildBody={() => ({ archived: !archived })}
        successMessage={archived ? "Repository unarchived." : "Repository archived."}
      />

      <AdminMenuActionButton
        label="Delete"
        pendingLabel="Deleting…"
        endpoint={`/api/admin/repositories/${encodedId}`}
        method="DELETE"
        destructive
        confirmTitle="Delete this repository?"
        confirmDescription={`${id} will be removed from the Open Source Explorer and can no longer be bookmarked. This can't be undone.`}
        confirmLabel="Delete"
        successMessage="Repository deleted."
      />
    </AdminRowActionsMenu>
  );
}
