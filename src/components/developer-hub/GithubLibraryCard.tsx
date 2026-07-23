import Link from "next/link";
import { LANGUAGE_DOT_COLORS, formatStat } from "@/components/developer-hub/CatalogCard";
import { RepoBookmarkButton } from "@/components/developer-hub/RepoBookmarkButton";
import { RepoShareButton } from "@/components/developer-hub/RepoShareButton";
import { REPOSITORY_CATEGORY_LABELS, type RepositoryCategorySlug } from "@/lib/developer-hub/shared";
import type { GithubRepoCardData } from "@/services/developer-hub/github-explorer-service";

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

function EyeIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function VerifiedIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2 14.5 4h3.5v3.5L21 10l-3 2.5V16h-3.5L12 18.5 9.5 16H6v-3.5L3 10l3-2.5V4h3.5L12 2Z" />
      <path d="m9 12 2 2 4-4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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

function healthColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-red-500";
}

type GithubLibraryCardProps = { repo: GithubRepoCardData };

/**
 * The redesigned "Developer Knowledge Library" repository card - the
 * spec's exact field list (avatar, owner/name, verified badge,
 * description, stars/forks/watchers, language, license, updated, health
 * score, category, topics, Visit GitHub/Bookmark/Share). Replaces the
 * old `GithubRepoCard` (built for the `CatalogItem`/live-GitHub-pool
 * shape) - this one reads the new `GithubRepoCardData` shape from
 * `github-explorer-service.ts`, the real `repositories` table data.
 */
export function GithubLibraryCard({ repo }: GithubLibraryCardProps) {
  const category = repo.category ? REPOSITORY_CATEGORY_LABELS[repo.category as RepositoryCategorySlug] : null;
  const detailUrl = `/developer-hub/github/${repo.slug}`;

  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md sm:p-5">
      <div className="flex items-start gap-4">
        <Link href={detailUrl} className="shrink-0">
          <img
            src={repo.avatarUrl}
            alt=""
            aria-hidden="true"
            className="size-14 rounded-xl border border-slate-100 object-cover transition-transform duration-200 group-hover:scale-105 sm:size-16"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={detailUrl} className="truncate text-lg font-bold leading-snug tracking-tight text-slate-950 hover:text-[#2f67e8]">
              <span className="text-slate-400">{repo.owner}/</span>
              {repo.repoName}
            </Link>
            {repo.verified && (
              <span title="Verified" className="text-[#2f67e8]">
                <VerifiedIcon />
              </span>
            )}
            {repo.editorPick && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Editor&apos;s Pick</span>
            )}
            {repo.hiddenGem && (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Hidden Gem</span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">{repo.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <RepoShareButton title={`${repo.owner}/${repo.repoName}`} url={detailUrl} iconOnly />
          <RepoBookmarkButton
            repo={{
              id: repo.id,
              owner: repo.owner,
              repoName: repo.repoName,
              description: repo.description,
              stars: repo.stars,
              language: repo.language,
              license: repo.license,
              url: repo.githubUrl,
              brandKey: repo.fullName,
            }}
          />
        </div>
      </div>

      {repo.editorNotes && (
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs italic leading-relaxed text-slate-600">&ldquo;{repo.editorNotes}&rdquo;</p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
        {repo.language && (
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
            <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: LANGUAGE_DOT_COLORS[repo.language] ?? "#9CA3AF" }} />
            {repo.language}
          </span>
        )}
        {repo.license && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{repo.license}</span>}
        <span className="inline-flex items-center gap-1">
          <StarIcon />
          {formatStat(repo.stars)}
        </span>
        <span className="inline-flex items-center gap-1">
          <ForkIcon />
          {formatStat(repo.forks)}
        </span>
        <span className="inline-flex items-center gap-1">
          <EyeIcon />
          {formatStat(repo.watchers)}
        </span>
        <span>Updated {repo.updatedRelative}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-500">Health</span>
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
            <span className={`block h-full rounded-full ${healthColor(repo.healthScore)}`} style={{ width: `${repo.healthScore}%` }} />
          </span>
          <span className="text-[11px] font-semibold text-slate-600">{repo.healthScore}</span>
        </div>
        {category && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {category.emoji} {category.label}
          </span>
        )}
        {typeof repo.bookmarkCount === "number" && repo.bookmarkCount > 0 && (
          <span className="text-[11px] font-medium text-slate-400">{formatStat(repo.bookmarkCount)} saved</span>
        )}
      </div>

      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repo.topics.slice(0, 6).map((topic) => (
            <span key={topic} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {topic}
            </span>
          ))}
        </div>
      )}

      <div className="mt-1 flex justify-end">
        <a
          href={repo.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:border-[#2f67e8] hover:text-[#2f67e8]"
        >
          Visit GitHub
          <ExternalLinkIcon className="size-3" />
        </a>
      </div>
    </article>
  );
}
