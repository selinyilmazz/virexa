import Image from "next/image";
import Link from "next/link";
import { companyTickerItems } from "@/data/company-ticker";

const searchQueryByCompany: Record<string, string> = {
  NVIDIA: "nvidia",
  Apple: "apple",
  Tesla: "tesla",
  NASA: "nasa",
  Microsoft: "microsoft",
};

/**
 * "Trending Companies" - the bottom section of the homepage's unified
 * right sidebar card, directly under Trending Topics inside the same
 * shared bordered card (product polishing phase, 3rd pass, layout
 * correction #3 - see `TrendingTopics.tsx`'s doc comment for why this
 * component carries no border/padding of its own). Same card content/
 * links/hover treatment as before, stacked top-to-bottom (`space-y-2`).
 */
export function CompanyTicker() {
  return (
    <section aria-labelledby="trending-companies-title">
      <div className="px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Markets</p>
        <h2 id="trending-companies-title" className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          Trending Companies
        </h2>
      </div>
      <ul className="mt-4 space-y-2">
        {companyTickerItems.map((item) => {
          const query = searchQueryByCompany[item.name] ?? item.name.toLowerCase();
          return (
            <li key={item.name} className="min-w-0">
              <Link
                href={`/search?q=${query}`}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 p-1.5"
                  style={{ backgroundColor: item.logoBg }}
                >
                  <Image
                    src={item.logo}
                    alt={`${item.name} logo`}
                    width={28}
                    height={28}
                    className="h-full w-full object-contain"
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                  <p className="mt-0.5 truncate text-xs leading-snug text-slate-500">{item.summary}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
