import Link from "next/link";
import { NewsCard } from "@/components/news/NewsCard";
import { getFeaturedArticle, getLatestArticles } from "@/services/articles/article-read-service";

export async function LatestNews() {
  // Excludes whatever HeroSection is currently featuring, so the same
  // story doesn't show up as both the Hero and the first Latest News
  // card (product polishing phase, area 5). `getFeaturedArticle` is
  // request-cached, so this doesn't add a second DB round trip beyond
  // what HeroSection already pays.
  const featured = await getFeaturedArticle();
  const latestNewsItems = await getLatestArticles(8, featured?.slug);

  return (
    <section aria-labelledby="latest-news-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f67e8]">Newsroom</p>
          <h2 id="latest-news-title" className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Latest News
          </h2>
        </div>
        <Link
          href="/categories"
          className="shrink-0 text-base font-medium text-[#2f67e8] transition-colors hover:text-[#2556c9]"
        >
          View All →
        </Link>
      </div>
      {latestNewsItems.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
            📰
          </span>
          <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-950">No articles yet</h3>
          <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">
            We&apos;re still gathering the latest stories. Check back shortly.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {latestNewsItems.map((item) => (
            <NewsCard key={item.slug} {...item} />
          ))}
        </div>
      )}
    </section>
  );
}
