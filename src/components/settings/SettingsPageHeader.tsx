import Link from "next/link";

/**
 * Settings page header (redesign) - breadcrumb, small eyebrow label,
 * large title, subtitle. Same typographic pattern as `BookmarksHeader`
 * and `ProfilePageHeader`.
 */
export function SettingsPageHeader() {
  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="transition-colors hover:text-[#2f67e8]">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">Settings</span>
      </nav>

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Settings</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">Settings</h1>
      <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400">Manage your Virexa experience.</p>
    </div>
  );
}
