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
