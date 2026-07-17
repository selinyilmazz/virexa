import type { Source } from "@/types/news";

/**
 * Generic badge shown when a source has no dedicated logo asset yet.
 * Keeps every `NewsArticle.source.logo` resolvable to *something*
 * renderable, per "Logo bulunamazsa default logo göster".
 */
export const DEFAULT_SOURCE_LOGO = "/logos/default-source.svg";

/**
 * Resolves the logo to render for a source, falling back to
 * `DEFAULT_SOURCE_LOGO` when the source registry doesn't have one set
 * (see `SOURCES` in `sources.ts`).
 */
export function getSourceLogo(source: Pick<Source, "logo">): string {
  return source.logo ?? DEFAULT_SOURCE_LOGO;
}
