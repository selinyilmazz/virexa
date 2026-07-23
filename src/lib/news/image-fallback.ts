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
  // No dedicated asset yet (stabilization pass added this category) -
  // reuses the Games artwork rather than falling through to Technology,
  // since it's the closer visual match until a bespoke SVG is added.
  "Mobile Games": "/images/news/fallback/games.svg",
  World: "/images/news/fallback/world.svg",
  Science: "/images/news/fallback/science.svg",
  Security: "/images/news/fallback/security.svg",
  Startup: "/images/news/fallback/startup.svg",
  Programming: "/images/news/fallback/programming.svg",
  Mobile: "/images/news/fallback/mobile.svg",
  Robotics: "/images/news/fallback/robotics.svg",
  Space: "/images/news/fallback/space.svg",
};

/**
 * URL patterns that mark an image as a favicon, publisher logo, or
 * generic placeholder graphic rather than a real article photo -
 * product polishing phase, area 3 ("IMAGE QUALITY... Reject: favicons,
 * publisher logos, placeholder graphics"). Matched against the whole
 * URL (path + filename), case-insensitively, so it catches both
 * `/favicon.ico` and `/assets/logo-192x192.png`-style paths regardless
 * of which directory a publisher happens to serve them from.
 */
const REJECTED_IMAGE_URL_PATTERNS: RegExp[] = [
  /favicon/i,
  /\.ico(\?|$)/i,
  /apple-touch-icon/i,
  /[-_/.]logo/i,
  /logo[-_.]/i,
  /sprite/i,
  /placeholder/i,
  /default[-_]?image/i,
  /avatar/i,
  /\bicon[-_.]/i,
  /1x1\.(png|gif)/i,
  /spacer\.(png|gif)/i,
  /blank\.(png|gif)/i,
  /og-default/i,
];

/**
 * Minimum declared pixel width (the narrower of width/height, when both
 * are known - only width is ever available here) for an image to count
 * as a real article photo rather than a small icon/thumbnail. 200px is
 * comfortably above typical favicon (16-64px) and social-icon
 * (~48-150px) sizes while still well below any real photo a publisher
 * would use as a hero/enclosure image (typically 600px+).
 */
const MIN_ACCEPTABLE_IMAGE_WIDTH = 200;

/**
 * Whether `url` is acceptable as a real article image - not a favicon,
 * publisher logo, or placeholder graphic (by URL pattern), and not
 * below the minimum resolution when a declared `width` is known. A
 * missing/`undefined` width is NOT itself a rejection reason - most
 * legitimate `<enclosure>`/inline `<img>` RSS images and some og:image
 * tags never declare a size at all, and rejecting every unsized
 * candidate would throw away far more good images than bad ones.
 * Downloading and measuring every candidate to get a definitive answer
 * would turn one lightweight enrichment step into N full image
 * downloads per article (see `pickBestImageUrl`'s doc comment for the
 * same tradeoff) - URL-pattern + declared-width is the same
 * zero-extra-request heuristic already used for quality comparison,
 * just applied as a reject/accept gate instead.
 */
export function isAcceptableImageUrl(url: string | undefined, width?: number): boolean {
  if (!url || url.trim().length === 0) return false;
  if (REJECTED_IMAGE_URL_PATTERNS.some((pattern) => pattern.test(url))) return false;
  if (typeof width === "number" && width > 0 && width < MIN_ACCEPTABLE_IMAGE_WIDTH) return false;
  return true;
}

/** Returns `image` when it's a non-empty, acceptable-quality string (see `isAcceptableImageUrl`), otherwise a category default - never a favicon/logo/placeholder ("clean application fallback image instead of random icons"). */
export function resolveArticleImage(image: string | undefined, category: Category): string {
  if (isAcceptableImageUrl(image)) {
    return image as string;
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
 * Every candidate is also run through `isAcceptableImageUrl` first
 * (product polishing phase, area 3) - a favicon, publisher logo,
 * placeholder graphic, or below-`MIN_ACCEPTABLE_IMAGE_WIDTH` candidate
 * is dropped from consideration entirely, even if it's the only
 * candidate with a declared width. This is what stops a `<media:content>`
 * pointing at a tracking pixel or a site's logo from ever winning
 * against a smaller-but-real photo, or from being trusted outright by
 * `resolveBestImages`'s "size-declared, skip the og lookup" fast path.
 *
 * Returns `undefined` when `candidates` is empty, every entry's `url`
 * is blank, or every entry is rejected as a favicon/logo/placeholder/
 * too-small image - callers fall through to `resolveArticleImage`'s
 * category placeholder in that case, never before.
 */
export function pickBestImageUrl(candidates: ImageCandidate[]): string | undefined {
  const usable = candidates.filter((candidate) => isAcceptableImageUrl(candidate.url, candidate.width));
  if (usable.length === 0) return undefined;

  const withKnownWidth = usable.filter((candidate) => typeof candidate.width === "number" && candidate.width > 0);
  if (withKnownWidth.length > 0) {
    return withKnownWidth.reduce((best, candidate) => ((candidate.width ?? 0) > (best.width ?? 0) ? candidate : best))
      .url;
  }

  return usable[0].url;
}
