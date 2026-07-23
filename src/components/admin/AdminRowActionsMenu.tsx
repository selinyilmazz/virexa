"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type AdminRowActionsMenuProps = {
  /** The always-visible primary action (requirement 12: "Show only the primary action (Edit)") - typically a `<Link>` or small button, rendered as-is next to the menu trigger. */
  primary?: ReactNode;
  /** Secondary actions, rendered inside the dropdown when opened - typically a stack of `AdminMenuActionButton`/`AdminMenuLink`. */
  children: ReactNode;
  /** Accessible label for the trigger button, e.g. "More actions for vercel/next.js". */
  label?: string;
};

/**
 * The one three-dot overflow menu every admin table row uses (requirement
 * 12: "Replace row action buttons with a modern overflow menu... Use this
 * pattern consistently across all admin tables"). Only owns open/close/
 * outside-click/Escape/focus behavior - the actual actions inside are
 * whatever the caller passes as children (existing `AdminActionButton`-
 * based toggles, syncs, deletes, etc. via the `AdminMenuActionButton`
 * wrapper), so no table has to reimplement its write logic to adopt this.
 */
export function AdminRowActionsMenu({ primary, children, label = "More actions" }: AdminRowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="flex items-center justify-end gap-1.5">
      {primary}

      <div className="relative" ref={containerRef}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={label}
          onClick={() => setOpen((value) => !value)}
          className={`flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f67e8] ${
            open ? "bg-slate-100 text-slate-700" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" className="size-4.5" fill="currentColor">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>

        {open && (
          <div
            role="menu"
            onClick={() => setOpen(false)}
            className="absolute right-0 top-full z-20 mt-1.5 w-52 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
