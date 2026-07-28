"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
// Imported from the plain, dependency-free `shared.ts` - NOT from
// `developer-hub-service.ts` - because that service file transitively
// imports the Supabase *server* client (`next/headers`), which a Client
// Component like this one can never safely pull in. See `shared.ts`'s
// doc comment for the full explanation.
import { RESOURCE_TYPE_LABELS, type CatalogResourceType } from "@/lib/developer-hub/shared";
import { useTranslations } from "@/i18n/i18n-provider";

const TYPE_IDS = Object.keys(RESOURCE_TYPE_LABELS) as CatalogResourceType[];
const DIFFICULTY_IDS = ["beginner", "intermediate", "advanced"] as const;
const PRICE_IDS = ["free", "paid"] as const;

type CatalogFiltersPanelProps = {
  types: string[];
  difficulties: string[];
  prices: string[];
};

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

/**
 * Developer Hub's sticky filter sidebar - Type / Difficulty / Price, no
 * "Apply" button, every section always expanded (same instant-apply, no-
 * accordion convention as `NewsExplorerFiltersPanel`, applied to the
 * catalog domain instead of articles). `type` deliberately has no
 * "Releases" option - Releases are real software/tool releases served by
 * the dedicated Release Library instead (`/developer-hub/releases`,
 * `ReleaseLibraryView`), not part of this static/live catalog pool - see
 * `developer-hub-service.ts`'s doc comment.
 */
export function CatalogFiltersPanel({ types, difficulties, prices }: CatalogFiltersPanelProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushParams(next: { types?: string[]; difficulties?: string[]; prices?: string[] }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("types");
    params.delete("difficulty");
    params.delete("price");
    params.delete("page");

    const nextTypes = next.types !== undefined ? next.types : types;
    const nextDifficulties = next.difficulties !== undefined ? next.difficulties : difficulties;
    const nextPrices = next.prices !== undefined ? next.prices : prices;

    if (nextTypes.length > 0) params.set("types", nextTypes.join(","));
    if (nextDifficulties.length > 0) params.set("difficulty", nextDifficulties.join(","));
    if (nextPrices.length > 0) params.set("price", nextPrices.join(","));

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggleType(id: string) {
    pushParams({ types: toggleValue(types, id) });
  }

  function toggleDifficulty(id: string) {
    pushParams({ difficulties: toggleValue(difficulties, id) });
  }

  function togglePrice(id: string) {
    pushParams({ prices: toggleValue(prices, id) });
  }

  function clearAll() {
    pushParams({ types: [], difficulties: [], prices: [] });
  }

  const checkboxClass = "size-4 rounded accent-[#2f67e8]";
  const labelClass = "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition-colors duration-200 hover:bg-slate-50";
  const legendClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-slate-950">{t("developerHub.filters.heading")}</h2>
        <button type="button" onClick={clearAll} className="text-xs font-medium text-slate-500 transition-colors duration-200 hover:text-slate-700">
          {t("developerHub.filters.clearAll")}
        </button>
      </div>

      <fieldset>
        <legend className={legendClass}>{t("developerHub.filters.type")}</legend>
        <div className="mt-2 space-y-1">
          {TYPE_IDS.map((id) => (
            <label key={id} className={labelClass}>
              <input type="checkbox" checked={types.includes(id)} onChange={() => toggleType(id)} className={checkboxClass} />
              {t(`developerHub.resourceType.${id}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>{t("developerHub.filters.difficulty")}</legend>
        <div className="mt-2 space-y-1">
          {DIFFICULTY_IDS.map((id) => (
            <label key={id} className={labelClass}>
              <input
                type="checkbox"
                checked={difficulties.includes(id)}
                onChange={() => toggleDifficulty(id)}
                className={checkboxClass}
              />
              {t(`developerHub.difficulty.${id}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>{t("developerHub.filters.pricing")}</legend>
        <div className="mt-2 space-y-1">
          {PRICE_IDS.map((id) => (
            <label key={id} className={labelClass}>
              <input type="checkbox" checked={prices.includes(id)} onChange={() => togglePrice(id)} className={checkboxClass} />
              {t(`developerHub.price.${id}`)}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
