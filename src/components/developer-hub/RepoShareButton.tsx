"use client";

import { useEffect, useRef, useState } from "react";
import { AuthToast, type AuthToastVariant } from "@/components/auth/AuthToast";

type RepoShareButtonProps = {
  title: string;
  /** Absolute or relative URL to share - the Repository Detail page's own `/developer-hub/github/[slug]` URL, not the external GitHub URL, so shares drive traffic back to Virexa's curation. */
  url: string;
  iconOnly?: boolean;
};

const shareIcon = (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="m8.2 10.7 7.6-4.4M8.2 13.3l7.6 4.4" />
  </svg>
);

const copyLinkIcon = (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 15 15 9" strokeLinecap="round" />
    <path d="M10.5 6.5 12 5a3.5 3.5 0 0 1 5 5l-1.5 1.5M13.5 17.5 12 19a3.5 3.5 0 0 1-5-5l1.5-1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const xIcon = (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M4 4l16 16M20 4 4 20" strokeLinecap="round" />
  </svg>
);

const linkedinIcon = (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7.5 10v7M7.5 7.2v.1M11 10v7M11 13c0-1.7 1-3 2.7-3 1.6 0 2.3 1.1 2.3 3v4" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const redditIcon = (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
    <circle cx="12" cy="13" r="7.5" />
    <circle cx="9" cy="13" r="1" fill="#fff" />
    <circle cx="15" cy="13" r="1" fill="#fff" />
    <path d="M8.5 16.5c1 .8 2.2 1.2 3.5 1.2s2.5-.4 3.5-1.2" stroke="#fff" strokeWidth="1" fill="none" strokeLinecap="round" />
    <circle cx="18" cy="8" r="1.4" />
    <path d="M12 8 13 4l3 .6" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
  </svg>
);

/**
 * Repository Detail page's Share button - native Web Share API first
 * (mobile), falling back to a popover with Copy Link / X / LinkedIn /
 * Reddit (the spec's exact requested set - no Facebook/WhatsApp here,
 * unlike the article `ShareButtons`, since a repo share audience skews
 * toward those three). Deliberately its own component rather than
 * reusing `ShareButtons` - that component is hard-wired to a `BookmarkItem`
 * and `reportArticleMetric` (an `articles` table metric), neither of
 * which apply to a repository share.
 */
export function RepoShareButton({ title, url, iconOnly }: RepoShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: AuthToastVariant } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function showToast(message: string, variant: AuthToastVariant = "success") {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 2000);
  }

  async function handleClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled - nothing to do.
      }
      return;
    }
    setIsOpen((prev) => !prev);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch {
      showToast("Couldn't copy link", "error");
    }
    setIsOpen(false);
  }

  const shareLinks = [
    { label: "Share on X", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, icon: xIcon },
    { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, icon: linkedinIcon },
    { label: "Share on Reddit", href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, icon: redditIcon },
  ];

  return (
    <div ref={containerRef} className="relative">
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}
      <button
        type="button"
        onClick={() => void handleClick()}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Share this repository"
        className={
          iconOnly
            ? "flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors duration-200 hover:text-slate-700"
            : "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-slate-300"
        }
      >
        {shareIcon}
        {!iconOnly && "Share"}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50"
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
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50"
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
