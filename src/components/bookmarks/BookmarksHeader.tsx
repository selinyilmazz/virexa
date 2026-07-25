"use client";

import Link from "next/link";
import { useTranslations } from "@/i18n/i18n-provider";

/**
 * Bookmarks page header (redesign) - breadcrumb, small eyebrow label,
 * large title, subtitle. Same typographic pattern as the redesigned
 * Article Detail / Release Detail pages' page headers. Client component
 * (not async/server) because it's rendered from `BookmarksContent.tsx`,
 * which is itself a client component - a static import of a Server
 * Component into client-component JSX isn't valid in Next.js.
 */
export function BookmarksHeader() {
  const t = useTranslations();

  return (
    <div>
      <nav aria-label={t("bookmarks.breadcrumbAria")} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="transition-colors hover:text-[#2f67e8]">
          {t("common.home")}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{t("bookmarks.title")}</span>
      </nav>

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{t("bookmarks.title")}</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">{t("bookmarks.title")}</h1>
      <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400">{t("bookmarks.subtitle")}</p>
    </div>
  );
}
