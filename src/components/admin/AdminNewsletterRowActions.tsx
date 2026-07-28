"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/admin/ToastProvider";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminMenuActionButton } from "@/components/admin/AdminMenuActionButton";
import { useTranslations } from "@/i18n/i18n-provider";

type AdminNewsletterRowActionsProps = {
  id: string;
  email: string;
  isActive: boolean;
};

/**
 * Per-row Deactivate/Reactivate + Delete for `/admin/newsletter` - same
 * `AdminRowActionsMenu` overflow pattern as `AdminSourceRowActions`/
 * `AdminCollectionsTable`'s row menu (requirement 12: one consistent
 * pattern across every admin table). The active/inactive toggle has no
 * confirmation step (fully reversible, one click either direction);
 * delete does, since it's genuinely destructive.
 */
export function AdminNewsletterRowActions({ id, email, isActive }: AdminNewsletterRowActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const encodedId = encodeURIComponent(id);

  async function toggleActive() {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/newsletter/${encodedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? t("admin.common.actionFailed"));
      toast.success(isActive ? t("admin.newsletter.deactivatedSuccess") : t("admin.newsletter.reactivatedSuccess"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.common.actionFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <AdminRowActionsMenu label={t("admin.common.moreActionsFor", { name: email })}>
      <button
        type="button"
        onClick={() => void toggleActive()}
        disabled={pending}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {isActive ? t("admin.newsletter.deactivate") : t("admin.newsletter.reactivate")}
      </button>

      <div className="my-1 h-px bg-slate-100" />

      <AdminMenuActionButton
        label={t("admin.common.delete")}
        pendingLabel={t("admin.common.deleting")}
        endpoint={`/api/admin/newsletter/${encodedId}`}
        method="DELETE"
        destructive
        confirmTitle={t("admin.newsletter.deleteConfirmTitle", { email })}
        confirmDescription={t("admin.newsletter.deleteConfirmDescription")}
        confirmLabel={t("admin.common.delete")}
        successMessage={t("admin.newsletter.deletedSuccess")}
      />
    </AdminRowActionsMenu>
  );
}
