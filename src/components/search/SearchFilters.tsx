import { SearchFiltersPanel } from "@/components/search/SearchFiltersPanel";
import { SEARCH_CATEGORY_SLUGS } from "@/lib/news";
import { getCategoryFilterCounts, getTimeFilterCounts } from "@/services/articles/article-read-service";

const TIME_FILTER_DEFINITIONS: { id: string; label: string; maxDays: number }[] = [
  { id: "today", label: "Today", maxDays: 1 },
  { id: "7d", label: "Last 7 Days", maxDays: 7 },
  { id: "30d", label: "Last 30 Days", maxDays: 30 },
  { id: "3m", label: "Last 3 Months", maxDays: 90 },
  { id: "1y", label: "Last Year", maxDays: 365 },
];

type SearchFiltersProps = {
  /** Current `time`/`categories` URL params, passed down by `app/search/page.tsx` - both the source of the staged panel's initial state AND its remount key (see `SearchFiltersPanel`'s doc comment). */
  time?: string;
  categories?: string;
};

/**
 * Simplified search sidebar (product polishing phase, area 1): only
 * Time, Category, and one Apply button - the Source/Language/Country
 * filter (`AdvancedFilterCard`) has been removed entirely, per "Those
 * filters currently provide little value and unnecessarily complicate
 * the interface."
 *
 * Real filter counts from the Article Storage tables, fetched
 * server-side so the client filter cards only need to render props - no
 * client-side data fetching or mock counts.
 */
export async function SearchFilters({ time, categories }: SearchFiltersProps) {
  const [categoryCounts, timeCounts] = await Promise.all([
    getCategoryFilterCounts(SEARCH_CATEGORY_SLUGS),
    getTimeFilterCounts(TIME_FILTER_DEFINITIONS),
  ]);

  const timeOptions = TIME_FILTER_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    count: timeCounts[definition.id] ?? 0,
  }));

  const categoryOptions = SEARCH_CATEGORY_SLUGS.map((definition) => ({
    slug: definition.slug,
    label: definition.name,
    count: categoryCounts[definition.slug] ?? 0,
  }));

  const initialTime = time ?? null;
  const initialCategories = categories ? categories.split(",").filter(Boolean) : [];
  const panelKey = `${initialTime ?? ""}|${initialCategories.join(",")}`;

  return (
    <div className="xl:sticky xl:top-28">
      <SearchFiltersPanel
        key={panelKey}
        timeOptions={timeOptions}
        categoryOptions={categoryOptions}
        initialTime={initialTime}
        initialCategories={initialCategories}
      />
    </div>
  );
}
