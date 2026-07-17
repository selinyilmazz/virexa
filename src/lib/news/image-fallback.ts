import type { Category } from "@/types/news";

/**
 * Default cover image per normalized category, used when a provider
 * doesn't supply one (or supplies a broken/empty URL). Every category in
 * the `Category` union has an entry, so this is a total function — there
 * is always a safe image to fall back to.
 */
const CATEGORY_FALLBACK_IMAGES: Record<Category, string> = {
  Technology: "/images/news/fallback/technology.svg",
  AI: "/images/news/fallback/ai.svg",
  Business: "/images/news/fallback/business.svg",
  Games: "/images/news/fallback/games.svg",
  World: "/images/news/fallback/world.svg",
  Science: "/images/news/fallback/science.svg",
  Security: "/images/news/fallback/security.svg",
  Startup: "/images/news/fallback/startup.svg",
};

/** Returns `image` when it's a non-empty string, otherwise a category default. */
export function resolveArticleImage(image: string | undefined, category: Category): string {
  if (image && image.trim().length > 0) {
    return image;
  }
  return CATEGORY_FALLBACK_IMAGES[category];
}

/**
 * Same fallback images as `resolveArticleImage`, but tolerant of any
 * plain `string` category (not just the strict `Category` union) and of
 * a missing category entirely - always returns a valid local path, so
 * it can never itself become a second broken image. Used client-side by
 * `<NewsImage>` (`components/news/NewsImage.tsx`) as the `onError`
 * target: at that point all that's available is whatever `category`
 * string a component already had as a display prop (which is always a
 * normalized `Category` value in practice, since it came from the
 * server-side `normalizeCategory()` pipeline, but isn't always *typed*
 * that strictly at every call site - e.g. `RelatedArticleItem` doesn't
 * carry a category at all). Falls back to the Technology image for an
 * unrecognized or missing category.
 */
export function resolveFallbackImageForCategory(category: string | undefined): string {
  if (category && category in CATEGORY_FALLBACK_IMAGES) {
    return CATEGORY_FALLBACK_IMAGES[category as Category];
  }
  return CATEGORY_FALLBACK_IMAGES.Technology;
}
