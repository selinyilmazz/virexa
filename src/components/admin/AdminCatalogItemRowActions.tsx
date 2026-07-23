"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/admin/ToastProvider";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminMenuActionButton } from "@/components/admin/AdminMenuActionButton";

type AdminCatalogItemRowActionsProps = {
  id: string;
  featured: boolean;
  visible: boolean;
};

/**
 * Per-row write actions for `/admin/catalog-items`, converted to the
 * shared `AdminRowActionsMenu` overflow pattern (requirement 12): Edit
 * stays the primary, always-visible action; Featured/Visible toggles and
 * Delete move into the three-dot menu, consistent with
 * `AdminRepositoryRowActions`/`AdminReleaseRowActions`/`AdminSourceRowActions`.
 */
export function AdminCatalogItemRowActions({ id, featured, visible }: AdminCatalogItemRowActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [pending, setPending] = useState<string | null>(null);

  const encodedId = encodeURIComponent(id);

  function buildEditHref(): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("edit", id);
    return `/admin/catalog-items?${params.toString()}`;
  }

  async function toggle(field: "featured" | "visible", nextValue: boolean) {
    setPending(field);
    try {
      const response = await fetch(`/api/admin/catalog-items/${encodedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextValue }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Update failed.");
      toast.success("Catalog item updated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setPending(null);
    }
  }

  function toggleRow(label: string, active: boolean, field: "featured" | "visible") {
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
        <Link href={buildEditHref()} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#2f67e8] hover:bg-blue-50">
          Edit
        </Link>
      }
    >
      {toggleRow("Featured", featured, "featured")}
      {toggleRow("Visible", visible, "visible")}

      <div className="my-1 h-px bg-slate-100" />

      <AdminMenuActionButton
        label="Delete"
        pendingLabel="Deleting…"
        endpoint={`/api/admin/catalog-items/${encodedId}`}
        method="DELETE"
        destructive
        confirmTitle="Delete this catalog item?"
        confirmDescription={`${id} will be removed from the public Developer Hub catalog. This can't be undone.`}
        confirmLabel="Delete"
        successMessage="Catalog item deleted."
      />
    </AdminRowActionsMenu>
  );
}
