import { certifications, type Certification } from "@/data/portfolio";
import { PortfolioReveal } from "./PortfolioReveal";

/**
 * Grouped by `issuer` for presentation (same grouping logic as the prior
 * pass - the CV itself groups the 4 BTK Akademi / ICT Authority entries
 * under one block). Restyled as a two-column typographic list with
 * hairline rules instead of boxed cards; `certifications` stays a flat
 * array in the data module.
 */
function groupByIssuer(items: Certification[]): [string, Certification[]][] {
  const groups = new Map<string, Certification[]>();
  for (const item of items) {
    const group = groups.get(item.issuer) ?? [];
    group.push(item);
    groups.set(item.issuer, group);
  }
  return Array.from(groups.entries());
}

export function CertificationsSection() {
  const groups = groupByIssuer(certifications);

  return (
    <section
      id="certifications"
      className="mx-auto max-w-[1240px] border-t border-[var(--portfolio-border)] px-6 py-20 sm:px-10 sm:py-28"
    >
      <PortfolioReveal>
        <p className="text-xs font-semibold tracking-[0.22em] text-[var(--portfolio-accent)] uppercase">
          Certifications
        </p>
        <h2 className="portfolio-serif mt-3 text-4xl text-[var(--portfolio-text)] sm:text-5xl">
          Certifications &amp; Training
        </h2>
      </PortfolioReveal>

      <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-2">
        {groups.map(([issuer, items], groupIndex) => (
          <PortfolioReveal key={issuer} delayMs={groupIndex * 70}>
            <h3 className="portfolio-serif text-xl text-[var(--portfolio-text)]">{issuer}</h3>

            <div className="mt-5 flex flex-col">
              {items.map((item, index) => (
                <div key={item.name} className={index > 0 ? "portfolio-rule pt-4 pb-4" : "pb-4"}>
                  <p className="text-[15px] font-medium text-[var(--portfolio-text)]">{item.name}</p>

                  {(item.status || item.date || item.location) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      {item.status && <span className="font-medium text-[var(--portfolio-accent)]">{item.status}</span>}
                      {item.date && <span className="text-[var(--portfolio-muted)]">{item.date}</span>}
                      {item.location && <span className="text-[var(--portfolio-muted)]">{item.location}</span>}
                    </div>
                  )}

                  {item.description && (
                    <p className="mt-2 text-sm leading-relaxed text-[var(--portfolio-muted)]">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </PortfolioReveal>
        ))}
      </div>
    </section>
  );
}
