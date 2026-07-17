import { NewsCard } from "@/components/news/NewsCard";
import { latestNewsItems } from "@/data/latestNews";

export function LatestNews() {
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
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {latestNewsItems.map((item) => (
          <NewsCard key={item.slug} {...item} />
        ))}
      </div>
    </section>
  );
}
