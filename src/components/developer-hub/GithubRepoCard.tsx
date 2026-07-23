import { LANGUAGE_DOT_COLORS, formatStat } from "@/components/developer-hub/CatalogCard";
import { resolveBrandVisual } from "@/components/developer-hub/brand-icons";
import { RepoBookmarkButton } from "@/components/developer-hub/RepoBookmarkButton";
import type { CatalogItem } from "@/services/developer-hub/developer-hub-service";

function StarIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.1 6.6-5.8-3.1-5.8 3.1 1.1-6.6-4.8-4.6 6.6-.9Z" />
    </svg>
  );
}

function ForkIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="5" r="2" />
      <circle cx="17" cy="5" r="2" />
      <circle cx="12" cy="19" r="2" />
      <path d="M7 7v2a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V7M12 12v5" />
    </svg>
  );
}

function ExternalLinkIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

type GithubRepoCardProps = { item: CatalogItem };

/**
 * GitHub Explorer's dedicated repo card - a fuller "repository card" than
 * the generic `CatalogCard` gives every other resource type, since a
 * GitHub repo has real facets none of the curated resources have
 * (topics, license, organization). Every field shown here is real, live
 * data from `getTrendingGithubRepos()` (see that module's doc comment) -
 * nothing is invented for the sake of filling out the card.
 */
export function GithubRepoCard({ item }: GithubRepoCardProps) {
  const visual = resolveBrandVisual(item.brandKey);

  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md sm:p-5">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className={`flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 transition-transform duration-200 group-hover:scale-105 sm:size-16 ${visual.bg} ${visual.fg}`}
        >
          {visual.content}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold leading-snug tracking-tight text-slate-950">
            <span className="text-slate-400">{item.owner}/</span>
            {item.repoName}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">{item.description}</p>
        </div>

        <RepoBookmarkButton
          repo={{
            id: item.id,
            owner: item.owner ?? "",
            repoName: item.repoName ?? item.title,
            description: item.description,
            stars: item.stars ?? 0,
            language: item.tag ?? null,
            license: item.license ?? null,
            url: item.url,
            brandKey: item.brandKey,
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
        {item.tag && (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
            <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: LANGUAGE_DOT_COLORS[item.tag] ?? "#9CA3AF" }} />
            {item.tag}
          </span>
        )}
        {item.license && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{item.license} License</span>}
        <span className="inline-flex items-center gap-1">
          <StarIcon />
          {formatStat(item.stars)}
        </span>
        <span className="inline-flex items-center gap-1">
          <ForkIcon />
          {formatStat(item.forks)}
        </span>
        <span>Updated {item.updatedRelative}</span>
      </div>

      {item.topics && item.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.topics.slice(0, 6).map((topic) => (
            <span key={topic} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {topic}
            </span>
          ))}
        </div>
      )}

      <div className="mt-1 flex justify-end">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:border-[#2f67e8] hover:text-[#2f67e8]"
        >
          Open GitHub
          <ExternalLinkIcon className="size-3" />
        </a>
      </div>
    </article>
  );
}
