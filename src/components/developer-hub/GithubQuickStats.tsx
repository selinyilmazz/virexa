import type { GithubQuickStats as GithubQuickStatsData } from "@/services/developer-hub/github-explorer-service";

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

type GithubQuickStatsProps = { stats: GithubQuickStatsData };

/**
 * "Quick Stats" strip - every number here is a real, live count computed
 * off the `repositories` table by `getGithubQuickStats()` (curated total,
 * hidden gems, AI agent repos, learning resources) - never hardcoded, so
 * the numbers grow honestly as the library grows instead of needing a
 * manual update.
 */
export function GithubQuickStats({ stats }: GithubQuickStatsProps) {
  const metrics = [
    { icon: "📚", label: "Curated Repositories", value: formatCount(stats.curatedRepositoriesCount) },
    { icon: "💎", label: "Hidden Gems", value: formatCount(stats.hiddenGemsCount) },
    { icon: "🤖", label: "AI Agent Repositories", value: formatCount(stats.aiAgentRepositoriesCount) },
    { icon: "🎓", label: "Learning Resources", value: formatCount(stats.learningResourcesCount) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
            {metric.icon}
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight text-slate-950">{metric.value}</p>
            <p className="truncate text-xs font-medium text-slate-500">{metric.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
