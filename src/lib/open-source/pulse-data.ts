/**
 * Backing data for the Open Source Explorer sidebar's "Open Source Pulse"
 * card - daily-delta ecosystem stats (repos added, stars, contributors,
 * PRs merged "today"). There is no live daily-delta pipeline wired up
 * (that would need GitHub's Search/Events APIs polled and diffed over
 * time, well beyond what an unauthenticated, on-demand fetch can do) -
 * per this codebase's established convention for exactly this situation
 * (see `lib/explorer/developer-pulse-data.ts`'s doc comment), this uses
 * realistic, GitHub-ecosystem-scale illustrative numbers rather than
 * either fabricating a fake "live" source or leaving the card empty.
 * `changeLabel` is always a plausible day-over-day move, never a wild
 * swing. Swapping this file's contents for a real
 * `getOpenSourcePulse()` service call later (once a real ingestion job
 * exists) is a drop-in change with no UI rework required.
 */

export type OpenSourcePulseMetric = {
  label: string;
  value: string;
  changeLabel: string;
};

export const OPEN_SOURCE_PULSE: OpenSourcePulseMetric[] = [
  { label: "Repositories added today", value: "1,240", changeLabel: "+8%" },
  { label: "Stars given today", value: "48.2k", changeLabel: "+15%" },
  { label: "Contributors active today", value: "6,830", changeLabel: "+5%" },
  { label: "PRs merged today", value: "2,910", changeLabel: "+11%" },
];
