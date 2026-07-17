import { NewsCard } from "@/components/news/NewsCard";
import { getLatestArticles } from "@/services/articles/article-read-service";

export async function LatestNews() {
  const latestNewsItems = await getLatestArticles(8);

  return (
    <section aria-labelledby="latest-news-title" className="mx-auto mt-10 max-w-[1280px]">
      <div className="flex items-center justify-between gap-4">
        <h2 id="latest-news-title" className="text-3xl font-bold tracking-tight text-slate-950">
          Latest News
        </h2>
        <a
          href="/news"
          className="shrink-0 text-base font-medium text-[#2f67e8] transition-colors hover:text-[#2556c9]"
        >
          View All →
        </a>
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
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {latestNewsItems.map((item) => (
            <NewsCard key={item.slug} {...item} />
          ))}
        </div>
      )}
    </section>
  );
}
