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
 * "Trending Companies" (product redesign - promoted from an unlabeled
 * ticker strip to its own titled section, matching every other
 * homepage widget's header treatment for visual consistency). Same
 * underlying data/links as before; each card is now a distinct
 * bordered tile with a stronger hover lift instead of a flat inline row.
 */
export function CompanyTicker() {
  return (
    <section
      aria-labelledby="trending-companies-title"
      className="mx-auto mt-6 max-w-[1280px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f67e8]">Markets</p>
        <h2 id="trending-companies-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          Trending Companies
        </h2>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {companyTickerItems.map((item) => {
          const query = searchQueryByCompany[item.name] ?? item.name.toLowerCase();
          return (
            <li key={item.name} className="min-w-0">
              <Link
                href={`/search?q=${query}`}
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
              >
                <span
                  className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 p-2"
                  style={{ backgroundColor: item.logoBg }}
                >
                  <Image
                    src={item.logo}
                    alt={`${item.name} logo`}
                    width={32}
                    height={32}
                    className="h-full w-full object-contain"
                  />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{item.name}</p>
                  <p className="mt-0.5 text-sm leading-snug text-slate-500">{item.summary}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
