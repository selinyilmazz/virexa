"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNavGroups } from "@/components/admin/AdminNavGroups";

/**
 * Small-screen counterpart to `AdminSidebar` (which is `hidden lg:flex`
 * only - previously there was NO mobile navigation at all for `/admin`).
 * A hamburger button (rendered by `AdminHeader`) toggles this slide-in
 * drawer via local state lifted here; closes automatically on route
 * change, Escape, or backdrop click - the same interaction conventions
 * already used by `ArticleDetailDrawer` and `HeaderAuthArea`'s dropdown.
 */
export function AdminMobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open admin navigation"
        aria-expanded={isOpen}
        className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex lg:hidden">
          <button type="button" aria-label="Close admin navigation" onClick={() => setIsOpen(false)} className="absolute inset-0 bg-slate-950/40" />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-200 px-5">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#2f67e8] text-sm font-bold text-white">V</span>
                <p className="text-sm font-bold text-slate-950">Virexa Admin</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
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
          </div>
        </div>
      )}
    </>
  );
}
