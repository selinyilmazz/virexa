import Link from "next/link";

/**
 * Profile page header (redesign) - breadcrumb, small eyebrow label, large
 * title, subtitle. Same typographic pattern as `BookmarksHeader` and the
 * redesigned Article Detail / Release Detail page headers.
 */
export function ProfilePageHeader() {
  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="transition-colors hover:text-[#2f67e8]">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">Profile</span>
      </nav>

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Profile</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">My Profile</h1>
      <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400">
        Manage your account, bookmarks and reading activity.
      </p>
    </div>
  );
}
