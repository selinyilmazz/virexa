"use client";

import { useEffect, useState } from "react";
import { resolveBrandVisual } from "@/components/developer-hub/brand-icons";
import { useAuth } from "@/hooks/useAuth";
import { getContinueLearning, type ContinueLearningEntry } from "@/lib/developer-hub/continue-learning";

/** Coarse "2h ago" / "3d ago" formatting for a real `visitedAt` ISO timestamp - deliberately relative and vague rather than a fabricated precise claim like "Completed yesterday". */
function formatVisitedRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function ResumeArrowIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * "Continue Learning" - a personalized section shown only to signed-in
 * visitors, directly below the Hero (per the requested Hero → Continue
 * Learning → Popular Categories → ... order).
 *
 * The user's mockup described fabricated progress state ("Docker Desktop
 * 75%", "Next.js Completed yesterday", "AWS Started today"), but this app
 * has no real progress-tracking backend for external Developer Hub
 * resources - we don't control completion state on AWS Skill Builder,
 * Coursera, etc. Rather than inventing fake percentages, this section
 * shows the genuinely real signal available: which resources the
 * visitor actually clicked into recently, and how long ago (see
 * `continue-learning.ts`). Renders nothing for signed-out visitors or
 * once a visitor has no recorded visits yet - an empty personalized
 * section would be worse than no section at all.
 */
export function ContinueLearningSection() {
  const { user, isLoading } = useAuth();
  const [entries, setEntries] = useState<ContinueLearningEntry[]>([]);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }
    setEntries(getContinueLearning(user.id, 3));
  }, [user]);

  if (isLoading || !user || entries.length === 0) return null;

  return (
    <section aria-labelledby="continue-learning-heading" className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 id="continue-learning-heading" className="text-xl font-bold tracking-tight text-slate-950">
          Continue Learning
        </h2>
        <span className="text-sm text-slate-500">Picked up where you left off</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => {
          const visual = resolveBrandVisual(entry.brandKey);
          return (
            <a
              key={entry.id}
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <span
                aria-hidden="true"
                className={`flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 ${visual.bg} ${visual.fg}`}
              >
                {visual.content}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950">{entry.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {entry.provider} · Visited {formatVisitedRelative(entry.visitedAt)}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-[#2f67e8] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Resume
                <ResumeArrowIcon />
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
