import { redirect } from "next/navigation";

/**
 * Legacy standalone route - `/developer-hub/releases` (the Release
 * Library) is the one canonical Releases destination in the app (linked
 * from the homepage `LatestReleases` widget's "View All", the Developer
 * Hub nav, and `HeaderAuthArea`'s dropdown); this route redirects there
 * instead of rendering its own copy, preserving any existing bookmarks/
 * links to `/developer-releases` rather than breaking them outright. No
 * search params to forward - the Release Library is a simple curated
 * grid, not a filterable/sortable explorer.
 */
export default function DeveloperReleasesRedirectPage() {
  redirect("/developer-hub/releases");
}
