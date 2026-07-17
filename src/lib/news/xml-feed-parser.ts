/**
 * Minimal, dependency-free RSS 2.0 / Atom feed parser.
 *
 * Virexa has no network access for installing an npm package in this
 * environment, so rather than depend on an unverified library, feed
 * parsing is implemented directly against the small subset of RSS/Atom
 * every mainstream publisher feed actually uses: `<item>`/`<entry>`
 * blocks with title, link, description/summary/content, a publish date,
 * and (optionally) an image via `<enclosure>`, `<media:content>`,
 * `<media:thumbnail>`, or an inline `<img>` in the HTML body.
 *
 * This is intentionally conservative (regex-based, not a full XML DOM)
 * — it's built to tolerate the minor dialect differences between feeds,
 * not to be a general-purpose XML parser.
 */

export type ParsedFeedItem = {
  title: string;
  link: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  /** ISO 8601 timestamp. Falls back to "now" when the feed's date can't be parsed. */
  publishedAt: string;
};

const ITEM_BLOCK_REGEX = /<item[^>]*>([\s\S]*?)<\/item>/gi;
const ENTRY_BLOCK_REGEX = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;

function decodeXmlEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function extractTagText(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return undefined;
  const text = decodeXmlEntities(match[1]);
  return text.length > 0 ? text : undefined;
}

function extractAttribute(tagMatch: string, attribute: string): string | undefined {
  const match = tagMatch.match(new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1];
}

/** RSS `<link>text</link>` vs Atom `<link href="..."/>`. */
function extractLink(block: string): string | undefined {
  const textLink = extractTagText(block, "link");
  if (textLink && textLink.startsWith("http")) return textLink;

  const selfClosing = block.match(/<link\b[^>]*\/?>/i);
  if (selfClosing) {
    const href = extractAttribute(selfClosing[0], "href");
    if (href) return href;
  }

  return textLink;
}

function extractImage(block: string): string | undefined {
  const enclosure = block.match(/<enclosure\b[^>]*\/?>/i);
  if (enclosure) {
    const type = extractAttribute(enclosure[0], "type");
    const url = extractAttribute(enclosure[0], "url");
    if (url && (!type || type.startsWith("image/"))) return url;
  }

  const mediaContent = block.match(/<media:content\b[^>]*\/?>/i) ?? block.match(/<media:thumbnail\b[^>]*\/?>/i);
  if (mediaContent) {
    const url = extractAttribute(mediaContent[0], "url");
    if (url) return url;
  }

  const html = extractTagText(block, "content:encoded") ?? extractTagText(block, "description") ?? "";
  const imgMatch = html.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
  return imgMatch?.[1];
}

function parseDate(raw: string | undefined): string {
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return new Date().toISOString();
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBlock(block: string): ParsedFeedItem | undefined {
  const title = extractTagText(block, "title");
  const link = extractLink(block);
  if (!title || !link) {
    return undefined;
  }

  const rawDescription = extractTagText(block, "description") ?? extractTagText(block, "summary");
  const rawContent = extractTagText(block, "content:encoded") ?? extractTagText(block, "content");
  const publishedAtRaw =
    extractTagText(block, "pubDate") ??
    extractTagText(block, "published") ??
    extractTagText(block, "updated") ??
    extractTagText(block, "dc:date");

  return {
    title: stripHtml(title),
    link,
    description: rawDescription ? stripHtml(rawDescription) : undefined,
    content: rawContent ? stripHtml(rawContent) : undefined,
    imageUrl: extractImage(block),
    publishedAt: parseDate(publishedAtRaw),
  };
}

/** Parses raw RSS 2.0 or Atom XML into a flat list of feed items. */
export function parseFeed(xml: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];

  for (const match of xml.matchAll(ITEM_BLOCK_REGEX)) {
    const item = parseBlock(match[1]);
    if (item) items.push(item);
  }

  if (items.length === 0) {
    for (const match of xml.matchAll(ENTRY_BLOCK_REGEX)) {
      const item = parseBlock(match[1]);
      if (item) items.push(item);
    }
  }

  return items;
}
