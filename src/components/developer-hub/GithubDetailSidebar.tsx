import Link from "next/link";
import { formatStat } from "@/components/developer-hub/CatalogCard";
import type { GithubRepoCardData, GithubSidebarWidgets } from "@/services/developer-hub/github-explorer-service";
import { getServerTranslations } from "@/i18n/get-server-translations";

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
export async function GithubDetailSidebar({ widgets }: GithubDetailSidebarProps) {
  const { t } = await getServerTranslations();
  return (
    <div className="space-y-4">
      <Widget
        icon="🔥"
        title={t("developerHub.github.sidebar.editorsPicks")}
        repos={widgets.editorsPicks}
        metricOf={(r) => t("developerHub.github.sidebar.scoreMetric", { score: r.recommendationScore })}
      />
      <Widget
        icon="🚀"
        title={t("developerHub.github.sidebar.recentlyAdded")}
        repos={widgets.recentlyAdded}
        metricOf={(r) => t("developerHub.github.sidebar.addedMetric", { relative: r.updatedRelative })}
      />
      <Widget
        icon="⭐"
        title={t("developerHub.github.sidebar.mostBookmarked")}
        repos={widgets.mostBookmarked}
        metricOf={(r) => t("developerHub.github.sidebar.savesMetric", { count: formatStat(r.bookmarkCount ?? 0) })}
      />
      <Widget
        icon="💎"
        title={t("developerHub.github.explorer.hiddenGems")}
        repos={widgets.hiddenGems}
        metricOf={(r) =>
          r.stars > 0
            ? t("developerHub.github.sidebar.starsMetric", { count: formatStat(r.stars) })
            : t("developerHub.github.sidebar.curatedPick")
        }
      />
    </div>
  );
}
