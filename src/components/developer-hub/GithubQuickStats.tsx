import type { GithubQuickStats as GithubQuickStatsData } from "@/services/developer-hub/github-explorer-service";

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

type GithubQuickStatsProps = { stats: GithubQuickStatsData };

/**
 * "Quick Stats" strip (simplification pass) - trimmed to the two
 * genuinely meaningful, non-duplicative numbers: total curated
 * repositories and hidden gems. "AI Agent Repositories" and "Learning
 * Resources" were dropped - both are already shown, per-category, on the
 * Featured Collections cards directly above this section, so repeating
 * them here was pure duplication rather than new information. Any metric
 * that's genuinely zero (a healthy "not curated yet" state, not an error)
 * is hidden rather than rendered as "0" - a stats strip with a visible
 * zero reads as broken, not honest. Every number is a real, live count
 * computed off the `repositories` table by `getGithubQuickStats()` -
 * never hardcoded.
 */
export function GithubQuickStats({ stats }: GithubQuickStatsProps) {
  const metrics = [
    { icon: "📚", label: "Curated Repositories", value: stats.curatedRepositoriesCount },
    { icon: "💎", label: "Hidden Gems", value: stats.hiddenGemsCount },
  ].filter((metric) => metric.value > 0);

  // Owns its own heading/section wrapper (rather than the parent page
  // rendering one unconditionally) specifically so an all-zero result -
  // a healthy "nothing curated yet" state - omits the whole section,
  // heading included, instead of leaving an empty "Quick Stats" heading
  // with nothing underneath it.
  if (metrics.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight text-slate-950">Quick Stats</h2>
      <div className="mt-4 grid max-w-md grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
              {metric.icon}
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight text-slate-950">{formatCount(metric.value)}</p>
              <p className="truncate text-xs font-medium text-slate-500">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
