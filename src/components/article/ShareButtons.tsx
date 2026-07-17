"use client";

import { useEffect, useRef, useState } from "react";
import { BookmarkButton } from "@/components/news/BookmarkButton";
import { AuthToast, type AuthToastVariant } from "@/components/auth/AuthToast";
import type { BookmarkItem } from "@/lib/bookmarks";
import { reportArticleMetric } from "@/lib/metrics-client";

type ShareButtonsProps = {
  bookmarkItem: BookmarkItem;
  title: string;
};

const copyLinkIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 15 15 9" strokeLinecap="round" />
    <path
      d="M10.5 6.5 12 5a3.5 3.5 0 0 1 5 5l-1.5 1.5M13.5 17.5 12 19a3.5 3.5 0 0 1-5-5l1.5-1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const xIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M4 4l16 16M20 4 4 20" strokeLinecap="round" />
  </svg>
);

const facebookIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <path d="M15 8.5h2V5.3c-.5-.07-1.6-.2-2.7-.2-2.7 0-4.3 1.6-4.3 4.5V12H7v3.5h3v7h3.5v-7h2.9l.5-3.5h-3.4V9.9c0-1 .3-1.4 1.5-1.4Z" />
  </svg>
);

const linkedinIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path
      d="M7.5 10v7M7.5 7.2v.1M11 10v7M11 13c0-1.7 1-3 2.7-3 1.6 0 2.3 1.1 2.3 3v4"
      fill="none"
      stroke="#fff"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

const whatsappIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z" strokeLinejoin="round" />
    <path
      d="M8.5 8.8c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .6.4.2.5.7 1.6.7 1.8s0 .3-.1.5c-.2.2-.3.3-.5.5-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.2.4-.2.6-.1.2.1 1.5.7 1.8.9.3.1.4.2.5.3 0 .2 0 .9-.3 1.5-.3.6-1.6 1.2-2.2 1.2-.6 0-1.8-.2-3.6-1.2-2.2-1.3-3.6-3.5-3.7-3.7-.1-.1-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.9Z"
      strokeLinejoin="round"
    />
  </svg>
);

const shareIcon = (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="m8.2 10.7 7.6-4.4M8.2 13.3l7.6 4.4" />
  </svg>
);

export function ShareButtons({ bookmarkItem, title }: ShareButtonsProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: AuthToastVariant } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPopoverOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPopoverOpen]);

  function showToast(message: string, variant: AuthToastVariant = "success") {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 2000);
  }

  async function handleShareClick() {
    const url = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        void reportArticleMetric(bookmarkItem.slug, "share");
      } catch {
        // User cancelled the native share sheet — nothing to do.
      }
      return;
    }
    setIsPopoverOpen((prev) => !prev);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied");
      void reportArticleMetric(bookmarkItem.slug, "share");
    } catch {
      showToast("Couldn't copy link", "error");
    }
    setIsPopoverOpen(false);
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareLinks = [
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
      icon: xIcon,
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      icon: facebookIcon,
    },
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      icon: linkedinIcon,
    },
    {
      label: "Share on Whatsapp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`,
      icon: whatsappIcon,
    },
  ];

  return (
    <div ref={containerRef} className="relative flex shrink-0 items-center gap-3">
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <BookmarkButton item={bookmarkItem} variant="pill" onError={(message) => showToast(message, "error")} />

      <button
        type="button"
        onClick={() => void handleShareClick()}
        aria-expanded={isPopoverOpen}
        aria-haspopup="true"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        {shareIcon}
        Share
      </button>

      {isPopoverOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            {copyLinkIcon}
            Copy Link
          </button>

          <div className="my-1 h-px bg-slate-100" />

          {shareLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setIsPopoverOpen(false);
                void reportArticleMetric(bookmarkItem.slug, "share");
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {link.icon}
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
