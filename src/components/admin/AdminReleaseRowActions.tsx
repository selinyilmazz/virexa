"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/admin/ToastProvider";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminMenuActionButton } from "@/components/admin/AdminMenuActionButton";
import { AdminMenuLink } from "@/components/admin/AdminMenuLink";

type AdminReleaseRowActionsProps = {
  id: string;
  slug: string;
  featured: boolean;
  trending: boolean;
  visible: boolean;
};

/**
 * Per-row actions for `/admin/releases` (requirement 12: overflow menu
 * pattern, consistent with `AdminRepositoryRowActions`). Edit stays the
 * primary, always-visible action; Featured/Trending/Visible toggles,
 * "View" (public page), and Delete move into the three-dot menu.
 */
export function AdminReleaseRowActions({ id, slug, featured, trending, visible }: AdminReleaseRowActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(field: "featured" | "trending" | "visible", nextValue: boolean) {
    setPending(field);
    try {
      const response = await fetch(`/api/admin/releases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextValue }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Update failed.");
      toast.success("Release updated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setPending(null);
    }
  }

  function toggleRow(label: string, active: boolean, field: "featured" | "trending" | "visible") {
    return (
      <button
        type="button"
        onClick={() => void toggle(field, !active)}
        disabled={pending === field}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {label}
        <span className={active ? "text-[#2f67e8]" : "text-slate-400"}>{active ? "On" : "Off"}</span>
      </button>
    );
  }

  return (
    <AdminRowActionsMenu
      label={`More actions for ${id}`}
      primary={
        <Link href={`/admin/releases?edit=${id}`} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2f67e8] hover:bg-blue-50">
          Edit
        </Link>
      }
    >
      {toggleRow("Featured", featured, "featured")}
      {toggleRow("Trending", trending, "trending")}
      {toggleRow("Visible", visible, "visible")}

      <div className="my-1 h-px bg-slate-100" />

      <AdminMenuLink href={`/developer-hub/releases/${slug}`} target="_blank">View on site</AdminMenuLink>

      <AdminMenuActionButton
        label="Delete"
        pendingLabel="Deleting…"
        endpoint={`/api/admin/releases/${id}`}
        method="DELETE"
        destructive
        confirmTitle="Delete this release?"
        confirmDescription="This removes the admin-managed record. If a matching curated technology page still exists, it will keep showing its default static content."
        confirmLabel="Delete"
        successMessage="Release deleted."
      />
    </AdminRowActionsMenu>
  );
}
