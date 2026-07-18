import Link from "next/link";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import { getEditorsPicks, getFeaturedArticle } from "@/services/articles/article-read-service";

/**
 * "Editor's Picks" (product redesign's new-sections list). There's no
 * real editorial-curation system yet (no "is_editors_pick" flag on
 * `articles` - see `getEditorsPicks`'s own doc comment), so this
 * surfaces the highest-trust-score stories instead, badged with a gold
 * ribbon rather than the plain category chip every other card uses, to
 * read as a distinct, hand-picked-feeling section rather than another
 * "Latest News" grid.
 */
export async function EditorsPicks() {
  const featured = await getFeaturedArticle();
  const items = await getEditorsPicks(3, featured ? [featured.slug] : []);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="editors-picks-title" className="mx-auto mt-12 max-w-[1280px]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">Curated by Virexa</p>
        <h2 id="editors-picks-title" className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          Editor&apos;s Picks
        </h2>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/article/${item.slug}`}
            className="group flex flex-col overflow-hidden rounded-3xl border border-amber-200/70 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          >
            <span className="relative block aspect-video w-full overflow-hidden">
              <NewsImage
                src={item.image}
                fallbackSrc={resolveFallbackImageForCategory(item.category)}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
              <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow-sm">
                ⭐ Editor&apos;s Pick
              </span>
            </span>
            <span className="flex flex-1 flex-col p-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.category}</span>
              <span className="mt-1.5 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-950">
                {item.title}
              </span>
              <span className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
                {item.description}
              </span>
              <span className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{item.source}</span>
                <span aria-hidden="true">•</span>
                <span>{item.publishedDate}</span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
