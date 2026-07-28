import Link from "next/link";
import type { BreadcrumbItem } from "@/data/categories";
import { getServerTranslations } from "@/i18n/get-server-translations";

type CategoryHeaderProps = {
  name: string;
  description: string;
  articleCount: number;
  breadcrumb: BreadcrumbItem[];
};

export async function CategoryHeader({ name, description, articleCount, breadcrumb }: CategoryHeaderProps) {
  const { t } = await getServerTranslations();
  return (
    <div>
      <nav aria-label={t("article.breadcrumb.ariaLabel")} className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        {breadcrumb.map((crumb, index) => {
          const isLast = index === breadcrumb.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">›</span>}
              {isLast ? (
                <span className="font-medium text-slate-950">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="transition-colors hover:text-[#2f67e8]">
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">{name}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-500">{description}</p>
      <p className="mt-3 text-sm font-medium text-slate-500">{t("category.articlesFound", { count: articleCount })}</p>
    </div>
  );
}
