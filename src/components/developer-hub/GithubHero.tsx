"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LANGUAGE_DOT_COLORS, formatStat } from "@/components/developer-hub/CatalogCard";
import { REPOSITORY_CATEGORY_LABELS, type RepositoryCategorySlug } from "@/lib/developer-hub/shared";
import type { GithubRepoCardData } from "@/services/developer-hub/github-explorer-service";

type GithubHeroProps = {
  repos: GithubRepoCardData[];
  totalCurated: number;
};

const AUTO_SLIDE_MS = 5000;

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

function ArrowIcon({ direction, className = "size-5" }: { direction: "left" | "right"; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {direction === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  );
}

/**
 * GitHub Explorer's Hero - two-column layout (headline + CTA on the left,
 * an auto-sliding showcase of real editor-curated repos on the right).
 * The whole point of this redesign is "a curated library, not a copy of
 * GitHub Trending" - so the carousel pool (`repos`, from
 * `getHeroCarouselRepos`) is real `repositories` table data ordered by
 * editor pick + recommendation score, never a fixed hardcoded list.
 *
 * Client Component: needs interval/touch/hover state for the auto-slide,
 * pause-on-hover, infinite loop, and swipe behavior the spec calls for.
 * Falls back to a static (non-sliding) single card when there's only one
 * or zero curated repos yet, rather than rendering broken pagination
 * dots for an empty/singleton pool.
 */
export function GithubHero({ repos, totalCurated }: GithubHeroProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = repos.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [paused, count]);

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  }

  const active = repos[index];

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#0b1220] via-[#111c33] to-[#0b1220] text-white shadow-sm">
      <div className="grid gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-2 lg:items-center lg:gap-12">
        {/* Left column - headline, positioning statement, CTAs. */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200">
            Developer Knowledge Library
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
            Repositories every developer should know about — not just what&apos;s trending today.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
            A hand-curated library of {totalCurated.toLocaleString("en-US")}+ repositories — AI agents, developer
            productivity, system design, security, mobile, and more — picked by editors for lasting value, not a
            24-hour trending snapshot.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#github-library-results"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5"
            >
              Explore the Library
            </a>
            <a
              href="#featured-collections"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
            >
              Browse Collections
            </a>
          </div>
        </div>

        {/* Right column - auto-sliding repo showcase. */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {!active ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/20 text-sm text-slate-400">
              No curated repositories yet.
            </div>
          ) : (
            <>
              <Link
                href={`/developer-hub/github/${active.slug}`}
                className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-colors duration-200 hover:border-white/25 sm:p-7"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={active.avatarUrl}
                    alt=""
                    aria-hidden="true"
                    className="size-14 shrink-0 rounded-xl border border-white/10 bg-white/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-xl font-bold tracking-tight text-white">
                        <span className="text-slate-400">{active.owner}/</span>
                        {active.repoName}
                      </h3>
                      {active.editorPick && (
                        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                          Editor&apos;s Pick
                        </span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-300">{active.description}</p>
                  </div>
                </div>

                {active.editorNotes && (
                  <p className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-sm italic leading-relaxed text-slate-200">
                    &ldquo;{active.editorNotes}&rdquo;
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
                  {active.language && (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: LANGUAGE_DOT_COLORS[active.language] ?? "#9CA3AF" }} />
                      {active.language}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <StarIcon />
                    {formatStat(active.stars)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ForkIcon />
                    {formatStat(active.forks)}
                  </span>
                  {active.category && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 font-medium">
                      {REPOSITORY_CATEGORY_LABELS[active.category as RepositoryCategorySlug]?.emoji}{" "}
                      {REPOSITORY_CATEGORY_LABELS[active.category as RepositoryCategorySlug]?.label}
                    </span>
                  )}
                </div>
              </Link>

              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous repository"
                    className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/70 text-white transition-colors duration-200 hover:bg-slate-900"
                  >
                    <ArrowIcon direction="left" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next repository"
                    className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/70 text-white transition-colors duration-200 hover:bg-slate-900"
                  >
                    <ArrowIcon direction="right" />
                  </button>

                  <div className="mt-5 flex items-center justify-center gap-2">
                    {repos.map((repo, dotIndex) => (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => goTo(dotIndex)}
                        aria-label={`Show ${repo.fullName}`}
                        aria-current={dotIndex === index}
                        className={`h-1.5 rounded-full transition-all duration-200 ${
                          dotIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
