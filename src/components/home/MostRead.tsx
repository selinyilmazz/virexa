import Link from "next/link";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import { getMostRead } from "@/services/articles/article-read-service";

/**
 * Homepage "Most Read" widget - paired with Breaking News in the page's
 * second section (product polishing phase, 3rd pass, layout correction
 * #3). A numbered, thumbnail list in the same bordered-card language as
 * every other sidebar widget (`rounded-3xl border ... shadow-sm`), sized
 * for a sidebar column rather than the full content width. Links out to
 * the full, paginated `/most-read` page for anyone who wants more than
 * this handful of items. Renders nothing when there's no data yet,
 * consistent with every other section on this page.
 */
export async function MostRead() {
  const items = await getMostRead(5);
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="most-read-title"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f67e8]">Popular</p>
          <h2 id="most-read-title" className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            Most Read
          </h2>
        </div>
        <Link href="/most-read" className="shrink-0 text-sm font-medium text-[#2f67e8] transition-colors hover:text-[#2556c9]">
          View All
        </Link>
      </div>

      <ol className="mt-4 space-y-2">
        {items.map((item, index) => (
          <li key={item.slug}>
            <Link
              href={`/article/${item.slug}`}
              className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
            >
              <span aria-hidden="true" className="w-5 shrink-0 text-center text-sm font-bold text-slate-300">
                {index + 1}
              </span>
              <span className="relative size-11 shrink-0 overflow-hidden rounded-lg">
                <NewsImage
                  src={item.image}
                  fallbackSrc={resolveFallbackImageForCategory(item.category)}
                  alt={item.title}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-sm font-semibold leading-snug text-slate-950 group-hover:text-[#2f67e8]">
                  {item.title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">{item.category}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
