type ShareButtonsProps = {
  isBookmarked?: boolean;
};

export function ShareButtons({ isBookmarked = false }: ShareButtonsProps) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill={isBookmarked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
        </svg>
        Bookmark
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="m8.2 10.7 7.6-4.4M8.2 13.3l7.6 4.4" />
        </svg>
        Share
      </button>
    </div>
  );
}
