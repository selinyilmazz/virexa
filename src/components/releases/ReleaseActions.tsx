"use client";

import { useEffect, useRef, useState } from "react";
import { AuthToast, type AuthToastVariant } from "@/components/auth/AuthToast";
import { useReleaseBookmark } from "@/lib/release-bookmarks";
import { recordReleaseView } from "@/lib/release-views";

type ReleaseActionsProps = {
  techSlug: string;
  technologyName: string;
};

const bookmarkIcon = (filled: boolean) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
    <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
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

const copyLinkIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 15 15 9" strokeLinecap="round" />
    <path d="M10.5 6.5 12 5a3.5 3.5 0 0 1 5 5l-1.5 1.5M13.5 17.5 12 19a3.5 3.5 0 0 1-5-5l1.5-1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const xIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M4 4l16 16M20 4 4 20" strokeLinecap="round" />
  </svg>
);

const linkedinIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7.5 10v7M7.5 7.2v.1M11 10v7M11 13c0-1.7 1-3 2.7-3 1.6 0 2.3 1.1 2.3 3v4" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/**
 * Hero Card's Bookmark + Share row (requirement 2). Intentionally its own
 * small, self-contained component rather than reusing `BookmarkButton`/
 * `ShareButtons` from the article system - see `lib/release-bookmarks.ts`'s
 * doc comment for why the bookmark half needs a separate store, and
 * mirroring that, sharing here never calls `reportArticleMetric` (that
 * API increments a real article's `article_metrics` row by slug - a
 * Technology Detail page isn't an article and has no such row to
 * increment).
 */
export function ReleaseActions({ techSlug, technologyName }: ReleaseActionsProps) {
  const [isSaved, toggleSaved] = useReleaseBookmark(techSlug);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: AuthToastVariant } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Real, distinct-technology view count (Profile page's "Developer
  // Releases Viewed" stat) - recorded once per mount, i.e. once per real
  // page open. See `lib/release-views.ts`'s doc comment.
  useEffect(() => {
    recordReleaseView(techSlug);
  }, [techSlug]);

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
        await navigator.share({ title: `${technologyName} | Virexa Developer Hub`, url });
      } catch {
        // User cancelled the native share sheet.
      }
      return;
    }
    setIsPopoverOpen((prev) => !prev);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied");
    } catch {
      showToast("Couldn't copy link", "error");
    }
    setIsPopoverOpen(false);
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareLinks = [
    { label: "Share on X", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(technologyName)}`, icon: xIcon },
    { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, icon: linkedinIcon },
  ];

  return (
    <div ref={containerRef} className="relative flex shrink-0 items-center gap-3">
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <button
        type="button"
        onClick={toggleSaved}
        aria-pressed={isSaved}
        className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-base font-medium transition-colors ${
          isSaved ? "border-[#2f67e8] bg-blue-50 text-[#2f67e8]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {bookmarkIcon(isSaved)}
        {isSaved ? "Saved" : "Save"}
      </button>

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
              onClick={() => setIsPopoverOpen(false)}
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
