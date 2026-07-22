import { DeveloperPulse } from "@/components/explorer/DeveloperPulse";
import type { PulseTopicKey } from "@/lib/explorer/developer-pulse-data";

type ExplorerSidebarProps = {
  /** Which mock topic set/discussion `DeveloperPulse` shows - see `ExplorerView`'s `pulseTopic` prop doc comment for how each route maps to a key. */
  pulseTopic: PulseTopicKey;
};

/**
 * The Explorer template's right-hand sidebar (Developer Pulse redesign
 * pass). Used to hold three separate widgets - `TrendingTopics`,
 * `MostRead`, `TopSources` - reused as-is from the homepage/category
 * sidebar. Per explicit user feedback ("not providing enough value...
 * Do NOT create multiple widgets"), all three were removed entirely and
 * replaced with one single, higher-value panel: `DeveloperPulse`, which
 * surfaces what developers are discussing right now, scoped to whatever
 * page you're on.
 */
export function ExplorerSidebar({ pulseTopic }: ExplorerSidebarProps) {
  return <DeveloperPulse topic={pulseTopic} />;
}
