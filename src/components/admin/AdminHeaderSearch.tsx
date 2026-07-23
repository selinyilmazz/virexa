"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Global admin search box (requirement 14) - submits to `/admin/search`,
 * a real Server Component page backed by `admin-search-service.ts` that
 * queries Articles/Sources/Repositories/Releases/Users in parallel. Kept
 * as a plain GET form (not a live-typing dropdown) so it works exactly
 * the same way the rest of this admin area's filters do (URL-driven,
 * shareable, no client-side data fetching for the results themselves).
 */
export function AdminHeaderSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/admin/search?q=${encodeURIComponent(trimmed)}` : "/admin/search");
  }

  return (
    <form onSubmit={handleSubmit} className="hidden min-w-0 flex-1 max-w-md md:block">
      <label className="relative block">
        <span className="sr-only">Search admin</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search articles, users, repositories, releases, sources…"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#2f67e8] focus:bg-white"
        />
      </label>
    </form>
  );
}
