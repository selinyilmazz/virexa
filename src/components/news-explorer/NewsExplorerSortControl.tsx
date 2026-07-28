"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/i18n/i18n-provider";

const SORT_OPTION_VALUES = ["newest", "most-read", "trending", "oldest"] as const;
const SORT_OPTION_LABEL_KEYS: Record<(typeof SORT_OPTION_VALUES)[number], string> = {
  newest: "explorer.sort.newest",
  "most-read": "explorer.sort.mostRead",
  trending: "explorer.sort.trending",
  oldest: "explorer.sort.oldest",
};

/** Writes `sort` immediately on change (not staged like the filter sidebar - same convention as `SearchSortControl`). */
export function NewsExplorerSortControl() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "newest";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      {t("explorer.sort.label")}
      <select
        value={currentSort}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 outline-none focus:border-[#2f67e8]"
      >
        {SORT_OPTION_VALUES.map((value) => (
          <option key={value} value={value}>
            {t(SORT_OPTION_LABEL_KEYS[value])}
          </option>
        ))}
      </select>
    </label>
  );
}
