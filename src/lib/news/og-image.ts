import { fetchWithTimeout } from "@/lib/news/fetch-with-timeout";
import { isAcceptableImageUrl } from "@/lib/news/image-fallback";

/** How long to wait for the article page itself. Matches every provider's own `REQUEST_TIMEOUT_MS`/`FEED_TIMEOUT_MS` (8000, see `rss-provider.ts`/`newsapi-provider.ts`/`gnews-provider.ts`/`hackernews-provider.ts`) rather than a shorter, provider-specific value - many publisher article pages are heavier than their own feed/API responses, and this was previously set 2s tighter than that shared convention, cutting off some real og:image lookups (and falling back to a category placeholder image) on slower-loading pages for no real benefit. */
const OG_IMAGE_TIMEOUT_MS = 8000;

/**
 * Cap on how many bytes of the response body to read while scanning for
 * an og:image/twitter:image meta tag. These tags are virtually always
 * inside `<head>`, so reading a large article page's full HTML (which
 * can run several hundred KB) is wasted bandwidth and time - the first
 * ~200KB is enough for every real-world page this has been checked
 * against.
 */
const MAX_HTML_SCAN_BYTES = 200_000;

/** Priority order when a page declares more than one of these - `og:image:secure_url` first (explicitly HTTPS), then plain `og:image`, then Twitter Card's `twitter:image` as the final fallback. */
const IMAGE_META_PROPERTIES = ["og:image:secure_url", "og:image", "twitter:image"];

/** Paired width meta tag for each image property above, when the page declares one - lets the caller compare this image's declared quality against other candidates (RSS feed image, provider image) without downloading anything. `og:image:secure_url` and `og:image` share the same `og:image:width` tag per the OpenGraph spec (there's no separate `og:image:secure_url:width`). */
const IMAGE_WIDTH_META_PROPERTIES: Record<string, string> = {
  "og:image:secure_url": "og:image:width",
  "og:image": "og:image:width",
  "twitter:image": "twitter:image:width",
};

/** Reads at most `maxBytes` of a response body as text, then releases the connection - avoids downloading (and holding open a connection for) the rest of a large page once enough has been read. Falls back to the full `response.text()` if the runtime doesn't expose a streaming body reader (defensive - `fetch` in this app's Node runtime always does). */
async function readCappedText(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return response.text();
  }

  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let text = "";

  try {
    while (receivedBytes < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  return text;
}

/** Matches `<meta property="X" content="Y">` in either attribute order (some sites emit `content` before `property`/`name`), for one specific property name. */
function extractMetaContentFor(html: string, name: string): string | undefined {
  const propertyFirst = html.match(
    new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i")
  );
  if (propertyFirst?.[1]) return propertyFirst[1];

  const contentFirst = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i")
  );
  return contentFirst?.[1];
}

/** Tries every property name in priority order, returning both the matched content AND which property matched (so the caller can look up that property's paired width tag, e.g. `og:image` -> `og:image:width`). */
function extractMetaImage(html: string, propertyNames: string[]): { content: string; property: string } | undefined {
  for (const name of propertyNames) {
    const content = extractMetaContentFor(html, name);
    if (content) return { content, property: name };
  }
  return undefined;
}

/** OpenGraph image URLs are sometimes relative (`/images/cover.jpg`) - resolves against the page's own URL, same as a browser would. */
function resolveAbsoluteUrl(candidate: string, pageUrl: string): string | undefined {
  try {
    return new URL(candidate, pageUrl).toString();
  } catch {
    return undefined;
  }
}

/** Parses a meta tag's raw width content ("1200") into a positive integer, or `undefined` for anything blank/non-numeric/zero-or-negative. */
function parseDeclaredWidth(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const width = Number.parseInt(raw, 10);
  return Number.isFinite(width) && width > 0 ? width : undefined;
}

export type OgImageResult = {
  url: string;
  /** Declared pixel width from the page's own `og:image:width`/`twitter:image:width` meta tag, when present - used for the same cross-source quality comparison as `ParsedFeedItem.imageWidth` (see `lib/news/image-fallback.ts`'s `pickBestImageUrl`). Most pages don't declare this; `undefined` is the common case, not an error. */
  width?: number;
};

/**
 * Fetches `pageUrl` and extracts its OpenGraph (falling back to Twitter
 * Card) preview image, plus its declared width when the page provides
 * one - used for sources whose own data never includes an image field
 * (Hacker News API items only ever give a title + a destination URL)
 * and, for RSS, compared against the feed's own image so the higher-
 * quality one wins instead of always trusting whichever the feed
 * happened to supply (see `RSSProvider`'s `enrichImages` for that
 * comparison).
 *
 * Never throws - resolves to `undefined` for any failure (timeout,
 * non-2xx response, no matching tag, an unparseable URL), matching
 * every `NewsProvider`'s "never throw" contract. Meant to be called
 * once per article at ingestion time (see `HackerNewsProvider`,
 * `RSSProvider`) and the result persisted to `articles.image_url` -
 * never per page view, so repeat visits to the same article cost zero
 * extra HTTP requests. See the Performance section of the Image
 * Enrichment phase report for the full reasoning.
 */
export async function fetchOgImage(pageUrl: string): Promise<OgImageResult | undefined> {
  try {
    const response = await fetchWithTimeout(
      pageUrl,
      { headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; VirexaBot/1.0; +https://virexa.app)" } },
      OG_IMAGE_TIMEOUT_MS
    );
    if (!response.ok) return undefined;

    const html = await readCappedText(response, MAX_HTML_SCAN_BYTES);
    const match = extractMetaImage(html, IMAGE_META_PROPERTIES);
    if (!match) return undefined;

    const url = resolveAbsoluteUrl(match.content, pageUrl);
    if (!url) return undefined;

    const widthProperty = IMAGE_WIDTH_META_PROPERTIES[match.property];
    const width = widthProperty ? parseDeclaredWidth(extractMetaContentFor(html, widthProperty)) : undefined;

    // Reject a favicon/logo/placeholder/too-small og:image right at the
    // source (product polishing phase, area 3) - many publisher pages
    // fall back to their own site logo or a generic social-share badge
    // for og:image when an article genuinely has no photo, and that's
    // exactly the "tiny logos, publisher icons, generic placeholders"
    // pattern the polishing pass calls out. Every caller (RSSProvider,
    // HackerNewsProvider) benefits automatically without its own check.
    if (!isAcceptableImageUrl(url, width)) return undefined;

    return { url, width };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[fetchOgImage] Failed to extract og:image from ${pageUrl}: ${reason}`);
    return undefined;
  }
}
