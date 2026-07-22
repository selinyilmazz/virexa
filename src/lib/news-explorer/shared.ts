import type { ContentTypeFilter, NewsExplorerSort } from "@/services/articles/article-read-service";

/**
 * Shared, page-agnostic helpers for every unified Explorer route
 * (`/news`, `/search`, `/category/ai`, `/category/programming`,
 * `/category/security`, `/cloud`, `/open-source`, `/resources`) -
 * extracted so `ExplorerView` and the thin per-route `page.tsx` files
 * that wrap it never duplicate this parsing logic. "The layout never
 * changes" applies to the query-parsing logic just as much as the
 * markup.
 */

export const EXPLORER_PAGE_SIZE = 12;

// Mirrors the Filters sidebar's Time option ids - kept in sync manually,
// same convention this file inherited from the original `/search` page.
export const TIME_FILTER_MAX_DAYS: Record<string, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "1y": 365,
};

export function resolveDateFrom(timeFilterId: string | undefined): string | undefined {
  const maxDays = timeFilterId ? TIME_FILTER_MAX_DAYS[timeFilterId] : undefined;
  if (!maxDays) return undefined;
  return new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000).toISOString();
}

export function resolveExplorerSort(raw: string | undefined): NewsExplorerSort {
  if (raw === "oldest" || raw === "trending" || raw === "most-read") return raw;
  return "newest";
}

export const VALID_CONTENT_TYPES: ContentTypeFilter[] = [
  "news",
  "release",
  "tutorial",
  "research",
  "security-advisory",
  "certification",
  "open-source",
];

export type ExplorerSearchParams = {
  q?: string;
  time?: string;
  categories?: string;
  sources?: string;
  type?: string;
  sort?: string;
  page?: string;
};
