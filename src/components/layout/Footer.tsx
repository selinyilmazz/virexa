import Link from "next/link";
import { getServerTranslations } from "@/i18n/get-server-translations";

/**
 * Footer category links (matches the header's `CategoryNav` set: AI,
 * Programming, Cloud, Security, Open Source, Developer Hub) - same
 * routing `CategoryNav` itself uses, see that component's doc comment
 * for why each one routes where it does. "Developer Hub" (renamed from
 * "Resources") routes to `/developer-hub`, a different template from the
 * other five (see `CatalogExplorerView`'s doc comment).
 */
const footerCategoryLinks = [
  { label: "AI", href: "/category/ai" },
  { label: "Programming", href: "/category/programming" },
  { label: "Cloud", href: "/cloud" },
  { label: "Security", href: "/category/security" },
  { label: "Open Source", href: "/open-source" },
  { label: "Developer Hub", href: "/developer-hub" },
];

const socialLinks = [
  {
    label: "GitHub",
    href: "#",
    icon: (
      <path d="M12 2a10 10 0 0 0-3.16 19.5c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.4 9.4 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
    ),
  },
  {
    label: "X",
    href: "#",
    icon: <path d="m3.5 3 7.15 9.53L3.9 21h2l5.8-6.62L16.4 21H21l-7.44-9.93L20.13 3h-2l-5.36 6.12L8 3H3.5Z" />,
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <path d="M6.94 8.5H3.56V21h3.38V8.5ZM5.25 3.5a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM20.44 21h.01v-6.9c0-3.38-.73-5.98-4.67-5.98-1.9 0-3.17.99-3.69 1.94h-.05V8.5H8.83c.04.94 0 12.5 0 12.5h3.38v-6.98c0-.37.03-.75.14-1.02.3-.75 1-1.53 2.16-1.53 1.52 0 2.13 1.15 2.13 2.85V21h3.8Z" />
    ),
  },
  {
    label: "RSS",
    href: "#",
    icon: <path d="M4 4a16 16 0 0 1 16 16h-3.2A12.8 12.8 0 0 0 4 7.2V4Zm0 6.4a9.6 9.6 0 0 1 9.6 9.6h-3.2A6.4 6.4 0 0 0 4 13.6v-3.2ZM6.4 17.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z" />,
  },
];

export async function Footer() {
  const { t } = await getServerTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-[1820px] px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
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
              {footerCategoryLinks.map((category) => (
                <li key={category.label}>
                  <Link href={category.href} className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                    {category.label}
                  </Link>
                </li>
              ))}
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
                <a href="mailto:hello@virexa.app" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  {t("footer.contactHeading")}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  {t("footer.advertise")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-950">{t("footer.resourcesHeading")}</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="#" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  RSS Feed
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  API
                </a>
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
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-6 border-t border-slate-200 pt-6 sm:flex-row">
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-50 hover:text-[#2f67e8]"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="currentColor">
                  {social.icon}
                </svg>
              </a>
            ))}
          </div>
          <p className="text-sm text-slate-500">{t("footer.copyright", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
