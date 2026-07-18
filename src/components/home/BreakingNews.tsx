import Link from "next/link";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import { getBreakingNews, getFeaturedArticle } from "@/services/articles/article-read-service";

/**
 * "Breaking News" - a slim, urgent-feeling horizontal strip placed right
 * under the Hero (product redesign's new-sections list). High-trending
 * articles published within the last 48 hours (`getBreakingNews`);
 * genuinely-fresh items get a pulsing red "LIVE" dot, backfilled older
 * items (when the dataset doesn't have enough truly-fresh stories yet)
 * don't - see `BreakingNewsArticle.isFresh`. Renders nothing at all when
 * there's nothing to show, rather than an empty section shell.
 */
export async function BreakingNews() {
  const featured = await getFeaturedArticle();
  const items = await getBreakingNews(4, featured ? [featured.slug] : []);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="breaking-news-title" className="mx-auto mt-10 max-w-[1280px]">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
        </span>
        <h2 id="breaking-news-title" className="text-sm font-bold uppercase tracking-[0.14em] text-red-600">
          Breaking News
        </h2>
      </div>

      <div className="mt-3 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/article/${item.slug}`}
            className="group flex w-[280px] shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-[320px]"
          >
            <span className="relative size-16 shrink-0 overflow-hidden rounded-xl">
              <NewsImage
                src={item.image}
                fallbackSrc={resolveFallbackImageForCategory(item.category)}
                alt={item.title}
                fill
                sizes="64px"
                className="object-cover"
              />
            </span>
            <span className="min-w-0 flex-1">
              {item.isFresh && (
                <span className="mb-1 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
                  Just In
                </span>
              )}
              <span className="line-clamp-2 block text-sm font-semibold leading-snug text-slate-950 group-hover:text-[#2f67e8]">
                {item.title}
              </span>
              <span className="mt-1 block truncate text-xs text-slate-500">
                {item.category} • {item.publishedDate}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
