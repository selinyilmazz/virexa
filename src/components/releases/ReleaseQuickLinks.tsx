import type { ReactNode } from "react";
import type { TechnologyRelease } from "@/data/releases";

const websiteIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.8 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.8-3.8-9s1.3-6.4 3.8-9Z" />
  </svg>
);

const docsIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M6 3h9l4 4v14H6Z" />
    <path d="M15 3v4h4M9 12h6M9 16h6M9 8h2" strokeLinecap="round" />
  </svg>
);

const githubIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <path d="M12 2a10 10 0 0 0-3.16 19.5c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.9-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
  </svg>
);

const packageIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" />
    <path d="M4.5 7.5 12 12l7.5-4.5M12 12v9" />
  </svg>
);

const externalIcon = (
  <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

type QuickLink = { label: string; url: string; icon: ReactNode };

/** Quick Links (requirement 3) - Website / Documentation / GitHub / Package Registry. Any field the technology doesn't have (`packageRegistry` is the most common omission - e.g. Node.js and Kubernetes don't ship one) is simply not rendered, never shown as a dead/placeholder tile. Hides the whole section if somehow none apply. */
export function ReleaseQuickLinks({ release }: { release: TechnologyRelease }) {
  const links: QuickLink[] = [];
  if (release.website) links.push({ label: "Official Website", url: release.website, icon: websiteIcon });
  if (release.docs) links.push({ label: "Documentation", url: release.docs, icon: docsIcon });
  if (release.github) links.push({ label: "GitHub Repository", url: release.github, icon: githubIcon });
  if (release.packageRegistry) links.push({ label: release.packageRegistry.label, url: release.packageRegistry.url, icon: packageIcon });

  if (links.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold tracking-tight text-slate-950">Quick Links</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 transition-colors hover:border-slate-300 hover:bg-white hover:shadow-sm"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">{link.icon}</span>
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-slate-800">{link.label}</span>
              <span className="text-slate-400 transition-colors group-hover:text-[#2f67e8]">{externalIcon}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
