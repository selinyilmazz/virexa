"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/admin/ToastProvider";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminMenuActionButton } from "@/components/admin/AdminMenuActionButton";

type AdminArticleRowActionsProps = {
  id: string;
  visible: boolean;
};

/**
 * Per-row write actions for `/admin/articles` (requirement 5), converted
 * to the shared `AdminRowActionsMenu` overflow pattern (requirement 12):
 * Edit stays the primary, always-visible action; Publish/Unpublish,
 * Duplicate, and Delete move into the three-dot menu. "Preview" is the
 * existing `?selected=<id>` read-only drawer, already wired in
 * `AdminArticlesTable`'s title link - not duplicated here.
 */
export function AdminArticleRowActions({ id, visible }: AdminArticleRowActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  const encodedId = encodeURIComponent(id);

  function buildEditHref(): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("edit", id);
    return `/admin/articles?${params.toString()}`;
  }

  async function togglePublish() {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/articles/${encodedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !visible }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Update failed.");
      toast.success(visible ? "Article unpublished." : "Article published.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AdminRowActionsMenu
      label={`More actions for article ${id}`}
      primary={
        <Link href={buildEditHref()} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2f67e8] hover:bg-blue-50">
          Edit
        </Link>
      }
    >
      <button
        type="button"
        onClick={() => void togglePublish()}
        disabled={pending}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {visible ? "Unpublish" : "Publish"}
        <span className={visible ? "text-[#2f67e8]" : "text-slate-400"}>{visible ? "Live" : "Hidden"}</span>
      </button>

      <AdminMenuActionButton
        label="Duplicate"
        pendingLabel="Duplicating…"
        endpoint={`/api/admin/articles/${encodedId}/duplicate`}
        successMessage={(json) => (typeof json.message === "string" ? json.message : "Duplicated.")}
      />

      <div className="my-1 h-px bg-slate-100" />

      <AdminMenuActionButton
        label="Delete"
        pendingLabel="Deleting…"
        endpoint={`/api/admin/articles/${encodedId}`}
        method="DELETE"
        destructive
        confirmTitle="Delete this article?"
        confirmDescription="This permanently removes the article, including its AI enrichment and metrics. This can't be undone."
        confirmLabel="Delete"
        successMessage="Article deleted."
      />
    </AdminRowActionsMenu>
  );
}
