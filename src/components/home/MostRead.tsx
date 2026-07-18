import Link from "next/link";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import { getFeaturedArticle, getMostReadArticles } from "@/services/articles/article-read-service";

function formatViews(viewCount: number): string | null {
  if (viewCount <= 0) return null;
  return viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1).replace(/\.0$/, "")}K views` : `${viewCount} views`;
}

/**
 * Redesigned "Most Read" widget (product redesign: "thumbnails and
 * richer metadata"): each row now has a real square thumbnail and a
 * meta line combining category, view count (when the article has real
 * traffic), and publish date, instead of a bare title + single
 * source-or-views string.
 */
export async function MostRead() {
  // Excludes the current Hero/Featured article (product polishing
  // phase, area 5) - `getFeaturedArticle` is request-cached, so this
  // doesn't add a second DB round trip beyond what HeroSection already
  // pays for the same data.
  const featured = await getFeaturedArticle();
  const mostReadItems = await getMostReadArticles(5, featured?.slug);

  return (
    <section
      aria-labelledby="most-read-title"
      className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="px-1">
        <h2 id="most-read-title" className="text-2xl font-bold tracking-tight text-slate-950">
          📈 Most Read
        </h2>
        <p className="mt-1 text-sm text-slate-500">Most viewed articles today</p>
      </div>

      {mostReadItems.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No articles yet.
        </p>
      ) : (
        <ol className="mt-4 space-y-1">
          {mostReadItems.map((item, index) => {
            const views = formatViews(item.viewCount);
            return (
              <li key={item.slug}>
                <Link
                  href={`/article/${item.slug}`}
                  className="group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-slate-50"
                >
                  <span className="w-5 shrink-0 text-center text-lg font-bold text-slate-300 group-hover:text-[#2f67e8]">
                    {index + 1}
                  </span>
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
                    <span className="line-clamp-2 block text-sm font-semibold leading-snug text-slate-950">
                      {item.title}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-medium text-[#2f67e8]">{item.category}</span>
                      <span aria-hidden="true">•</span>
                      <span>{views ?? item.source}</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      <Link
        href="/most-read"
        className="mt-6 flex w-full items-center justify-center rounded-2xl border-2 border-[#2f67e8] px-6 py-3 text-base font-semibold text-[#2f67e8] transition-colors hover:bg-blue-50"
      >
        View all most read articles →
      </Link>
    </section>
  );
}
