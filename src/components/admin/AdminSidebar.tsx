"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNavGroups } from "@/components/admin/AdminNavGroups";

/**
 * Fixed desktop sidebar for the whole `/admin` area. Shares
 * `AdminNavGroups` (grouped/collapsible rendering of `ADMIN_NAV_GROUPS`)
 * with `AdminMobileNav` (the small-screen drawer) so both surfaces list
 * exactly the same destinations, grouped the same way (requirement 12).
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-20 items-center gap-2 border-b border-slate-200 px-6">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#2f67e8] text-sm font-bold text-white">
          V
        </span>
        <div>
          <p className="text-base font-bold leading-tight text-slate-950">Virexa</p>
          <p className="text-xs text-slate-500">Admin</p>
        </div>
      </div>

      <AdminNavGroups pathname={pathname} />

      <div className="border-t border-slate-200 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m4 11 8-7 8 7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 10v9.5h12V10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Website
        </Link>
      </div>
    </aside>
  );
}
