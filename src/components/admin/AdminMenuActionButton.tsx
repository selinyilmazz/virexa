"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";
import type { ComponentProps } from "react";

type AdminMenuActionButtonProps = Omit<ComponentProps<typeof AdminActionButton>, "variant" | "className"> & {
  /** Red text for destructive items (Delete, Archive) - everything else uses the default neutral row styling. */
  destructive?: boolean;
  icon?: React.ReactNode;
};

/**
 * `AdminActionButton` restyled as a full-width menu row instead of a
 * standalone pill button - drop-in for use inside `AdminRowActionsMenu`.
 * Keeps every bit of `AdminActionButton`'s real behavior (pending state,
 * confirmation step, fetch, toast, `router.refresh()`) - only the visual
 * chrome changes, via `!`-prefixed Tailwind overrides (which compile to
 * `!important`, so they reliably win over `AdminActionButton`'s own
 * variant classes regardless of class order).
 */
export function AdminMenuActionButton({ destructive = false, icon, ...props }: AdminMenuActionButtonProps) {
  return (
    <AdminActionButton
      {...props}
      variant="secondary"
      className={`!w-full !justify-start !gap-2 !rounded-lg !border-0 !bg-transparent !px-3 !py-2 !text-left !text-sm !font-medium !shadow-none hover:!bg-slate-50 ${
        destructive ? "!text-red-600 hover:!bg-red-50" : "!text-slate-700"
      }`}
      label={
        icon ? (
          <span className="flex items-center gap-2">
            {icon}
            {props.label}
          </span>
        ) : (
          props.label
        )
      }
    />
  );
}
