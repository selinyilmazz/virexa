"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Notifications bell (authenticated navbar redesign). There is no
 * notification-generation backend in Virexa yet (no breaking-news push,
 * no release-alert queue) - rather than inventing fake notification rows
 * to fill the dropdown, this honestly shows an empty state, same
 * "graceful hide/honest empty state, never fabricate" convention used
 * throughout this app (e.g. the Article Detail page hiding an empty AI
 * Insights card). The bell itself is real UI a future notifications
 * feature can slot into without any layout change.
 */
export function HeaderNotifications() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative hidden shrink-0 items-center md:flex">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Notifications"
        className="flex items-center justify-center text-slate-500 transition-colors hover:text-[#2f67e8] dark:text-slate-400 dark:hover:text-blue-400"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 9a6 6 0 0 1 12 0c0 3.5 1 5 1.5 5.5H4.5C5 14 6 12.5 6 9Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 17.5a2.5 2.5 0 0 0 5 0" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <span aria-hidden="true" className="mx-auto flex size-11 items-center justify-center rounded-full bg-slate-50 text-xl dark:bg-slate-800">
            🔔
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">You&apos;re all caught up</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Breaking news and Developer Release alerts will show up here once you turn them on in Settings.
          </p>
        </div>
      )}
    </div>
  );
}
