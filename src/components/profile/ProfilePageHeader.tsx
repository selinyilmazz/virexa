import Link from "next/link";
import { getServerTranslations } from "@/i18n/get-server-translations";

/**
 * Profile page header (redesign) - breadcrumb, small eyebrow label, large
 * title, subtitle. Same typographic pattern as `BookmarksHeader` and the
 * redesigned Article Detail / Release Detail page headers.
 */
export async function ProfilePageHeader() {
  const { t } = await getServerTranslations();

  return (
    <div>
      <nav aria-label={t("profile.breadcrumbAria")} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="transition-colors hover:text-[#2f67e8]">
          {t("common.home")}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{t("profile.title")}</span>
      </nav>

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{t("profile.title")}</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">{t("profile.heading")}</h1>
      <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400">{t("profile.subtitle")}</p>
    </div>
  );
}
