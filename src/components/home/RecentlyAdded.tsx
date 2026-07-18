import Link from "next/link";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import { getFeaturedArticle, getRecentlyAdded } from "@/services/articles/article-read-service";

/**
 * "Recently Added" (product redesign's new-sections list) - newest
 * articles by INGESTION time (`getRecentlyAdded`, sorted by
 * `created_at`), deliberately distinct from "Latest News" (sorted by
 * `published_at`). A horizontal-scroll strip of compact cards, the same
 * rhythm `BreakingNews` uses, so consecutive homepage sections don't all
 * read as the same grid shape.
 */
export async function RecentlyAdded() {
  const featured = await getFeaturedArticle();
  const items = await getRecentlyAdded(6, featured ? [featured.slug] : []);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recently-added-title" className="mx-auto mt-12 max-w-[1280px]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f67e8]">Fresh in the database</p>
        <h2 id="recently-added-title" className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          Recently Added
        </h2>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/article/${item.slug}`}
            className="group flex w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="relative block aspect-video w-full overflow-hidden">
              <NewsImage
                src={item.image}
                fallbackSrc={resolveFallbackImageForCategory(item.category)}
                alt={item.title}
                fill
                sizes="220px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
            </span>
            <span className="flex flex-1 flex-col p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {item.category}
              </span>
              <span className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-950">
                {item.title}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
