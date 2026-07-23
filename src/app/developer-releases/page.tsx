import { redirect } from "next/navigation";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Stabilization pass (item 3: "The View All page becomes the only
 * Releases listing"): this used to duplicate `/developer-hub/releases`
 * verbatim (same `ExplorerView` call, same `defaultContentType: "release"`
 * lock, same underlying data) - two URLs for one feature is exactly the
 * kind of "duplicate navigation" the stabilization pass calls out.
 * `/developer-hub/releases` is now the one canonical Releases listing
 * (linked from the homepage `LatestReleases` widget's "View All" and from
 * `HeaderAuthArea`'s dropdown); this route redirects there instead of
 * rendering its own copy, preserving any existing bookmarks/links to
 * `/developer-releases` (including query params like `q`/`sort`) rather
 * than breaking them outright.
 */
export default async function DeveloperReleasesRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const raw = Array.isArray(value) ? value[0] : value;
    if (raw) query.set(key, raw);
  }
  const queryString = query.toString();
  redirect(queryString ? `/developer-hub/releases?${queryString}` : "/developer-hub/releases");
}
