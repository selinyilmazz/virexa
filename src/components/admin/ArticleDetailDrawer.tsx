"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type ArticleDetailDrawerProps = {
  /** URL to return to when the drawer is dismissed - the current article list with `selected` stripped. */
  closeHref: string;
  children: ReactNode;
};

/**
 * Thin client shell for the read-only Article Detail Drawer (requirement
 * 4). Deliberately holds no data-fetching logic of its own - `page.tsx`
 * (a Server Component) already fetched the detail via
 * `getAdminArticleDetail()` and passes it down as pre-rendered
 * `children`. This component only owns the two client-only concerns:
 * closing on backdrop click and closing on Escape.
 */
export function ArticleDetailDrawer({ closeHref, children }: ArticleDetailDrawerProps) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        router.push(closeHref, { scroll: false });
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeHref, router]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close article detail"
        onClick={() => router.push(closeHref, { scroll: false })}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />
      <div className="relative flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl sm:rounded-l-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <h2 className="text-lg font-bold text-slate-950">Article Detail</h2>
          <button
            type="button"
            onClick={() => router.push(closeHref, { scroll: false })}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
