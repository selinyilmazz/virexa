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

export function CompanyTicker() {
  return (
    <section aria-label="Company updates" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {companyTickerItems.map((item) => {
          const query = searchQueryByCompany[item.name] ?? item.name.toLowerCase();
          return (
            <li key={item.name} className="min-w-0">
              <Link
                href={`/search?q=${query}`}
                className="flex min-w-0 items-center gap-3 rounded-2xl p-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
