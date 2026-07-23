import Link from "next/link";

/**
 * Bookmarks page header (redesign) - breadcrumb, small eyebrow label,
 * large title, subtitle. Same typographic pattern as the redesigned
 * Article Detail / Release Detail pages' page headers.
 */
export function BookmarksHeader() {
  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="transition-colors hover:text-[#2f67e8]">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">Bookmarks</span>
      </nav>

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Bookmarks</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">Bookmarks</h1>
      <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400">
        Save articles, releases and developer resources for later.
      </p>
    </div>
  );
}
