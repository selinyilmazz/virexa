import Link from "next/link";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import { getEditorsPicks, getFeaturedArticle } from "@/services/articles/article-read-service";

/**
 * "Editor's Picks" (product polishing phase, 2nd pass: "gerçekten
 * editörün öne çıkardığı özel haberler hissini vermeli" - the previous
 * version read as an ordinary news card with a sticker badge on top).
 * There's still no real editorial-curation system (no "is_editors_pick"
 * flag on `articles` - see `getEditorsPicks`'s own doc comment), so this
 * surfaces the highest-trust-score stories, but the card itself now
 * carries the premium signal instead of a loud badge: a warm gold-tinted
 * background, a thin gold top rule, and a serif headline (the same
 * editorial treatment `HeroSection` uses for its own headline) - refined
 * rather than decorated. No new hover behavior or extra footprint versus
 * the standard `NewsCard`, just a distinct finish.
 */
export async function EditorsPicks() {
  const featured = await getFeaturedArticle();
  const items = await getEditorsPicks(3, featured ? [featured.slug] : []);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="editors-picks-title" className="mx-auto mt-10 max-w-[1280px]">
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
            className="group flex flex-col overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-b from-amber-50/50 to-white shadow-sm transition-shadow duration-200 hover:shadow-lg"
          >
            <span className="block h-[3px] w-full bg-gradient-to-r from-amber-400 via-amber-300 to-transparent" />
            <span className="relative block aspect-video w-full overflow-hidden">
              <NewsImage
                src={item.image}
                fallbackSrc={resolveFallbackImageForCategory(item.category)}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px"
                className="object-cover"
              />
            </span>
            <span className="flex flex-1 flex-col p-5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                <span aria-hidden="true">★</span> Editor&apos;s Pick
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-slate-400">{item.category}</span>
              </span>
              <span className="mt-2 line-clamp-2 font-serif text-xl font-bold leading-snug tracking-tight text-slate-950">
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
