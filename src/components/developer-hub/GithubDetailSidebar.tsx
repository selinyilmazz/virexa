import Link from "next/link";
import { formatStat } from "@/components/developer-hub/CatalogCard";
import type { GithubRepoCardData, GithubSidebarWidgets } from "@/services/developer-hub/github-explorer-service";

function MiniRepoRow({ repo, metric }: { repo: GithubRepoCardData; metric: string }) {
  return (
    <Link
      href={`/developer-hub/github/${repo.slug}`}
      className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-200 hover:bg-slate-50"
    >
      <img src={repo.avatarUrl} alt="" aria-hidden="true" className="size-9 shrink-0 rounded-lg border border-slate-100 object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          <span className="text-slate-400">{repo.owner}/</span>
          {repo.repoName}
        </p>
        <p className="text-xs text-slate-500">{metric}</p>
      </div>
    </Link>
  );
}

function Widget({ icon, title, repos, metricOf }: { icon: string; title: string; repos: GithubRepoCardData[]; metricOf: (repo: GithubRepoCardData) => string }) {
  if (repos.length === 0) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-950">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h3>
      <div className="mt-2 space-y-0.5">
        {repos.map((repo) => (
          <MiniRepoRow key={repo.id} repo={repo} metric={metricOf(repo)} />
        ))}
      </div>
    </div>
  );
}

type GithubDetailSidebarProps = { widgets: GithubSidebarWidgets };

/**
 * Repository Detail page's 4 dynamic sidebar widgets (spec: 🔥 Editor's
 * Picks, 🚀 Recently Added, ⭐ Most Bookmarked, 💎 Hidden Gems) - a
 * dedicated sidebar for this one page rather than reusing
 * `ExplorerSidebar` (that component deliberately renders only a single
 * `DeveloperPulse` widget per an earlier, explicit design decision - see
 * its own doc comment - so a 4-widget sidebar needs its own component).
 * All 4 lists come from one batched `getGithubSidebarWidgets()` call,
 * real curated data throughout.
 */
export function GithubDetailSidebar({ widgets }: GithubDetailSidebarProps) {
  return (
    <div className="space-y-4">
      <Widget icon="🔥" title="Editor's Picks" repos={widgets.editorsPicks} metricOf={(r) => `Score ${r.recommendationScore}/100`} />
      <Widget icon="🚀" title="Recently Added" repos={widgets.recentlyAdded} metricOf={(r) => `Added ${r.updatedRelative}`} />
      <Widget icon="⭐" title="Most Bookmarked" repos={widgets.mostBookmarked} metricOf={(r) => `${formatStat(r.bookmarkCount ?? 0)} saves`} />
      <Widget icon="💎" title="Hidden Gems" repos={widgets.hiddenGems} metricOf={(r) => `${formatStat(r.stars)} stars`} />
    </div>
  );
}
