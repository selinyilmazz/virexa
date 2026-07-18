import { env } from "@/lib/env";
import { fetchWithTimeout } from "@/lib/news/fetch-with-timeout";
import { isAcceptableImageUrl } from "@/lib/news/image-fallback";
import type { Category } from "@/types/news";

/**
 * Stage 3 of the image-resolution pipeline (see `NewsAggregator.fetchArticles`'s
 * doc comment for the full 5-stage priority order): a real, topically-
 * relevant, royalty-free stock photo search, tried only for articles that
 * still have no acceptable image after their own RSS/provider feed image
 * and any og:image/Twitter Card lookup (stages 1-2, already done upstream
 * in `RSSProvider`/`HackerNewsProvider`/`og-image.ts`).
 *
 * Every provider below is a genuinely legal, royalty-free source (never
 * Google Images, never AI-generated art) and every one is optional -
 * `Pexels`/`Unsplash`/`Pixabay` no-op without their own API key configured
 * (same "unconfigured is a normal, safe state" convention `NewsAPIProvider`/
 * `GNewsProvider` already use), and `Wikimedia Commons` needs no key at
 * all, so this stage always has at least one real, working source even on
 * a deployment with zero stock-photo API keys set.
 *
 * Called once per article, during ingestion (`NewsAggregator.fetchArticles`,
 * itself only ever invoked by the Runtime pipeline's fetch steps or the
 * in-memory live-articles cache refresh - never per page view), and the
 * result is persisted straight to `articles.image_url` by the database
 * step. A page view never triggers a lookup here.
 */

export type StockImageProviderId = "pexels" | "unsplash" | "pixabay" | "wikimedia";

export type StockImageResult = {
  url: string;
  width?: number;
  provider: StockImageProviderId;
};

/** Individual provider lookup budget. Kept tighter than `OG_IMAGE_TIMEOUT_MS`/`FEED_TIMEOUT_MS` (8000ms elsewhere) on purpose - this is a "nice to have" enrichment stage, not core content, so failing fast onto the next provider (or, worst case, the local placeholder) beats risking the whole pipeline job's timeout. Providers are tried in priority order below, so the real worst case (every configured provider timing out back-to-back) is `configuredProviderCount * STOCK_IMAGE_TIMEOUT_MS` - deployments that configure more than one paid provider should size `JOB_TIMEOUT` (see `.env.example`) with that in mind. */
const STOCK_IMAGE_TIMEOUT_MS = 5000;

const STOPWORDS = new Set([
  "a", "an", "the", "of", "in", "on", "for", "to", "and", "or", "is", "are",
  "with", "at", "by", "from", "as", "after", "before", "new", "says", "say",
  "report", "reports", "update", "updates", "latest", "how", "why", "what",
  "this", "that", "its", "it's", "your", "you", "we", "our", "into", "over",
  "amid", "than", "vs", "up", "down", "out", "now",
]);

/**
 * Turns an article title into a short, topical search query: strips HN's
 * "Ask HN:"/"Show HN:" prefixes, drops punctuation, filters out stopwords
 * and very short tokens, and keeps the first 6 remaining significant
 * words. This is what makes the resulting stock photo actually match the
 * article's subject (a smartphone story searches for
 * "iPhone camera upgrade", not a random photo) rather than a purely
 * generic category image - the category name is still used, but only as
 * the fallback query below when the title itself has no usable signal.
 */
function buildTitleQuery(title: string): string {
  return title
    .replace(/^(ask hn|show hn):/i, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOPWORDS.has(word.toLowerCase()))
    .slice(0, 6)
    .join(" ")
    .trim();
}

/** One query per lookup (not a list to retry) - see `STOCK_IMAGE_TIMEOUT_MS`'s doc comment for why this stage deliberately avoids multiplying out provider-count x query-count. Falls back to the plain category name when the title has no usable signal (e.g. an all-stopword or very short title) - still a genuinely topical query, just a broader one. */
function buildSearchQuery(title: string, category: Category): string {
  const titleQuery = buildTitleQuery(title);
  return titleQuery.length >= 3 ? titleQuery : category;
}

function logProviderFailure(provider: StockImageProviderId, query: string, error: unknown): void {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(`[stock-image-provider] "${provider}" search failed for "${query}": ${reason}`);
}

/** Pexels (https://www.pexels.com/api/) - free API, requires `PEXELS_API_KEY`. */
async function searchPexels(query: string): Promise<StockImageResult | undefined> {
  if (!env.stockImages.pexelsApiKey) return undefined;
  try {
    const response = await fetchWithTimeout(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: env.stockImages.pexelsApiKey } },
      STOCK_IMAGE_TIMEOUT_MS
    );
    if (!response.ok) return undefined;

    const data = (await response.json()) as {
      photos?: { src?: { large?: string; original?: string }; width?: number }[];
    };
    const photo = data.photos?.[0];
    const url = photo?.src?.large ?? photo?.src?.original;
    if (!url || !isAcceptableImageUrl(url, photo?.width)) return undefined;

    return { url, width: photo?.width, provider: "pexels" };
  } catch (error) {
    logProviderFailure("pexels", query, error);
    return undefined;
  }
}

/** Unsplash (https://unsplash.com/developers) - free API, requires `UNSPLASH_ACCESS_KEY`. */
async function searchUnsplash(query: string): Promise<StockImageResult | undefined> {
  if (!env.stockImages.unsplashAccessKey) return undefined;
  try {
    const response = await fetchWithTimeout(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${env.stockImages.unsplashAccessKey}` } },
      STOCK_IMAGE_TIMEOUT_MS
    );
    if (!response.ok) return undefined;

    const data = (await response.json()) as {
      results?: { urls?: { regular?: string; full?: string }; width?: number }[];
    };
    const photo = data.results?.[0];
    const url = photo?.urls?.regular ?? photo?.urls?.full;
    if (!url || !isAcceptableImageUrl(url, photo?.width)) return undefined;

    return { url, width: photo?.width, provider: "unsplash" };
  } catch (error) {
    logProviderFailure("unsplash", query, error);
    return undefined;
  }
}

/** Pixabay (https://pixabay.com/api/docs/) - free API, requires `PIXABAY_API_KEY`. `per_page` must be >= 3 per Pixabay's own API constraint even though only the first hit is used. */
async function searchPixabay(query: string): Promise<StockImageResult | undefined> {
  if (!env.stockImages.pixabayApiKey) return undefined;
  try {
    const response = await fetchWithTimeout(
      `https://pixabay.com/api/?key=${env.stockImages.pixabayApiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3`,
      {},
      STOCK_IMAGE_TIMEOUT_MS
    );
    if (!response.ok) return undefined;

    const data = (await response.json()) as { hits?: { largeImageURL?: string; imageWidth?: number }[] };
    const hit = data.hits?.[0];
    const url = hit?.largeImageURL;
    if (!url || !isAcceptableImageUrl(url, hit?.imageWidth)) return undefined;

    return { url, width: hit?.imageWidth, provider: "pixabay" };
  } catch (error) {
    logProviderFailure("pixabay", query, error);
    return undefined;
  }
}

/**
 * Wikimedia Commons (https://commons.wikimedia.org) - the free-media
 * repository behind Wikipedia. Public API, no key/signup required, so
 * this is the one provider in the chain that's always available - the
 * baseline that makes stage 3 work out of the box on a deployment with
 * zero stock-photo API keys configured, not just an upgrade path for
 * deployments that add one. `filetype:bitmap` restricts results to real
 * photos/raster images (excludes SVG diagrams, PDFs, audio files, etc.
 * that Commons also indexes under the same search).
 */
async function searchWikimedia(query: string): Promise<StockImageResult | undefined> {
  try {
    const searchUrl =
      "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
      `&gsrsearch=${encodeURIComponent(`filetype:bitmap ${query}`)}` +
      "&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url|size&format=json&origin=*";

    const response = await fetchWithTimeout(
      searchUrl,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; VirexaBot/1.0; +https://virexa.app)" } },
      STOCK_IMAGE_TIMEOUT_MS
    );
    if (!response.ok) return undefined;

    const data = (await response.json()) as {
      query?: { pages?: Record<string, { imageinfo?: { url?: string; width?: number }[] }> };
    };
    const pages = data.query?.pages;
    if (!pages) return undefined;

    const info = Object.values(pages)[0]?.imageinfo?.[0];
    const url = info?.url;
    if (!url || !isAcceptableImageUrl(url, info?.width)) return undefined;

    return { url, width: info?.width, provider: "wikimedia" };
  } catch (error) {
    logProviderFailure("wikimedia", query, error);
    return undefined;
  }
}

/**
 * Priority order: Pexels -> Unsplash -> Pixabay -> Wikimedia Commons.
 * Each entry is tried in turn, sequentially (not in parallel) - the goal
 * is exactly one good image, not four; hitting every configured provider
 * for every article would multiply API cost/rate-limit exposure for zero
 * benefit once the first one already found something acceptable.
 * Unconfigured providers (`Pexels`/`Unsplash`/`Pixabay` without their own
 * API key) return immediately without a network call, so they cost
 * nothing in the chain - `Wikimedia` is always attempted last since it
 * never needs configuration.
 */
const PROVIDER_CHAIN: ((query: string) => Promise<StockImageResult | undefined>)[] = [
  searchPexels,
  searchUnsplash,
  searchPixabay,
  searchWikimedia,
];

/**
 * Searches for one topically-relevant, royalty-free stock photo for an
 * article, trying each configured provider in priority order and
 * returning the first acceptable hit (never a favicon/logo/placeholder/
 * too-small image - every provider result is still run through
 * `isAcceptableImageUrl`, the same quality gate every other image source
 * in this app uses). Returns `undefined` - never throws - when every
 * provider is unconfigured/unreachable/found nothing usable; the caller
 * (`NewsAggregator.fetchArticles`) falls through to the local category
 * placeholder (stage 5) in that case.
 */
export async function searchStockImage(title: string, category: Category): Promise<StockImageResult | undefined> {
  const query = buildSearchQuery(title, category);

  for (const provider of PROVIDER_CHAIN) {
    const result = await provider(query);
    if (result) return result;
  }

  return undefined;
}
