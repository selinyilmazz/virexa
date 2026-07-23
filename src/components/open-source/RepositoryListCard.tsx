import Link from "next/link";
import { resolveBrandVisual } from "@/components/developer-hub/brand-icons";
import { LANGUAGE_DOT_COLORS } from "@/components/developer-hub/CatalogCard";
import { RepoBookmarkButton } from "@/components/developer-hub/RepoBookmarkButton";
import type { OpenSourceRepoItem } from "@/services/open-source/open-source-service";

function formatStat(value: number): string {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/**
 * Well-known organizations behind the curated `TRACKED_REPOS` pool - an
 * honest proxy for "verified" (every one of these really is the
 * repo-owning organization's real GitHub account) rather than a
 * fabricated GitHub-style checkmark. See `open-source-service.ts`'s doc
 * comment on why the pool has no separate, fetched "verified" signal.
 */
const VERIFIED_OWNERS = new Set([
  "vercel",
  "microsoft",
  "facebook",
  "langchain-ai",
  "sveltejs",
  "nodejs",
  "tailwindlabs",
  "denoland",
  "oven-sh",
  "vuejs",
  "supabase",
]);

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

function VerifiedBadge() {
  return (
    <svg aria-label="Organization repository" className="size-4 shrink-0 text-slate-500" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="m12 2.5 2.1 1.9 2.8-.4 1 2.6 2.6 1-.4 2.8L22 12l-1.9 2.1.4 2.8-2.6 1-1 2.6-2.8-.4L12 21.5l-2.1-1.9-2.8.4-1-2.6-2.6-1 .4-2.8L2 12l1.9-2.1-.4-2.8 2.6-1 1-2.6 2.8.4Z"
      />
      <path d="m8.5 12.2 2.2 2.2 4.3-4.3" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type RepositoryListCardProps = {
  repo: OpenSourceRepoItem;
};

/**
 * Open Source Explorer's repository row - rank, brand mark, `owner/repo`
 * (+ verified badge for well-known orgs), description, language dot +
 * license on the left; stars/forks/last-updated + a Save toggle on the
 * right. Deliberately shows ONLY what the spec asks for (Name,
 * Description, Language, License, Stars, Forks, Updated) - no open
 * issues/contributors/watchers/commits/releases, those "belong on
 * GitHub" per spec. The whole card opens the real repo in a new tab via
 * the stretched-link trick on the title (`after:absolute after:inset-0`
 * on the anchor, same pattern as `NewsExplorerCard`) - the bookmark
 * button sits above it (`z-10`) so it stays independently clickable.
 */
export function RepositoryListCard({ repo }: RepositoryListCardProps) {
  const visual = resolveBrandVisual(repo.brandKey);
  const isVerified = VERIFIED_OWNERS.has(repo.owner.toLowerCase());

  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:cursor-pointer hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-start sm:justify-between sm:p-5">
      <div className="flex min-w-0 flex-1 gap-4">
        <span className="w-6 shrink-0 pt-1 text-center text-sm font-semibold text-slate-400 dark:text-slate-600">{repo.rank}</span>

        <span
          className={`flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 ${visual.bg} ${visual.fg}`}
        >
          {visual.content}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 text-base font-bold leading-snug tracking-tight text-slate-950 dark:text-white">
            <Link
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate after:absolute after:inset-0"
            >
              <span className="text-slate-400 dark:text-slate-500">{repo.owner} / </span>
              {repo.repoName}
            </Link>
            {isVerified && <VerifiedBadge />}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{repo.description}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {repo.language && (
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: LANGUAGE_DOT_COLORS[repo.language] ?? "#9CA3AF" }} />
                {repo.language}
              </span>
            )}
            {repo.license && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {repo.license} License
              </span>
            )}
          </div>
        </div>
      </div>

      {/* `relative` is required, not decorative: the title's stretched-link
          overlay (`after:absolute after:inset-0` above) paints above any
          non-positioned sibling regardless of `z-index` (z-index only
          applies to positioned elements) - without it this whole column,
          including the bookmark button, would be visually present but
          unclickable, silently swallowed by the invisible overlay. */}
      <div className="relative z-10 flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
        <RepoBookmarkButton
          repo={{
            id: repo.id,
            owner: repo.owner,
            repoName: repo.repoName,
            description: repo.description,
            stars: repo.stars,
            language: repo.language,
            license: repo.license,
            url: repo.url,
            brandKey: repo.brandKey,
          }}
        />
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <StarIcon />
            {formatStat(repo.stars)}
          </span>
          <span className="inline-flex items-center gap-1">
            <ForkIcon />
            {formatStat(repo.forks)}
          </span>
        </div>
        <span className="whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">Updated {repo.updatedRelative}</span>
      </div>
    </article>
  );
}
