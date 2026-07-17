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
