import { latestNewsItems } from "@/data/latestNews";
import { categories, type CategoryNewsItem } from "@/data/categories";
import { toCategoryNewsItem } from "@/lib/news";
import { getLiveArticlesSync } from "@/services/news";

function getAllSearchableItems(): CategoryNewsItem[] {
  const items: CategoryNewsItem[] = [];
  const seenSlugs = new Set<string>();

  const pushItem = (item: CategoryNewsItem) => {
    if (seenSlugs.has(item.slug)) return;
    seenSlugs.add(item.slug);
    items.push(item);
  };

  latestNewsItems.forEach((item) => pushItem(item));
  categories.forEach((category) => {
    category.news.forEach((item) => pushItem(item));
  });

  // Live (RSS/API-sourced) articles are automatically searchable the
  // moment they're cached - no extra wiring needed per source. See
  // src/services/news/live-articles.ts: this read is synchronous and
  // safe (returns [] on a cold cache or provider failure), so search
  // silently falls back to mock-only results exactly as before.
  getLiveArticlesSync()
    .map(toCategoryNewsItem)
    .forEach((item) => pushItem(item));

  return items;
}

// Deterministic mock "days ago" derived from the slug, so time filtering has
// stable, repeatable behavior without relying on a real publish timestamp.
function getDaysAgo(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) % 400;
  }
  return hash;
}

const TIME_FILTER_DEFINITIONS: { id: string; label: string; maxDays: number }[] = [
  { id: "today", label: "Today", maxDays: 1 },
  { id: "7d", label: "Last 7 Days", maxDays: 7 },
  { id: "30d", label: "Last 30 Days", maxDays: 30 },
  { id: "3m", label: "Last 3 Months", maxDays: 90 },
  { id: "1y", label: "Last Year", maxDays: 365 },
];

const CATEGORY_FILTER_SLUGS = ["technology", "ai", "games", "business", "world"];

export type SearchFilterState = {
  timeFilter?: string;
  categorySlugs?: string[];
};

export function searchArticles(query: string, filters?: SearchFilterState): CategoryNewsItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  let items = getAllSearchableItems().filter((item) => {
    return (
      item.title.toLowerCase().includes(normalized) ||
      item.description.toLowerCase().includes(normalized) ||
      item.category.toLowerCase().includes(normalized) ||
      item.source.toLowerCase().includes(normalized)
    );
  });

  if (filters?.timeFilter) {
    const definition = TIME_FILTER_DEFINITIONS.find((option) => option.id === filters.timeFilter);
    if (definition) {
      items = items.filter((item) => getDaysAgo(item.slug) <= definition.maxDays);
    }
  }

  if (filters?.categorySlugs && filters.categorySlugs.length > 0) {
    const selectedNames = new Set(
      filters.categorySlugs
        .map((slug) => categories.find((category) => category.slug === slug)?.name.toLowerCase())
        .filter((name): name is string => Boolean(name))
    );
    if (selectedNames.size > 0) {
      items = items.filter((item) => selectedNames.has(item.category.toLowerCase()));
    }
  }

  return items;
}

export type TimeFilterOption = {
  id: string;
  label: string;
  count: string;
};

export function getTimeFilterOptions(): TimeFilterOption[] {
  const items = getAllSearchableItems();
  return TIME_FILTER_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    count: String(items.filter((item) => getDaysAgo(item.slug) <= definition.maxDays).length),
  }));
}

export type CategoryFilterOption = {
  slug: string;
  label: string;
  count: number;
};

export function getCategoryFilterOptions(): CategoryFilterOption[] {
  const items = getAllSearchableItems();
  return CATEGORY_FILTER_SLUGS.map((slug) => {
    const category = categories.find((candidate) => candidate.slug === slug);
    const label = category?.name ?? slug;
    return {
      slug,
      label,
      count: items.filter((item) => item.category.toLowerCase() === label.toLowerCase()).length,
    };
  });
}
