"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * URL-param-driven filter bar for `/admin/users` (requirement 1:
 * search + role/verification/suspension filters). Same conventions as
 * `AdminArticleFilters.tsx`: debounced search auto-applies, select
 * filters apply immediately on change (only 3 of them here, unlike
 * Articles' 10-field form, so an explicit "Apply" button isn't needed).
 */
export function AdminUserFilters() {
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
    router.push(`/admin/users?${params.toString()}`, { scroll: false });
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

  function handleSelectChange(key: string, value: string) {
    pushParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <input
        type="search"
        value={search}
        onChange={(event) => handleSearchChange(event.target.value)}
        placeholder="Search by name or email..."
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#2f67e8] focus:outline-none focus:ring-2 focus:ring-[#2f67e8]/20 lg:col-span-2"
      />

      <select
        defaultValue={searchParams.get("role") ?? ""}
        onChange={(event) => handleSelectChange("role", event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
      >
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>

      <select
        defaultValue={searchParams.get("verified") ?? ""}
        onChange={(event) => handleSelectChange("verified", event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
      >
        <option value="">Any Verification</option>
        <option value="true">Email Verified</option>
        <option value="false">Not Verified</option>
      </select>

      <select
        defaultValue={searchParams.get("suspended") ?? ""}
        onChange={(event) => handleSelectChange("suspended", event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
      >
        <option value="">Any Status</option>
        <option value="false">Active</option>
        <option value="true">Suspended</option>
      </select>
    </div>
  );
}
