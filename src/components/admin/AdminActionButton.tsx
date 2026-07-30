"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";
import { useTranslations } from "@/i18n/i18n-provider";

type AdminActionButtonVariant = "primary" | "secondary" | "warning";

type AdminActionButtonProps = {
  label: ReactNode;
  pendingLabel?: ReactNode;
  endpoint: string;
  method?: "POST" | "PATCH" | "DELETE";
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
  pendingLabel,
  endpoint,
  method = "POST",
  buildBody,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  successMessage,
  errorFallbackMessage,
  variant = "secondary",
  disabled = false,
  className = "",
  onSuccess,
}: AdminActionButtonProps) {
  const t = useTranslations();
  const resolvedPendingLabel = pendingLabel ?? t("admin.common.working");
  const resolvedConfirmLabel = confirmLabel ?? t("admin.common.confirm");
  const resolvedErrorFallback = errorFallbackMessage ?? t("admin.common.actionFailed");
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
        throw new Error(typeof json.error === "string" ? json.error : resolvedErrorFallback);
      }

      toast.success(typeof successMessage === "function" ? successMessage(json) : successMessage ?? t("admin.common.done"));
      onSuccess?.(json);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : resolvedErrorFallback);
    } finally {
      setPending(false);
      setConfirmOpen(false);
    }
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // Root cause of "Delete does nothing" (Newsletter admin audit): this
    // button is normally rendered inside `AdminRowActionsMenu`'s dropdown,
    // which closes (and unmounts its children, including this component
    // and its `confirmOpen` state) on ANY click inside it -
    // `AdminRowActionsMenu`'s `role="menu"` wrapper has an unconditional
    // `onClick={() => setOpen(false)}` for exactly that reason (so a
    // one-step action like Deactivate/Reactivate closes the menu right
    // after firing). For a confirm-first action like Delete, that same
    // click bubbles up on the FIRST click - the one that's only supposed
    // to open the confirmation dialog - and the menu closing unmounts
    // this component before the dialog ever gets to render, so the
    // second, real click never happens: `run()` (the actual DELETE
    // fetch) is never called. `stopPropagation()` here (and on the
    // dialog's own Cancel/Confirm buttons below) keeps every click in
    // this two-step flow local to this component, regardless of what
    // it's rendered inside.
    event.stopPropagation();
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
        {pending ? resolvedPendingLabel : label}
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-950">{confirmTitle}</h3>
            {confirmDescription && <p className="mt-2 text-sm text-slate-500">{confirmDescription}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setConfirmOpen(false);
                }}
                disabled={pending}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void run();
                }}
                disabled={pending}
                className="rounded-xl bg-[#2f67e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2556c9] disabled:opacity-50"
              >
                {pending ? resolvedPendingLabel : resolvedConfirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
