"use client";

import { useState, type ReactNode } from "react";

function FilterIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

type FiltersDrawerProps = { children: ReactNode };

/**
 * Responsive shell for every unified Explorer route's Filters sidebar
 * (News Explorer, Search Results, category pages, Most Read, and any
 * future listing page - one component, reused everywhere per the shared
 * design system). Desktop (`xl` and up): renders `children` inline,
 * exactly as before (the parent `<aside>` in `ExplorerView` already
 * makes it sticky). Tablet and mobile (below `xl`): `children` is
 * off-canvas by default behind a "Filters" toggle button, sliding in as
 * a backdrop + drawer instead of pushing a huge filter panel above every
 * article on small screens. There is only ONE instance of `children` in
 * the DOM - its position/visibility just differ per breakpoint via
 * Tailwind responsive classes - so the filters themselves (which read/
 * write the URL directly, no staged local state) behave identically no
 * matter which breakpoint rendered them.
 */
export function FiltersDrawer({ children }: FiltersDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:border-slate-300 xl:hidden"
      >
        <FilterIcon />
        Filters
      </button>

      {/* Backdrop - mobile/tablet only. */}
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity duration-200 xl:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Single instance of the filters panel - off-canvas drawer below `xl`, static sticky column at `xl`+. */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-[#f8fafc] p-4 shadow-2xl transition-transform duration-300 xl:static xl:z-auto xl:w-auto xl:max-w-none xl:translate-x-0 xl:overflow-visible xl:bg-transparent xl:p-0 xl:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-3 flex items-center justify-between xl:hidden">
          <span className="text-sm font-bold text-slate-950">Filters</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
            className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors duration-200 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
