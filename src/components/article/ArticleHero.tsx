import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";

type ArticleHeroProps = {
  image: string;
  category: string;
  title: string;
};

/**
 * Hero image + category + title only (product polishing phase, 4th
 * pass, item 6's exact section order: "Hero image -> Title -> Short
 * intro -> ..."). No longer renders a subtitle/dek here - it used to
 * show the raw RSS `description` directly under the title, which item 7
 * explicitly forbids ("RSS açıklaması asla doğrudan kullanıcıya
 * gösterilmemeli"). The "Short intro" that used to live here is now
 * `ArticleContent`'s first section, sourced from the AI rewrite's
 * `intro` field instead of the untouched RSS blurb.
 */
export function ArticleHero({ image, category, title }: ArticleHeroProps) {
  return (
    <div>
      <div className="relative aspect-[12/5] w-full overflow-hidden rounded-3xl">
        <NewsImage
          src={image}
          fallbackSrc={resolveFallbackImageForCategory(category)}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 1180px"
          className="object-cover"
          priority
        />
      </div>

      <span className="mt-6 inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-[#2f67e8]">
        {category}
      </span>

      <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>
    </div>
  );
}
