/**
 * Open Source Explorer's hero - large title + one-line subtitle + a
 * single simple line-art icon. No illustration, no gradient artwork, no
 * floating tech-cluster graphic (unlike the Developer Hub landing page's
 * hero) - explicit spec: "This page should NOT look like a normal news
 * category... focused, premium and minimal."
 */
export function OpenSourceHero() {
  return (
    <div className="mt-6 flex items-start gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="6" cy="18" r="2.5" />
          <circle cx="18" cy="12" r="2.5" />
          <path d="M6 8.5v7M8.3 7 15.7 10.6M8.3 17 15.7 13.4" />
        </svg>
      </span>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Open Source</h1>
        <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-400">
          Discover trending open source repositories from GitHub.
        </p>
      </div>
    </div>
  );
}
