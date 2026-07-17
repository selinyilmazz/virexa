import Link from "next/link";
import { getFeaturedArticle, getMostReadArticles } from "@/services/articles/article-read-service";

function formatMeta(item: { source: string; viewCount: number }): string {
  return item.viewCount > 0 ? `${item.viewCount.toLocaleString("en-US")} views` : item.source;
}

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
        <h2 id="most-read-title" className="font-serif text-3xl font-bold tracking-tight text-slate-950">
          📈 Most Read
        </h2>
        <p className="mt-1 text-base text-slate-500">Most viewed articles today</p>
      </div>

      {mostReadItems.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No articles yet.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {mostReadItems.map((item, index) => (
            <li key={item.slug} className="flex items-start gap-3">
              <span className="w-5 shrink-0 text-base font-bold text-slate-950">{index + 1}</span>
              <div className="min-w-0">
                <p className="text-base font-semibold leading-snug text-slate-950">{item.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{formatMeta(item)}</p>
              </div>
            </li>
          ))}
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
