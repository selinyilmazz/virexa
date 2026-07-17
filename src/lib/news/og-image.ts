import { fetchWithTimeout } from "@/lib/news/fetch-with-timeout";

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

const IMAGE_META_PROPERTIES = ["og:image:secure_url", "og:image", "twitter:image"];

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

/** Matches `<meta property="X" content="Y">` in either attribute order (some sites emit `content` before `property`/`name`). */
function extractMetaContent(html: string, propertyNames: string[]): string | undefined {
  for (const name of propertyNames) {
    const propertyFirst = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i")
    );
    if (propertyFirst?.[1]) return propertyFirst[1];

    const contentFirst = html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i")
    );
    if (contentFirst?.[1]) return contentFirst[1];
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

/**
 * Fetches `pageUrl` and extracts its OpenGraph (falling back to Twitter
 * Card) preview image - used for sources whose own data never includes
 * an image field (Hacker News API items only ever give a title + a
 * destination URL) and as a last-resort fallback for RSS items whose
 * feed XML has no `<media:content>`/`<media:thumbnail>`/`<enclosure>`.
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
export async function fetchOgImage(pageUrl: string): Promise<string | undefined> {
  try {
    const response = await fetchWithTimeout(
      pageUrl,
      { headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; VirexaBot/1.0; +https://virexa.app)" } },
      OG_IMAGE_TIMEOUT_MS
    );
    if (!response.ok) return undefined;

    const html = await readCappedText(response, MAX_HTML_SCAN_BYTES);
    const raw = extractMetaContent(html, IMAGE_META_PROPERTIES);
    if (!raw) return undefined;

    return resolveAbsoluteUrl(raw, pageUrl);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[fetchOgImage] Failed to extract og:image from ${pageUrl}: ${reason}`);
    return undefined;
  }
}
