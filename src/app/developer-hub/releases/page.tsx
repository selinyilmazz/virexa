import { ReleaseLibraryView } from "@/components/releases/ReleaseLibraryView";
import { getReleaseLibrary } from "@/services/developer-hub/release-detail-service";

export const metadata = {
  title: "Releases | Developer Hub | VIREXA",
  description: "Real, current releases for the frameworks, runtimes and tools developers track most.",
};

/**
 * The Release Library - the one canonical Releases destination in the
 * app. Every "Releases" entry point (the homepage "Developer Releases"
 * widget's "View All", the Developer Hub top nav, the header dropdown,
 * the legacy `/developer-releases` redirect) points at this same route,
 * and every card here links to the same `/developer-hub/releases/[slug]`
 * detail page the homepage widget's individual rows already link to.
 *
 * Previously this route rendered the unified News Explorer filtered to
 * release-tagged articles (`defaultContentType: "release"`) - real
 * article data, but a different concept from a release overview
 * (documentation about a version, not a news story about one). That
 * created two separate "release" experiences sharing one URL prefix:
 * clicking an individual release worked, but "View All" and Developer
 * Hub → Releases landed on a news list instead of a library of the same
 * technologies. See `release-detail-service.ts`'s `getReleaseLibrary` doc
 * comment for the merge logic (curated static data overlaid with the
 * admin-managed `developer_releases` table).
 */
export default async function DeveloperHubReleasesPage() {
  const releases = await getReleaseLibrary();
  return <ReleaseLibraryView releases={releases} />;
}
