import { ExplorerView } from "@/components/explorer/ExplorerView";
import type { ExplorerSearchParams } from "@/lib/news-explorer/shared";

export const metadata = {
  title: "Developer Releases | VIREXA",
  description: "Real, database-backed release and version-update articles.",
};

type PageProps = { searchParams: Promise<ExplorerSearchParams> };

/**
 * Standalone top-level `/developer-releases` route (Navigation/Profile/
 * Settings UX update) - the user dropdown now links here instead of
 * `/profile`-adjacent deep links. Identical content to
 * `/developer-hub/releases` (same `ExplorerView` call, same
 * `defaultContentType: "release"` lock) - a real, dedicated route rather
 * than a client-side redirect, but without duplicating the underlying
 * release-fetching logic. `/developer-hub/releases` is left in place
 * unchanged (still linked from `CategoryNav`) since it's the same feature
 * reached from a different, pre-existing entry point.
 */
export default async function DeveloperReleasesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <ExplorerView
      title="Developer Releases"
      subtitle="Real release and version-update articles collected by VIREXA."
      basePath="/developer-releases"
      searchParams={params}
      defaultContentType="release"
    />
  );
}
