"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/i18n/i18n-provider";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Search-by-email + newest/oldest sort for `/admin/newsletter` - same
 * URL-param-driven, debounced convention as `AdminSourceFilters`
 * (requirement 10: unified filtering feel across every admin listing).
 * Sort is a real query param (`sort=newest|oldest`) rather than client
 * state so it survives a page reload/share, same as `q`/`page`/`pageSize`.
 */
export function AdminNewsletterFilters() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    const queryString = params.toString();
    router.push(queryString ? `/admin/newsletter?${queryString}` : "/admin/newsletter", { scroll: false });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams((params) => {
        const trimmed = value.trim();
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
      });
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSortChange(value: "newest" | "oldest") {
    pushParams((params) => {
      if (value === "oldest") params.set("sort", "oldest");
      else params.delete("sort");
    });
  }

  const hasActiveFilters = Array.from(searchParams.keys()).some((key) => key !== "page" && key !== "pageSize");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-64">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder={t("admin.newsletter.searchPlaceholder")}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#2f67e8] focus:outline-none focus:ring-2 focus:ring-[#2f67e8]/20"
        />
      </div>

      <label className="flex items-center gap-1.5">
        <span className="sr-only">{t("admin.newsletter.sortLabel")}</span>
        <select
          value={sort}
          onChange={(event) => handleSortChange(event.target.value === "oldest" ? "oldest" : "newest")}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f67e8]"
        >
          <option value="newest">{t("admin.newsletter.sortNewest")}</option>
          <option value="oldest">{t("admin.newsletter.sortOldest")}</option>
        </select>
      </label>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            router.push("/admin/newsletter", { scroll: false });
          }}
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          {t("admin.common.clearAll")}
        </button>
      )}
    </div>
  );
}
