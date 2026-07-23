/**
 * Formats an ISO timestamp the same way the rest of Virexa's mock data
 * displays dates (e.g. "May 20, 2024"), so live articles are visually
 * indistinguishable from curated ones in existing UI components.
 * Falls back to the raw string if it isn't a parseable date.
 */
export function formatPublishedDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * Relative day label ("Today", "Yesterday", "3 days ago") for the
 * Profile Overview tab's "Recent Reading Timeline" (redesign). Falls
 * back to `formatPublishedDate` past 6 days so the timeline never shows
 * an absurd "47 days ago" - it reads an exact date instead.
 */
export function formatRelativeDay(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatPublishedDate(isoDate);
}
