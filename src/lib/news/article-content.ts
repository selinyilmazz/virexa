import { fetchWithTimeout } from "@/lib/news/fetch-with-timeout";

/**
 * Real full-article-text extraction, run at ingestion time (never per
 * page view) for every article whose provider/RSS-supplied content is
 * too thin to actually read (product polishing phase, 4th pass, item 9:
 * "veritabanında sadece RSS başlığı/açıklaması yeterli değil - her
 * makale için orijinal URL'ye gidilip ana metin çıkarılıp
 * kaydedilmeli"). This extracted text is the grounding material the AI
 * article-rewrite capability (`article-rewrite.prompt.ts`) is built
 * from, so it needs to capture close to the REAL article body, not just
 * a short lead-in - a 700-1500 word rewrite grounded in a 500-word
 * extraction would either run thin or start inventing details that
 * were never in the source.
 *
 * Deliberately dependency-free (no Readability/jsdom - this sandbox has
 * no npm registry access, and those are heavy for what's needed here):
 * a pragmatic heuristic that strips obvious non-article chrome
 * (`<script>`/`<style>`/`<nav>`/`<header>`/`<footer>`/`<aside>`/`<form>`),
 * pulls every `<p>` block, and keeps only paragraphs long enough to be
 * real prose (filters out nav links, bylines, cookie-banner text - the
 * same "quality gate" spirit `isAcceptableImageUrl` already applies to
 * images).
 */

const CONTENT_FETCH_TIMEOUT_MS = 8000;

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

function extractParagraphs(html: string): string[] {
  const cleaned = stripBoilerplateBlocks(html);
  const blocks = cleaned.match(/<p[^>]*>[\s\S]*?<\/p>/gi) ?? [];
  return blocks.map(stripTags).filter((text) => text.length >= MIN_PARAGRAPH_LENGTH);
}

/**
 * Fetches `pageUrl` and extracts a substantial lead portion of its real
 * article text. Returns `undefined` - never throws - for any failure
 * (timeout, non-2xx, no usable `<p>` content found, or the result still
 * being below `MIN_ACCEPTABLE_CONTENT_LENGTH`), matching every other
 * enrichment function in this app's "never breaks the pipeline" contract
 * (`fetchOgImage`, `searchStockImage`). Callers fall through to their
 * own next fallback in that case.
 */
export async function fetchArticleContent(pageUrl: string): Promise<string | undefined> {
  try {
    const response = await fetchWithTimeout(
      pageUrl,
      { headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; VirexaBot/1.0; +https://virexa.app)" } },
      CONTENT_FETCH_TIMEOUT_MS
    );
    if (!response.ok) return undefined;

    const html = await readCappedText(response, MAX_HTML_SCAN_BYTES);
    const paragraphs = extractParagraphs(html).slice(0, MAX_EXTRACTED_PARAGRAPHS);
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
