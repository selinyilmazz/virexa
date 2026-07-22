import Image from "next/image";
import Link from "next/link";
import { getResourcesNews, type ResourceBadge } from "@/services/articles/article-read-service";

/** Badge colors - FREE=green (a benefit), UPDATED=blue (informational), NEW=amber (draws the eye) - all real-article-derived (see `classifyResourceBadge`). */
const BADGE_CLASSES: Record<ResourceBadge, string> = {
  FREE: "bg-emerald-50 text-emerald-700",
  UPDATED: "bg-blue-50 text-blue-700",
  NEW: "bg-amber-50 text-amber-700",
};

/**
 * "Developer Resources" homepage widget (renamed from "Resources &
 * Career Hub" in Phase F) - developer career news (free certifications,
 * learning paths, licenses), NOT a courses catalog. Every row is a real,
 * currently-stored article (see `getResourcesNews()`'s doc comment) -
 * its real title, real source logo, real publish date. Renders nothing
 * when the database currently has no matching articles, same "no fake
 * placeholder content" convention as `LatestReleases`.
 *
 * Phase F additions: a FREE/UPDATED/NEW badge per item (see
 * `classifyResourceBadge` - derived from the article's own title/publish
 * recency, omitted rather than guessed when none applies), expanded from
 * 5 to 6 rows.
 */
export async function ResourcesCareerHub() {
  const items = await getResourcesNews(6);
  if (items.length === 0) return null;

  return (
    <section
      id="resources"
      aria-labelledby="resources-title"
      className="scroll-mt-32 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 id="resources-title" className="text-lg font-bold tracking-tight text-slate-950">
          Developer Resources
        </h2>
        <Link href="/developer-hub" className="shrink-0 text-sm font-medium text-[#2f67e8] transition-colors hover:text-[#2556c9]">
          View all
        </Link>
      </div>

      <ul className="mt-4 space-y-1">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/article/${item.slug}`}
              className="flex min-w-0 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50"
            >
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5">
                <Image src={item.sourceLogo} alt="" width={24} height={24} unoptimized className="h-full w-full object-contain" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 flex flex-wrap items-center gap-1.5 text-sm font-semibold leading-snug text-slate-950">
                  {item.badge && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${BADGE_CLASSES[item.badge]}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.title}
                </span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs text-slate-500">{item.publishedDate}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
