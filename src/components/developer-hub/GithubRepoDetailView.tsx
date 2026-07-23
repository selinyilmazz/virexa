import Link from "next/link";
import { LANGUAGE_DOT_COLORS, formatStat } from "@/components/developer-hub/CatalogCard";
import { GithubDetailSidebar } from "@/components/developer-hub/GithubDetailSidebar";
import { GithubLibraryCard } from "@/components/developer-hub/GithubLibraryCard";
import { RepoBookmarkButton } from "@/components/developer-hub/RepoBookmarkButton";
import { RepoShareButton } from "@/components/developer-hub/RepoShareButton";
import type { GithubRelease } from "@/lib/developer-hub/github";
import { REPOSITORY_CATEGORY_LABELS, REPOSITORY_DIFFICULTY_LABELS, type RepositoryCategorySlug, type RepositoryDifficultySlug } from "@/lib/developer-hub/shared";
import type { GithubRepoCardData, GithubSidebarWidgets } from "@/services/developer-hub/github-explorer-service";
import type { CollectionRow } from "@/types/database";

function StarIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.1 6.6-5.8-3.1-5.8 3.1 1.1-6.6-4.8-4.6 6.6-.9Z" />
    </svg>
  );
}

function ForkIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="5" r="2" />
      <circle cx="17" cy="5" r="2" />
      <circle cx="12" cy="19" r="2" />
      <path d="M7 7v2a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V7M12 12v5" />
    </svg>
  );
}

function EyeIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function healthColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-red-500";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

type GithubRepoDetailViewProps = {
  repo: GithubRepoCardData;
  readmeExcerpt: string | null;
  releases: GithubRelease[];
  related: GithubRepoCardData[];
  alternatives: GithubRepoCardData[];
  collections: CollectionRow[];
  sidebarWidgets: GithubSidebarWidgets;
  youMayAlsoLike: GithubRepoCardData[];
};

/**
 * Repository Detail page (`/developer-hub/github/[slug]`) - the spec's
 * full section list: Hero, repo info, README summary, Installation, "Why
 * Recommended", Use Cases, Alternatives, Related Repositories, GitHub
 * Stats, Recent Releases, Editor Notes, "You May Also Like", plus the
 * 4-widget sidebar. Every section is conditionally rendered - a repo
 * with no README/releases/editor notes simply omits that section rather
 * than showing a fabricated placeholder (same "never invent data"
 * constraint as the rest of this redesign).
 */
export function GithubRepoDetailView({
  repo,
  readmeExcerpt,
  releases,
  related,
  alternatives,
  collections,
  sidebarWidgets,
  youMayAlsoLike,
}: GithubRepoDetailViewProps) {
  const category = repo.category ? REPOSITORY_CATEGORY_LABELS[repo.category as RepositoryCategorySlug] : null;
  const canonicalUrl = `/developer-hub/github/${repo.slug}`;
  const useCaseTags = [...repo.tags, ...repo.topics.slice(0, 6)];

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="transition-colors duration-200 hover:text-slate-700">
          Home
        </Link>
        <span aria-hidden="true">›</span>
        <Link href="/developer-hub/github" className="transition-colors duration-200 hover:text-slate-700">
          GitHub Explorer
        </Link>
        <span aria-hidden="true">›</span>
        <span className="font-medium text-slate-950">{repo.repoName}</span>
      </nav>

      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#0b1220] via-[#111c33] to-[#0b1220] p-6 text-white shadow-sm sm:p-10">
        <div className="flex flex-wrap items-start gap-5">
          <img src={repo.avatarUrl} alt="" aria-hidden="true" className="size-16 shrink-0 rounded-2xl border border-white/10 bg-white/10 object-cover sm:size-20" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="text-slate-400">{repo.owner}/</span>
                {repo.repoName}
              </h1>
              {repo.verified && <span className="rounded-full bg-blue-400/15 px-2.5 py-1 text-xs font-semibold text-blue-300">Verified</span>}
              {repo.editorPick && <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-300">Editor&apos;s Pick</span>}
              {repo.hiddenGem && <span className="rounded-full bg-violet-400/15 px-2.5 py-1 text-xs font-semibold text-violet-300">Hidden Gem</span>}
            </div>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-300">{repo.description}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
              {repo.language && (
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: LANGUAGE_DOT_COLORS[repo.language] ?? "#9CA3AF" }} />
                  {repo.language}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <StarIcon />
                {formatStat(repo.stars)} stars
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ForkIcon />
                {formatStat(repo.forks)} forks
              </span>
              <span className="inline-flex items-center gap-1.5">
                <EyeIcon />
                {formatStat(repo.watchers)} watchers
              </span>
              {repo.license && <span>{repo.license} License</span>}
              <span>Updated {repo.updatedRelative}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <RepoShareButton title={`${repo.owner}/${repo.repoName}`} url={canonicalUrl} />
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
            <a
              href={repo.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5"
            >
              Visit GitHub
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          {/* Why We Recommend */}
          {repo.editorNotes && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950">
                <span aria-hidden="true">✨</span>
                Why We Recommend This
              </h2>
              <p className="mt-3 text-base leading-relaxed text-slate-700">{repo.editorNotes}</p>
            </section>
          )}

          {/* Use Cases */}
          {useCaseTags.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold tracking-tight text-slate-950">Use Cases</h2>
              <p className="mt-2 text-sm text-slate-500">Where {repo.repoName} fits, based on its real tags and topics.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {Array.from(new Set(useCaseTags)).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Installation */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold tracking-tight text-slate-950">Installation</h2>
            <div className="mt-3 rounded-2xl bg-slate-950 px-4 py-3.5">
              <code className="block overflow-x-auto whitespace-pre text-sm text-slate-100">git clone {repo.githubUrl}.git</code>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              See the{" "}
              <a href={`${repo.githubUrl}#readme`} target="_blank" rel="noopener noreferrer" className="font-medium text-[#2f67e8] hover:underline">
                repository&apos;s README
              </a>{" "}
              for language-specific setup steps.
            </p>
          </section>

          {/* README Summary */}
          {readmeExcerpt && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold tracking-tight text-slate-950">README Summary</h2>
              <div className="mt-3 space-y-3 text-base leading-relaxed text-slate-600">
                {readmeExcerpt.split("\n\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {/* GitHub Stats */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold tracking-tight text-slate-950">GitHub Stats</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Stars", value: formatStat(repo.stars) },
                { label: "Forks", value: formatStat(repo.forks) },
                { label: "Watchers", value: formatStat(repo.watchers) },
                { label: "Open Topics", value: String(repo.topics.length) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xl font-bold text-slate-950">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">Health Score</span>
              <span className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
                <span className={`block h-full rounded-full ${healthColor(repo.healthScore)}`} style={{ width: `${repo.healthScore}%` }} />
              </span>
              <span className="text-sm font-bold text-slate-700">{repo.healthScore}/100</span>
            </div>
            {category && (
              <p className="mt-3 text-sm text-slate-500">
                Category: <span className="font-medium text-slate-700">{category.emoji} {category.label}</span>
              </p>
            )}
            {repo.difficulty && (
              <p className="mt-1 text-sm text-slate-500">
                Difficulty: <span className="font-medium text-slate-700">{REPOSITORY_DIFFICULTY_LABELS[repo.difficulty as RepositoryDifficultySlug]}</span>
              </p>
            )}
            {collections.length > 0 && (
              <p className="mt-1 text-sm text-slate-500">
                Part of:{" "}
                {collections.map((c, i) => (
                  <span key={c.id}>
                    <Link href={`/developer-hub/github?collection=${c.slug}`} className="font-medium text-[#2f67e8] hover:underline">
                      {c.name}
                    </Link>
                    {i < collections.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
          </section>

          {/* Recent Releases */}
          {releases.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold tracking-tight text-slate-950">Recent Releases</h2>
              <ul className="mt-4 space-y-3">
                {releases.map((release) => (
                  <li key={release.tag} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-slate-900">{release.tag}</span>
                    <span className="text-xs text-slate-500">{formatDate(release.publishedAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <section>
              <h2 className="text-lg font-bold tracking-tight text-slate-950">Alternatives</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {alternatives.map((alt) => (
                  <GithubLibraryCard key={alt.id} repo={alt} />
                ))}
              </div>
            </section>
          )}

          {/* Related Repositories */}
          {related.length > 0 && (
            <section>
              <h2 className="text-lg font-bold tracking-tight text-slate-950">Related Repositories</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {related.map((rel) => (
                  <GithubLibraryCard key={rel.id} repo={rel} />
                ))}
              </div>
            </section>
          )}

          {/* You May Also Like */}
          {youMayAlsoLike.length > 0 && (
            <section>
              <h2 className="text-lg font-bold tracking-tight text-slate-950">You May Also Like</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {youMayAlsoLike.map((item) => (
                  <GithubLibraryCard key={item.id} repo={item} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-28 lg:h-fit lg:self-start">
          <GithubDetailSidebar widgets={sidebarWidgets} />
        </aside>
      </div>
    </div>
  );
}
