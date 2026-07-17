import { TimeFilterCard } from "@/components/search/TimeFilterCard";
import { CategoryFilterCard } from "@/components/search/CategoryFilterCard";
import { AdvancedFilterCard } from "@/components/search/AdvancedFilterCard";
import {
  getAvailableSourcesForFilter,
  getCategoryFilterCounts,
  getTimeFilterCounts,
} from "@/services/articles/article-read-service";

const TIME_FILTER_DEFINITIONS: { id: string; label: string; maxDays: number }[] = [
  { id: "today", label: "Today", maxDays: 1 },
  { id: "7d", label: "Last 7 Days", maxDays: 7 },
  { id: "30d", label: "Last 30 Days", maxDays: 30 },
  { id: "3m", label: "Last 3 Months", maxDays: 90 },
  { id: "1y", label: "Last Year", maxDays: 365 },
];

const CATEGORY_FILTER_DEFINITIONS: { slug: string; name: string }[] = [
  { slug: "technology", name: "Technology" },
  { slug: "ai", name: "AI" },
  { slug: "games", name: "Games" },
  { slug: "business", name: "Business" },
  { slug: "world", name: "World" },
];

// Mirrors the language/country codes actually used by the source
// registry (`lib/news/sources.ts`) and stored on `articles.language`/
// `articles.country` - a small, hardcoded option list (matching how
// `CATEGORY_FILTER_DEFINITIONS` above is already hardcoded) rather than
// a DISTINCT query, since the shimmed query builder has no DISTINCT
// support and the real value space here is small and stable.
const LANGUAGE_FILTER_DEFINITIONS: { value: string; label: string }[] = [{ value: "en", label: "English" }];

const COUNTRY_FILTER_DEFINITIONS: { value: string; label: string }[] = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
];

/** Real filter counts from the Article Storage tables, fetched server-side so the client filter cards (`TimeFilterCard`, `CategoryFilterCard`, `AdvancedFilterCard`) only need to render props - no client-side data fetching or mock counts. */
export async function SearchFilters() {
  const [categoryCounts, timeCounts, sources] = await Promise.all([
    getCategoryFilterCounts(CATEGORY_FILTER_DEFINITIONS),
    getTimeFilterCounts(TIME_FILTER_DEFINITIONS),
    getAvailableSourcesForFilter(),
  ]);

  const timeOptions = TIME_FILTER_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    count: timeCounts[definition.id] ?? 0,
  }));

  const categoryOptions = CATEGORY_FILTER_DEFINITIONS.map((definition) => ({
    slug: definition.slug,
    label: definition.name,
    count: categoryCounts[definition.slug] ?? 0,
  }));

  const sourceOptions = sources.map((source) => ({ value: source.id, label: source.name }));

  return (
    <div className="space-y-6 xl:sticky xl:top-28">
      <TimeFilterCard options={timeOptions} />
      <CategoryFilterCard options={categoryOptions} />
      <AdvancedFilterCard
        sourceOptions={sourceOptions}
        languageOptions={LANGUAGE_FILTER_DEFINITIONS}
        countryOptions={COUNTRY_FILTER_DEFINITIONS}
      />
    </div>
  );
}
