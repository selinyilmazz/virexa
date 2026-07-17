import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

export function Pagination({ currentPage, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  const navButtonClass =
    "flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50";
  const navButtonDisabledClass =
    "flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-300 cursor-not-allowed opacity-40";

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
      {isFirst ? (
        <span aria-hidden="true" className={navButtonDisabledClass}>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </span>
      ) : (
        <Link href={buildHref(currentPage - 1)} aria-label="Previous page" className={navButtonClass}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </Link>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`flex size-11 items-center justify-center rounded-xl text-base font-semibold transition-colors ${
            page === currentPage
              ? "bg-[#2f67e8] text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {page}
        </Link>
      ))}

      {isLast ? (
        <span aria-hidden="true" className={navButtonDisabledClass}>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      ) : (
        <Link href={buildHref(currentPage + 1)} aria-label="Next page" className={navButtonClass}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </Link>
      )}
    </nav>
  );
}
