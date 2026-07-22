import type { TechnologyRelease } from "@/data/releases";

const CHECKLIST_GROUPS: { key: keyof TechnologyRelease["whatsNew"]; label: string }[] = [
  { key: "features", label: "New Features" },
  { key: "improvements", label: "Improvements" },
  { key: "performance", label: "Performance" },
  { key: "bugFixes", label: "Bug Fixes" },
];

const checkIcon = (
  <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5 9.5 17 19 7" />
  </svg>
);

/**
 * What's New (requirement 5): highlights of the tracked release, grouped
 * into New Features / Improvements / Performance / Bug Fixes - any group
 * the technology's data doesn't have is simply omitted, never shown
 * empty. The "illustrative release image" on the right (requirement 5)
 * is a brand-gradient tile carrying the technology's own logo mark
 * rather than a fabricated screenshot/photo, consistent with this app's
 * "no invented imagery" convention elsewhere (see `releases.ts`'s
 * `gradient` field doc comment).
 */
export function ReleaseWhatsNew({ release }: { release: TechnologyRelease }) {
  const groups = CHECKLIST_GROUPS.map((group) => ({ ...group, items: release.whatsNew[group.key] ?? [] })).filter((group) => group.items.length > 0);
  if (groups.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight text-slate-950">What&apos;s New in {release.version}</h2>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid gap-6 sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">{group.label}</h3>
              <ul className="mt-2.5 space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-snug text-slate-700">
                    {checkIcon}
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="hidden aspect-square w-full shrink-0 items-center justify-center rounded-2xl lg:flex"
          style={{ background: `linear-gradient(135deg, ${release.gradient[0]}, ${release.gradient[1]})` }}
        >
          <div className={`flex size-20 items-center justify-center rounded-2xl bg-white/90 shadow-lg`}>{release.logo.content}</div>
        </div>
      </div>
    </div>
  );
}
