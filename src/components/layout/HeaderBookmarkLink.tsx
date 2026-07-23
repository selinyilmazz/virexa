"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "@/i18n/i18n-provider";

export function HeaderBookmarkLink() {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!user) {
      event.preventDefault();
      router.push("/signin?redirect=/bookmarks");
    }
  }

  return (
    <Link
      href="/bookmarks"
      aria-label={t("nav.bookmarks")}
      onClick={handleClick}
      className="hidden shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-[#2f67e8] md:flex dark:text-slate-400 dark:hover:text-blue-400"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
      </svg>
    </Link>
  );
}
