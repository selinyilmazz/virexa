import type { CategoryNewsItem } from "@/data/categories";
import type { TechnologyRelease } from "@/data/releases";
import { ReleaseHero } from "@/components/releases/ReleaseHero";
import { ReleaseQuickLinks } from "@/components/releases/ReleaseQuickLinks";
import { ReleaseInstallTabs } from "@/components/releases/ReleaseInstallTabs";
import { ReleaseWhatsNew } from "@/components/releases/ReleaseWhatsNew";
import { ReleaseBreakingChanges } from "@/components/releases/ReleaseBreakingChanges";
import { ReleaseTabs } from "@/components/releases/ReleaseTabs";
import { ReleaseSidebar } from "@/components/releases/ReleaseSidebar";

type ReleaseDetailViewProps = {
  release: TechnologyRelease;
  relatedNews: CategoryNewsItem[];
};

/**
 * The single, reusable Developer Release Detail template - every
 * technology (`src/data/releases.ts`) renders through this exact same
 * component tree, driven entirely by its own `TechnologyRelease` data.
 * Nothing here is React-specific or hardcoded to any one technology.
 * Section order follows the requested page structure exactly: Hero ->
 * Quick Links -> Installation -> What's New -> Breaking Changes (hidden
 * when absent) -> Tab Navigation -> [main column ends] with the Release
 * Info / Related Releases / Related News sidebar alongside.
 */
export function ReleaseDetailView({ release, relatedNews }: ReleaseDetailViewProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.34fr)]">
      <div className="min-w-0 space-y-6">
        <ReleaseHero release={release} />
        <ReleaseQuickLinks release={release} />
        <ReleaseInstallTabs commands={release.install} />
        <ReleaseWhatsNew release={release} />
        <ReleaseBreakingChanges release={release} />
        <ReleaseTabs release={release} />
      </div>

      <aside className="min-w-0">
        <ReleaseSidebar release={release} relatedNews={relatedNews} />
      </aside>
    </div>
  );
}
