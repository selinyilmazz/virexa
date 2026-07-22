import type { TechnologyRelease } from "@/data/releases";

const warningIcon = (
  <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 2 20h20L12 3Z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);

/** Breaking Changes (requirement 6): only rendered when the technology actually has breaking changes recorded - otherwise this whole section is hidden entirely (no "None" placeholder), per the "gracefully hide missing sections" instruction. */
export function ReleaseBreakingChanges({ release }: { release: TechnologyRelease }) {
  if (!release.breakingChanges || release.breakingChanges.length === 0) return null;

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950">
          {warningIcon}
          Breaking Changes
        </h2>
        {release.migrationGuideUrl && (
          <a
            href={release.migrationGuideUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Migration Guide
          </a>
        )}
      </div>

      <ul className="mt-4 space-y-4">
        {release.breakingChanges.map((change) => (
          <li key={change.title} className="rounded-2xl border border-amber-200/70 bg-white p-4">
            <p className="text-sm font-bold text-slate-950">{change.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{change.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
