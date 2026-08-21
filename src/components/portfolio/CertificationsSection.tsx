import { certifications, type Certification } from "@/data/portfolio";

/**
 * Grouped by `issuer` for presentation - the CV itself groups the 4 BTK
 * Akademi / ICT Authority entries under one block, so showing them as
 * one card with 4 rows (instead of 4 near-identical cards) avoids the
 * card clutter this section could otherwise have. Purely a rendering
 * grouping - `certifications` stays a flat array in the data module.
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
      className="mx-auto max-w-[1200px] border-t border-[var(--portfolio-border)] px-5 py-20 sm:px-8 sm:py-28"
    >
      <p className="text-sm font-medium tracking-wide text-[var(--portfolio-accent)] uppercase">Certifications</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--portfolio-text)] sm:text-4xl">
        Certifications &amp; Training
      </h2>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {groups.map(([issuer, items]) => (
          <div
            key={issuer}
            className="rounded-2xl border border-[var(--portfolio-border)] bg-[var(--portfolio-surface)] p-6 sm:p-8"
          >
            <h3 className="text-lg font-bold text-[var(--portfolio-text)]">{issuer}</h3>

            <div className="mt-4 flex flex-col gap-4">
              {items.map((item, index) => (
                <div
                  key={item.name}
                  className={index > 0 ? "border-t border-[var(--portfolio-border)] pt-4" : undefined}
                >
                  <p className="text-sm font-semibold text-[var(--portfolio-text)]">{item.name}</p>

                  {(item.status || item.date || item.location) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {item.status && (
                        <span className="inline-flex items-center rounded-full border border-[var(--portfolio-border)] bg-[var(--portfolio-bg)] px-3 py-1 text-xs font-medium text-[var(--portfolio-text)]">
                          {item.status}
                        </span>
                      )}
                      {item.date && <span className="text-sm text-[var(--portfolio-muted)]">{item.date}</span>}
                      {item.location && (
                        <span className="text-sm text-[var(--portfolio-muted)]">{item.location}</span>
                      )}
                    </div>
                  )}

                  {item.description && (
                    <p className="mt-2 text-sm leading-relaxed text-[var(--portfolio-muted)]">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
