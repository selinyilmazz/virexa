import { NewsImage } from "@/components/news/NewsImage";
import { resolveFallbackImageForCategory } from "@/lib/news";

type ArticleHeroProps = {
  image: string;
  category: string;
  title: string;
};

/**
 * Article Detail redesign (complete rebuild, Bloomberg/Verge/Stripe-Docs-
 * style editorial layout) - the hero is now ONLY the image (structure
 * item 2). Category badge, title, and deck moved to their own dedicated
 * spots (items 3-5, see `ArticleHeaderBlock`) so each element reads as
 * its own clear step down the page instead of being bundled into one
 * block. 16:9 ratio (`aspect-video`), nearly full content width, rounded
 * to match this page's `rounded-3xl` card convention.
 */
export function ArticleHero({ image, category, title }: ArticleHeroProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl">
      <NewsImage
        src={image}
        fallbackSrc={resolveFallbackImageForCategory(category)}
        alt={title}
        fill
        sizes="(max-width: 1024px) 100vw, 1010px"
        className="object-cover"
        priority
      />
    </div>
  );
}
