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

/**
 * One real-image option under consideration for an article: a URL plus
 * its declared pixel width, when known. "Declared" - not measured by
 * downloading the image itself (see `pickBestImageUrl` below for why).
 */
export type ImageCandidate = {
  url: string;
  /** Declared width in pixels, from `media:content`/`media:thumbnail`'s `width` attribute (RSS) or `og:image:width`/`twitter:image:width` (OpenGraph/Twitter Card meta tags). `undefined` when the source gave no size hint at all (a bare `<enclosure>`, an inline `<img>`, or a page whose meta tags omit the width variant). */
  width?: number;
};

/**
 * Picks the best real image among every candidate source Virexa can
 * find for one article: RSS `media:content`/`media:thumbnail`/
 * `enclosure`/inline `<img>` (`xml-feed-parser.ts`), a provider's own
 * image field (NewsAPI `urlToImage`, GNews `image`), and the article
 * page's own `og:image`/`twitter:image` (`og-image.ts`) - "og:image,
 * twitter:image, RSS enclosure ve provider image arasında en kaliteli
 * görseli seçsin."
 *
 * Deliberately compares DECLARED pixel width (an attribute already
 * present in the RSS XML or the page's own `<head>` meta tags), never
 * downloads any candidate image just to measure it - that would turn
 * one lightweight enrichment step into N full image downloads per
 * article, working directly against the OG-lookup budget/latency work
 * already done (`MAX_OG_LOOKUPS_PER_FEED`, `OG_IMAGE_TIMEOUT_MS`).
 * Declared width is exactly what a browser itself uses to pick a
 * `srcset` candidate before downloading anything, so this is a
 * standard, legitimate quality signal, not a rough guess.
 *
 * Resolution order:
 *   1. Among every candidate with a known `width`, the largest wins.
 *   2. If none has a known width, the FIRST candidate in `candidates`
 *      wins - callers order their array by source priority for exactly
 *      this case (e.g. "prefer the page's real og:image over a bare
 *      RSS `<enclosure>` when neither declares a size").
 *
 * Returns `undefined` only when `candidates` is empty or every entry's
 * `url` is blank - callers fall through to `resolveArticleImage`'s
 * category placeholder in that case, never before.
 */
export function pickBestImageUrl(candidates: ImageCandidate[]): string | undefined {
  const usable = candidates.filter((candidate) => candidate.url.trim().length > 0);
  if (usable.length === 0) return undefined;

  const withKnownWidth = usable.filter((candidate) => typeof candidate.width === "number" && candidate.width > 0);
  if (withKnownWidth.length > 0) {
    return withKnownWidth.reduce((best, candidate) => ((candidate.width ?? 0) > (best.width ?? 0) ? candidate : best))
      .url;
  }

  return usable[0].url;
}
