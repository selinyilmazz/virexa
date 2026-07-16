import { PopularTags } from "@/components/category/PopularTags";
import { NewsletterCard } from "@/components/category/NewsletterCard";
import type { CategoryNewsItem, CategoryTag } from "@/data/categories";

type CategorySidebarProps = {
  tags: CategoryTag[];
  recentNews: CategoryNewsItem[];
};

export function CategorySidebar({ tags, recentNews }: CategorySidebarProps) {
  return (
    <div className="space-y-6 xl:sticky xl:top-28">
      <PopularTags tags={tags} />
      <NewsletterCard />

      <section
        aria-labelledby="recent-news-title"
        className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 id="recent-news-title" className="text-3xl font-bold tracking-tight text-slate-950">
          Recently Added
        </h2>

        <ol className="mt-4 space-y-4">
          {recentNews.map((item, index) => (
            <li key={item.id} className="flex items-start gap-3">
              <span className="w-5 shrink-0 text-base font-bold text-slate-950">{index + 1}</span>
              <div className="min-w-0">
                <p className="line-clamp-2 text-base font-semibold leading-snug text-slate-950">{item.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {item.source} <span aria-hidden="true">•</span> {item.publishedDate}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
