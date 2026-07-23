import Link from "next/link";
import { NewsCard } from "@/components/news/NewsCard";
import { getFeaturedArticles, getLatestArticles } from "@/services/articles/article-read-service";

/**
 * Homepage refinement pass: back to a 2x2 grid of large editorial cards
 * (image-dominant `NewsCard`, unchanged) instead of the compact list this
 * section briefly used - explicit spec: "large editorial cards... exactly
 * like a modern editorial homepage... similar to Medium/Apple News/Arc
 * Browser/Linear Blog", with a single centered "View All News" button
 * below the grid as the section's one navigation action (the previous
 * small top-right "View all" link is removed - one clear CTA, not two).
 *
 * Excludes whichever articles the Hero carousel is currently featuring
 * (`getFeaturedArticles`, request-cached - shared with `HeroSection` with
 * no extra DB round trip), so the same stories don't show up twice on
 * the homepage.
 *
 * Phase F: renamed "Latest News" -> "Top Stories" (heading/eyebrow text
 * only - same 2x2 grid, same data). "View All News" now points at the
 * dedicated `/news` News Explorer page instead of `/categories` - a real
 * separate page (per the explicit requirement that this button navigate
 * away, not expand/load-more in place on the homepage).
 */
export async function LatestNews() {
  const featured = await getFeaturedArticles(4);
  const excludeSlug = featured[0]?.slug;
  const latestNewsItems = await getLatestArticles(4, excludeSlug);

  return (
    <section aria-labelledby="latest-news-title" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Newsroom</p>
        <h2 id="latest-news-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          Top Stories
        </h2>
      </div>

      {latestNewsItems.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center">
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
            📰
          </span>
          <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-950">No articles yet</h3>
          <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">
            We&apos;re still gathering the latest stories. Check back shortly.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {latestNewsItems.map((item) => (
              <NewsCard key={item.slug} {...item} />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              View All News
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
