import { fetchWithTimeout } from "@/lib/news/fetch-with-timeout";
import { splitIntoParagraphs } from "@/lib/news/paragraph-split";

/**
 * Real full-article-text extraction, run at ingestion time (never per
 * page view) for every article whose provider/RSS-supplied content is
 * too thin to actually read (product polishing phase, 4th pass, item 9,
 * then reliability pass, 5th pass: "scraping'i daha güvenilir hale
 * getir"). This extracted text is the grounding material the AI
 * article-rewrite capability (`article-rewrite.prompt.ts`) is built
 * from, so it needs to capture close to the REAL article body, not just
 * a short lead-in - a 700-1500 word rewrite grounded in a 500-word
 * extraction would either run thin or start inventing details that
 * were never in the source.
 *
 * Three extraction strategies, tried in order of reliability, first
 * substantial hit wins (5th pass reliability upgrade):
 *
 *  1. JSON-LD `articleBody` (`extractJsonLdArticleBody`) - most major
 *     news CMSs (WordPress/VIP, Ghost, Arc, custom) embed the FULL,
 *     clean article text as structured data for search engines
 *     (schema.org `Article`/`NewsArticle`/`BlogPosting`). When present,
 *     this is far more reliable than any HTML heuristic: it's already
 *     plain text, already excludes nav/ads/related-content chrome, and
 *     is genuinely the complete body, not just a lead-in.
 *  2. `<article>`-tag-scoped paragraph extraction - most other sites
 *     still wrap the real body in the semantic `<article>` element,
 *     which narrows the search space dramatically before falling back
 *     to strategy 3's whole-page scan.
 *  3. Whole-document `<p>` scan (the original approach) - the same
 *     pragmatic heuristic as before, now also rejecting paragraphs that
 *     are mostly link text (`isMostlyLinkText`) - a common shape for
 *     "related articles" / navigation blocks that otherwise clear the
 *     plain length filter.
 *
 * Deliberately dependency-free (no Readability/jsdom - this sandbox's
 * package registry access is locked down to what's already installed,
 * and a DOM-parsing dependency is heavy for a serverless-style
 * enrichment call that just needs "good enough" plain text, not a
 * pixel-perfect reader view): everything above is still regex/string
 * based, just smarter about WHERE it looks and WHAT it accepts.
 */

const CONTENT_FETCH_TIMEOUT_MS = 10_000;
/** Timeout for the single retry attempt (`fetchPageWithRetry`) - shorter than the first attempt so a page that's genuinely unreachable fails fast on the second try rather than doubling the worst-case wait. */
const CONTENT_RETRY_TIMEOUT_MS = 6_000;
/** Brief pause before retrying - long enough to ride out a transient blip, short enough not to meaningfully slow a pipeline run that's already bounded to a handful of these per article. */
const RETRY_DELAY_MS = 600;

/** Article bodies live further into the page than the `<head>` meta tags `fetchOgImage` scans for, so this cap is larger than that one's 200KB - still well short of downloading a multi-MB page in full. */
const MAX_HTML_SCAN_BYTES = 500_000;

/** Below this, extracted text isn't meaningfully better than the RSS blurb it would replace - treated as "extraction failed" so the caller falls through to its own next fallback rather than persisting a marginal improvement. */
export const MIN_ACCEPTABLE_CONTENT_LENGTH = 400;

/** Caps how much of the article is kept - generous enough (roughly 1800-2200 words) to capture the real body of almost any news article, while still bounding pathologically long pages. */
const MAX_EXTRACTED_PARAGRAPHS = 60;
const MAX_EXTRACTED_CHARACTERS = 12_000;

/** Same capped-read approach `og-image.ts`'s `readCappedText` uses, duplicated here (not shared) so this module has no dependency on that one - each is a small, self-contained ~15 lines and the two are conceptually independent enrichment stages. */
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

/**
 * Fetches `pageUrl` with one retry (5th pass reliability upgrade -
 * "scraping'i daha güvenilir hale getir"). A 4xx status (paywall gate,
 * 404, robots block) is never retried - that won't change on a second
 * attempt. A network error, timeout, or 5xx/429 (genuinely transient
 * conditions) gets exactly one retry after `RETRY_DELAY_MS`, using a
 * shorter timeout so the worst case stays bounded. Returns `undefined`
 * - never throws - matching every other enrichment function's contract.
 */
async function fetchPageWithRetry(pageUrl: string): Promise<Response | undefined> {
  const attempts: { timeoutMs: number }[] = [{ timeoutMs: CONTENT_FETCH_TIMEOUT_MS }, { timeoutMs: CONTENT_RETRY_TIMEOUT_MS }];

  for (let i = 0; i < attempts.length; i++) {
    try {
      const response = await fetchWithTimeout(
        pageUrl,
        { headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; VirexaBot/1.0; +https://virexa.app)" } },
        attempts[i].timeoutMs
      );
      if (response.ok) return response;
      if (response.status < 500 && response.status !== 429) return undefined;
      // else: transient (5xx/429) - fall through to retry.
    } catch {
      // network/timeout - fall through to retry.
    }

    if (i < attempts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  return undefined;
}

function stripBoilerplateBlocks(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<form[\s\S]*?<\/form>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

/** Handles the small set of HTML entities that actually show up in real article prose - not a full entity table, but enough that extracted text doesn't show raw `&rsquo;`/`&amp;` to readers. */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rdquo;/g, "”")
    .replace(/&ldquo;/g, "“")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCharCode(Number(code)));
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Real prose reads as full sentences; boilerplate (nav links, bylines, "Share on Twitter") tends to be short fragments - a length floor is a cheap, effective filter without needing to understand the page's specific markup. */
const MIN_PARAGRAPH_LENGTH = 40;

/** Above this fraction, a paragraph is mostly hyperlink text - the shape of a "related articles" list item or an inline nav block, not real prose, even when it's long enough to otherwise pass `MIN_PARAGRAPH_LENGTH` (5th pass reliability upgrade). */
const MAX_LINK_TEXT_RATIO = 0.7;

/** Whether a raw (pre-strip) `<p>...</p>` block is mostly `<a>` anchor text - see `MAX_LINK_TEXT_RATIO`. */
function isMostlyLinkText(rawParagraphHtml: string): boolean {
  const anchorMatches = rawParagraphHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/gi) ?? [];
  const anchorTextLength = anchorMatches.reduce((sum, match) => sum + stripTags(match).length, 0);
  const totalTextLength = stripTags(rawParagraphHtml).length;
  if (totalTextLength === 0) return true;
  return anchorTextLength / totalTextLength > MAX_LINK_TEXT_RATIO;
}

/** Extracts every `<p>` block from an (already boilerplate-block-stripped) HTML fragment, keeping only ones that read like real prose. Shared by both the `<article>`-scoped and whole-document extraction strategies. */
function extractParagraphsFrom(htmlFragment: string): string[] {
  const blocks = htmlFragment.match(/<p[^>]*>[\s\S]*?<\/p>/gi) ?? [];
  return blocks
    .filter((block) => !isMostlyLinkText(block))
    .map(stripTags)
    .filter((text) => text.length >= MIN_PARAGRAPH_LENGTH);
}

/**
 * Strategy 2: scopes the paragraph search to the first `<article>...
 * </article>` element, when present - most CMS templates wrap the real
 * body in this semantic tag, which sidesteps sidebar/related-content
 * `<p>` tags that a whole-document scan would otherwise pick up. A
 * simple first-open-to-first-close match (not a real nested-tag
 * balancer) - `<article>` elements are essentially never nested inside
 * each other in real-world markup, so this is a safe simplification
 * consistent with this file's existing "pragmatic heuristic, not a
 * parser" approach.
 */
function extractFromArticleTag(html: string): string[] {
  const match = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (!match) return [];
  return extractParagraphsFrom(stripBoilerplateBlocks(match[1]));
}

/**
 * Strategy 1 (tried first - see module doc comment): pulls `articleBody`
 * out of any `application/ld+json` block on the page. Handles both a
 * single JSON-LD object and an array of them, plus schema.org's
 * `@graph` wrapper (used by Yoast SEO and several other popular
 * WordPress plugins). Deliberately permissive about `@type` - some
 * sites omit it or use a non-standard value - `articleBody` being a
 * non-trivial string is itself a strong enough signal. Malformed JSON
 * (common in hand-rolled JSON-LD) is skipped rather than thrown on.
 */
function extractJsonLdArticleBody(html: string): string | undefined {
  const scriptBlocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];

  let best: string | undefined;

  for (const block of scriptBlocks) {
    const inner = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>[\s\S]*$/i, "");
    let parsed: unknown;
    try {
      parsed = JSON.parse(inner);
    } catch {
      continue;
    }

    const candidates: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== "object") continue;
      const graph = (candidate as { "@graph"?: unknown })["@graph"];
      const nodes = Array.isArray(graph) ? graph : [candidate];

      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const articleBody = (node as { articleBody?: unknown }).articleBody;
        if (typeof articleBody === "string" && articleBody.trim().length > (best?.length ?? 0)) {
          best = articleBody.trim();
        }
      }
    }
  }

  return best;
}

/**
 * Fetches `pageUrl` and extracts a substantial portion of its real
 * article text, trying the three strategies described in this module's
 * doc comment in order and returning the first one that clears
 * `MIN_ACCEPTABLE_CONTENT_LENGTH`. Returns `undefined` - never throws -
 * for any failure (both fetch attempts failing, no usable content found
 * by any strategy, or every strategy's result still being too short).
 * Callers fall through to their own next fallback in that case.
 */
export async function fetchArticleContent(pageUrl: string): Promise<string | undefined> {
  try {
    const response = await fetchPageWithRetry(pageUrl);
    if (!response) return undefined;

    const html = await readCappedText(response, MAX_HTML_SCAN_BYTES);

    const jsonLdBody = extractJsonLdArticleBody(html);
    if (jsonLdBody && jsonLdBody.length >= MIN_ACCEPTABLE_CONTENT_LENGTH) {
      // schema.org `articleBody` is just "a string" - many CMSs embed
      // the whole article with no blank-line paragraph separators at
      // all. Re-flowed through `splitIntoParagraphs` (real breaks if
      // present, otherwise sentence-grouped) and rejoined with `\n\n` so
      // what gets stored already has real paragraph structure, rather
      // than persisting one giant unbroken string that every downstream
      // reader (`buildContentBlocks`, CSV export, etc.) would need to
      // re-normalize itself.
      const normalized = splitIntoParagraphs(jsonLdBody).join("\n\n");
      return normalized.length > MAX_EXTRACTED_CHARACTERS ? normalized.slice(0, MAX_EXTRACTED_CHARACTERS).trim() : normalized;
    }

    const cleanedHtml = stripBoilerplateBlocks(html);
    const articleParagraphs = extractFromArticleTag(html);
    const paragraphs = (articleParagraphs.length > 0 ? articleParagraphs : extractParagraphsFrom(cleanedHtml)).slice(
      0,
      MAX_EXTRACTED_PARAGRAPHS
    );
    if (paragraphs.length === 0) return undefined;

    let content = paragraphs.join("\n\n");
    if (content.length > MAX_EXTRACTED_CHARACTERS) {
      content = content.slice(0, MAX_EXTRACTED_CHARACTERS).trim();
    }

    return content.length >= MIN_ACCEPTABLE_CONTENT_LENGTH ? content : undefined;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[article-content] Failed to extract content from ${pageUrl}: ${reason}`);
    return undefined;
  }
}
