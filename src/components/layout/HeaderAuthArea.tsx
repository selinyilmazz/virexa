"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/hooks/useAuth";
import { getAvatarUrl, getDisplayName } from "@/lib/supabase/utils";
import { useTranslations } from "@/i18n/i18n-provider";

const dropdownLinks = [
  {
    href: "/profile",
    labelKey: "nav.profile",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/bookmarks",
    labelKey: "nav.bookmarks",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function HeaderAuthArea() {
  const t = useTranslations();
  const { user, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (isLoading) {
    // Server-resolved auth state normally lands before first paint (see
    // AuthProvider), so this is a brief defensive placeholder rather
    // than a real loading state - reserves the same layout slot so
    // nothing shifts once resolved.
    return <div className="hidden shrink-0 items-center gap-3 md:flex" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className="hidden shrink-0 items-center gap-3 md:flex">
        <Link
          href="/signin"
          className="rounded-2xl border-2 border-[#2f67e8] px-6 py-2 text-xl font-semibold text-[#2f67e8] transition-colors hover:bg-blue-50"
        >
          {t("nav.signIn")}
        </Link>
        <Link
          href="/signup"
          className="rounded-2xl bg-[#2f67e8] px-6 py-2 text-xl font-semibold text-white transition-colors hover:bg-[#2556c9]"
        >
          {t("nav.signUp")}
        </Link>
      </div>
    );
  }

  const displayName = getDisplayName(user);
  const avatarUrl = getAvatarUrl(user);

  return (
    <div ref={containerRef} className="relative hidden shrink-0 items-center md:flex">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2.5 rounded-2xl border border-slate-200 px-3 py-2 transition-colors hover:bg-slate-50"
      >
        <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
          <Image src={avatarUrl} alt={displayName} fill unoptimized className="object-cover" />
        </span>
        <span className="max-w-[140px] truncate text-lg font-semibold text-slate-950">{displayName}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          {dropdownLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {item.icon}
              {t(item.labelKey)}
            </Link>
          ))}

          <div className="my-1 h-px bg-slate-100" />

          <LogoutButton
            onBeforeNavigate={() => setIsOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-base font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("nav.logout")}
          </LogoutButton>
        </div>
      )}
    </div>
  );
}
