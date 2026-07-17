"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = ["Technology", "Business", "AI", "Games", "World", "Science", "Security", "Startup"] as const;

type SourceOption = { id: string; name: string };

type AdminArticleFiltersProps = {
  sources: SourceOption[];
};

const SEARCH_DEBOUNCE_MS = 400;

/**
 * URL-param-driven filter bar for `/admin/articles` (requirement 2:
 * Source/Category/Language/Country/Date range/Trust Score/Trending
 * Score) plus the free-text search box (requirement 3). All filtering
 * happens through `router.push` so the Server Component `page.tsx`
 * re-runs `getAdminArticlesPage()` with the new params - no client-side
 * fetch, keeping the read path server-first (requirement 9).
 *
 * The search box auto-applies with a debounce ("debounce kullanılabilir").
 * The remaining range/select filters use an explicit "Apply" button -
 * ten independent debounced inputs would fire ten separate navigations
 * per keystroke burst, so a single submit is the safer, simpler choice
 * for a multi-field form.
 */
export function AdminArticleFilters({ sources }: AdminArticleFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
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
    params.delete("selected");
    router.push(`/admin/articles?${params.toString()}`, { scroll: false });
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

  function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fields = ["source", "category", "language", "country", "dateFrom", "dateTo", "minTrust", "maxTrust", "minTrending", "maxTrending"];
    pushParams((params) => {
      for (const field of fields) {
        const value = String(formData.get(field) ?? "").trim();
        if (value) params.set(field, value);
        else params.delete(field);
      }
    });
  }

  function handleClear() {
    setSearch("");
    router.push("/admin/articles", { scroll: false });
  }

  const hasActiveFilters = Array.from(searchParams.keys()).some((key) => key !== "page");

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
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
          placeholder="Search by title, URL, source, or tag..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#2f67e8] focus:outline-none focus:ring-2 focus:ring-[#2f67e8]/20"
        />
      </div>

      <form onSubmit={handleApply} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          name="source"
          defaultValue={searchParams.get("source") ?? ""}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
        >
          <option value="">All Sources</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>

        <select
          name="category"
          defaultValue={searchParams.get("category") ?? ""}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="language"
          defaultValue={searchParams.get("language") ?? ""}
          placeholder="Language (e.g. en)"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#2f67e8] focus:outline-none"
        />

        <input
          type="text"
          name="country"
          defaultValue={searchParams.get("country") ?? ""}
          placeholder="Country (e.g. us)"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#2f67e8] focus:outline-none"
        />

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Published From
          <input
            type="date"
            name="dateFrom"
            defaultValue={searchParams.get("dateFrom") ?? ""}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Published To
          <input
            type="date"
            name="dateTo"
            defaultValue={searchParams.get("dateTo") ?? ""}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
          />
        </label>

        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-500">
            Min Trust
            <input
              type="number"
              name="minTrust"
              min={0}
              max={100}
              defaultValue={searchParams.get("minTrust") ?? ""}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-500">
            Max Trust
            <input
              type="number"
              name="maxTrust"
              min={0}
              max={100}
              defaultValue={searchParams.get("maxTrust") ?? ""}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-500">
            Min Trending
            <input
              type="number"
              name="minTrending"
              min={0}
              defaultValue={searchParams.get("minTrending") ?? ""}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-500">
            Max Trending
            <input
              type="number"
              name="maxTrending"
              min={0}
              defaultValue={searchParams.get("maxTrending") ?? ""}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
            />
          </label>
        </div>

        <div className="flex items-end gap-2 lg:col-span-4">
          <button type="submit" className="rounded-xl bg-[#2f67e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2556c9]">
            Apply Filters
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear All
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
