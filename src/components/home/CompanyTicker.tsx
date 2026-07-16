import Image from "next/image";
import { companyTickerItems } from "@/data/company-ticker";

export function CompanyTicker() {
  return (
    <section aria-label="Company updates" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {companyTickerItems.map((item) => (
          <li key={item.name} className="flex min-w-0 items-center gap-3 rounded-2xl p-2">
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
          </li>
        ))}
      </ul>
    </section>
  );
}
