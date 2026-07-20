import Link from "next/link";
import { categories } from "@/data/categories";
import { getServerTranslations } from "@/i18n/get-server-translations";

const footerCategorySlugs = ["technology", "ai", "business", "games", "world"];

export async function Footer() {
  const { t } = await getServerTranslations();
  const year = new Date().getFullYear();
  const footerCategories = categories.filter((category) => footerCategorySlugs.includes(category.slug));

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-[1820px] px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-[#2f67e8]">
              <svg aria-hidden="true" viewBox="0 0 64 56" className="h-9 w-11" fill="none">
                <path d="M3 4h16l14 26L47 4h14L38 52H24L3 4Z" fill="currentColor" />
                <path d="m35 18 7-13h13l-8 13H35Z" fill="currentColor" />
                <path d="M48 17h10v10H48zM55 3h7v7h-7z" fill="currentColor" />
              </svg>
              <span className="font-serif text-2xl font-semibold tracking-tight text-slate-950">Virexa</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">{t("footer.tagline")}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-950">{t("footer.categoriesHeading")}</h3>
            <ul className="mt-4 space-y-3">
              {footerCategories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/categories" className="text-sm font-medium text-[#2f67e8] hover:text-[#2556c9]">
                  {t("footer.viewAll")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-950">{t("footer.resourcesHeading")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  {t("footer.latestNews")}
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  {t("footer.search")}
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  {t("footer.allCategories")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-950">{t("footer.companyHeading")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/about" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  {t("footer.termsOfService")}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  {t("footer.cookiePolicy")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-950">{t("footer.contactHeading")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="mailto:hello@virexa.app"
                  className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]"
                >
                  hello@virexa.app
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  {t("footer.supportCenter")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  {t("footer.advertise")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-sm text-slate-500">{t("footer.copyright", { year })}</p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="transition-colors hover:text-[#2f67e8]">
              {t("footer.privacyPolicy")}
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[#2f67e8]">
              {t("footer.termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
