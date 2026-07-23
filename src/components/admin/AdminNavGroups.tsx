"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ADMIN_NAV_GROUPS, isActiveAdminPath } from "@/components/admin/admin-nav-items";

type AdminNavGroupsProps = {
  pathname: string;
};

/**
 * Shared, grouped/collapsible nav rendering for both `AdminSidebar`
 * (desktop) and `AdminMobileNav` (drawer) - requirement 12: "Improve the
 * admin sidebar. Group related modules into collapsible sections." Reads
 * `ADMIN_NAV_GROUPS` (see that file for why the groups look the way they
 * do). Each section's open/closed state persists in `localStorage` across
 * reloads, and a group auto-opens the first time the active page lives
 * inside it (so navigating via a direct link never hides the current
 * page inside a collapsed section).
 */
export function AdminNavGroups({ pathname }: AdminNavGroupsProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("admin-nav-open-groups");
      if (stored) setOpenGroups(JSON.parse(stored));
    } catch {
      // Ignore malformed/unavailable storage - sections just default open below.
    }
  }, []);

  function toggleGroup(label: string) {
    setOpenGroups((previous) => {
      const next = { ...previous, [label]: !isGroupOpen(label, previous) };
      try {
        window.localStorage.setItem("admin-nav-open-groups", JSON.stringify(next));
      } catch {
        // Best-effort persistence only.
      }
      return next;
    });
  }

  function isGroupOpen(label: string, state: Record<string, boolean> = openGroups): boolean {
    if (label in state) return state[label];
    return true; // Default every section to open until the admin explicitly collapses it.
  }

  return (
    <nav aria-label="Admin navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {ADMIN_NAV_GROUPS.map((group, index) => {
        if (group.label === null) {
          return (
            <div key={`top-${index}`} className="space-y-1 pb-2">
              {group.items.map((item) => (
                <AdminNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActiveAdminPath(pathname, item.href)} />
              ))}
            </div>
          );
        }

        const open = isGroupOpen(group.label);
        const groupHasActive = group.items.some((item) => isActiveAdminPath(pathname, item.href));

        return (
          <div key={group.label} className="pb-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.label!)}
              aria-expanded={open}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                groupHasActive ? "text-[#2f67e8]" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {group.label}
              <svg
                viewBox="0 0 24 24"
                className={`size-3.5 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {open && (
              <div className="mt-0.5 space-y-1">
                {group.items.map((item) => (
                  <AdminNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActiveAdminPath(pathname, item.href)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function AdminNavLink({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? "bg-blue-50 text-[#2f67e8]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
