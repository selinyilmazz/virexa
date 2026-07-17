import Link from "next/link";
import { categories } from "@/data/categories";

const footerCategorySlugs = ["technology", "ai", "business", "games", "world"];

export function Footer() {
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
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Modern AI news aggregation and newsletter platform covering technology, business, AI, games and world
              news.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-950">Categories</h3>
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
                  View All →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-950">Resources</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  Latest News
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  All Categories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-950">Company</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/about" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-950">Contact</h3>
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
                  Support Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-500 transition-colors hover:text-[#2f67e8]">
                  Advertise
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-sm text-slate-500">© {year} Virexa. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="transition-colors hover:text-[#2f67e8]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[#2f67e8]">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
