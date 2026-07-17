"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";

type AdminActionButtonVariant = "primary" | "secondary" | "warning";

type AdminActionButtonProps = {
  label: string;
  pendingLabel?: string;
  endpoint: string;
  method?: "POST" | "PATCH";
  /** Computed at click time (not render time) - lets callers read current UI state, e.g. a bulk-selection Set or a trust-score input value, at the moment the action actually runs. */
  buildBody?: () => unknown;
  /** When set, clicking shows an inline confirmation step before the request fires (requirement 7: "Confirmation"). Omit for genuinely low-stakes actions. */
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  successMessage?: string | ((json: Record<string, unknown>) => string);
  errorFallbackMessage?: string;
  variant?: AdminActionButtonVariant;
  disabled?: boolean;
  className?: string;
  /** Called with the parsed JSON response after a successful request - typically `() => router.refresh()` so the Server Component page re-fetches real data. */
  onSuccess?: (json: Record<string, unknown>) => void;
};

const VARIANT_CLASSES: Record<AdminActionButtonVariant, string> = {
  primary: "bg-[#2f67e8] text-white hover:bg-[#2556c9]",
  secondary: "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
  warning: "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
};

/**
 * Reusable admin write-action button: pending state, an optional
 * confirmation step, a POST/PATCH fetch, and a success/error toast, all
 * in one place (requirement 7: "Loading / Confirmation / Success /
 * Error / Toast"). Used by every NEW write surface this phase (Runtime
 * Operations, Users role/suspend actions, Bulk Operations) so those
 * features don't each re-implement this lifecycle. Deliberately not
 * retroactively swapped into the existing `AdminSourceActions.tsx`
 * (built in an earlier phase and already working) - "gereksiz refactor
 * yapma."
 */
export function AdminActionButton({
  label,
  pendingLabel = "Working…",
  endpoint,
  method = "POST",
  buildBody,
  confirmTitle,
  confirmDescription,
  confirmLabel = "Confirm",
  successMessage,
  errorFallbackMessage = "Action failed.",
  variant = "secondary",
  disabled = false,
  className = "",
  onSuccess,
}: AdminActionButtonProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function run() {
    setPending(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: buildBody ? JSON.stringify(buildBody()) : undefined,
      });
      const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (!response.ok || json.ok === false) {
        throw new Error(typeof json.error === "string" ? json.error : errorFallbackMessage);
      }

      toast.success(typeof successMessage === "function" ? successMessage(json) : successMessage ?? "Done.");
      onSuccess?.(json);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorFallbackMessage);
    } finally {
      setPending(false);
      setConfirmOpen(false);
    }
  }

  function handleClick() {
    if (confirmTitle && !confirmOpen) {
      setConfirmOpen(true);
      return;
    }
    void run();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || pending}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      >
        {pending ? pendingLabel : label}
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-950">{confirmTitle}</h3>
            {confirmDescription && <p className="mt-2 text-sm text-slate-500">{confirmDescription}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={pending}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void run()}
                disabled={pending}
                className="rounded-xl bg-[#2f67e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2556c9] disabled:opacity-50"
              >
                {pending ? pendingLabel : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
