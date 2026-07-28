import Link from "next/link";
import { getServerTranslations } from "@/i18n/get-server-translations";

type CategoriesHeroProps = {
  title: string;
  description: string;
};

export async function CategoriesHero({ title, description }: CategoriesHeroProps) {
  const { t } = await getServerTranslations();
  return (
    <div>
      <nav aria-label={t("article.breadcrumb.ariaLabel")} className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="transition-colors hover:text-[#2f67e8]">
          {t("common.home")}
        </Link>
        <span aria-hidden="true">›</span>
        <span className="font-medium text-slate-950">{t("categoriesPage.breadcrumbCurrent")}</span>
      </nav>

      <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
