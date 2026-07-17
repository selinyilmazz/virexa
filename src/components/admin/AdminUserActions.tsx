"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import type { AdminUserRole } from "@/services/admin/admin-user-service";

type AdminUserActionsProps = {
  userId: string;
  role: AdminUserRole;
  suspended: boolean;
  /** The signed-in admin can't act on their own account (see the route's self-protection guard) - the row renders read-only in that case instead of controls that would just 400. */
  isSelf: boolean;
};

/**
 * Per-row user actions (requirement 1): Role change (Admin verme/alma)
 * and Suspend/Reactivate. Role change uses a plain select + apply
 * button rather than `AdminActionButton`'s own confirm step (a role
 * change is reversible and low-friction); Suspend/Reactivate goes
 * through `AdminActionButton`'s confirmation step since it affects the
 * user's ability to sign in.
 */
export function AdminUserActions({ userId, role, suspended, isSelf }: AdminUserActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [pendingRole, setPendingRole] = useState<AdminUserRole>(role);
  const [savingRole, setSavingRole] = useState(false);

  if (isSelf) {
    return <span className="text-xs text-slate-400">This is you</span>;
  }

  async function applyRole() {
    if (pendingRole === role) return;
    setSavingRole(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: pendingRole }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) {
        throw new Error(typeof json.error === "string" ? json.error : "Role update failed.");
      }
      toast.success(`Role updated to "${pendingRole}".`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Role update failed.");
      setPendingRole(role);
    } finally {
      setSavingRole(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={pendingRole}
        onChange={(event) => setPendingRole(event.target.value as AdminUserRole)}
        disabled={savingRole}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-950 focus:border-[#2f67e8] focus:outline-none"
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      {pendingRole !== role && (
        <button
          type="button"
          onClick={() => void applyRole()}
          disabled={savingRole}
          className="rounded-lg bg-[#2f67e8] px-3 py-1 text-xs font-semibold text-white hover:bg-[#2556c9] disabled:opacity-50"
        >
          {savingRole ? "Saving…" : "Apply"}
        </button>
      )}

      <AdminActionButton
        label={suspended ? "Reactivate" : "Suspend"}
        pendingLabel={suspended ? "Reactivating…" : "Suspending…"}
        endpoint={`/api/admin/users/${userId}`}
        method="PATCH"
        buildBody={() => ({ suspended: !suspended })}
        confirmTitle={suspended ? "Reactivate this user?" : "Suspend this user?"}
        confirmDescription={
          suspended
            ? "This user will be able to sign in again immediately."
            : "This user will be unable to sign in until reactivated. This does not delete any of their data."
        }
        confirmLabel={suspended ? "Reactivate" : "Suspend"}
        successMessage={suspended ? "User reactivated." : "User suspended."}
        variant={suspended ? "secondary" : "warning"}
        className="!px-3 !py-1 text-xs"
      />
    </div>
  );
}
