import Link from "next/link";
import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";
import { getAIExplained } from "@/services/articles/article-read-service";

/**
 * "AI Explained" (product redesign's new-sections list) - a visually
 * distinct, dark gradient-themed section surfacing Virexa's OWN AI
 * analysis (`article_ai.summary`/`.tldr`) rather than just AI-topic
 * news, so it reads as a premium, Perplexity-Discover-style "here's
 * what our AI found" feature instead of another plain news grid. Falls
 * back to AI-category articles without enrichment yet when there aren't
 * `limit` enriched ones (`aiSummary` is `null` for those - the card
 * quietly omits the excerpt line rather than showing "null").
 */
export async function AIExplained() {
  const items = await getAIExplained(3);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="ai-explained-title" className="mx-auto mt-12 max-w-[1280px]">
      <div className="overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#1e1b4b_0%,#0f172a_55%,#111827_100%)] p-6 shadow-lg sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">✨</span>
          <div>
            <h2 id="ai-explained-title" className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              AI Explained
            </h2>
            <p className="text-sm text-white/60">What Virexa&apos;s AI is reading into the news</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/article/${item.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-200 hover:-translate-y-1 hover:bg-white/[0.08]"
            >
              <span className="relative block aspect-video w-full overflow-hidden">
                <NewsImage
                  src={item.image}
                  fallbackSrc={resolveFallbackImageForCategory(item.category)}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover opacity-90 transition-transform duration-300 group-hover:scale-[1.04]"
                />
                <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,42,0.85),transparent_60%)]" />
              </span>
              <span className="flex flex-1 flex-col p-4">
                <span className="line-clamp-2 text-sm font-bold leading-snug text-white">{item.title}</span>
                {item.aiSummary && (
                  <span className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-white/60">
                    <span className="font-semibold text-indigo-300">✨ AI summary — </span>
                    {item.aiSummary}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
