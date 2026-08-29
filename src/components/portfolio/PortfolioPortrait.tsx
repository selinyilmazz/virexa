"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Hero portrait, with a graceful placeholder instead of a broken-image
 * icon when `src` (`personalInfo.portraitUrl`) doesn't exist yet - see
 * `public/images/portfolio/README.txt` for where to drop the real
 * photo. `onError` fires client-side regardless of whether Next's image
 * optimizer 404s or the raw file 404s, so this covers both dev and
 * production. Initials are derived from `name`, not hardcoded, so this
 * stays correct if the name ever changes.
 */
export function PortfolioPortrait({ src, alt, initials }: { src: string; alt: string; initials: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden border border-[var(--portfolio-border)]">
      {!hasError ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 420px, 80vw"
          className="object-cover grayscale-[15%] transition-[filter] duration-700 hover:grayscale-0"
          onError={() => setHasError(true)}
          priority
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-4 bg-[var(--portfolio-surface)] px-6 text-center">
          <span className="portfolio-serif text-6xl font-semibold text-[var(--portfolio-accent)] sm:text-7xl">
            {initials}
          </span>
          <p className="max-w-[220px] text-xs tracking-wide text-[var(--portfolio-muted)] uppercase">Portrait coming soon</p>
        </div>
      )}

      {/* Print-magazine crop marks - quiet editorial detail, pure CSS/DOM, no image asset. */}
      <span className="pointer-events-none absolute top-3 left-3 size-4 border-t border-l border-[var(--portfolio-accent)]" />
      <span className="pointer-events-none absolute top-3 right-3 size-4 border-t border-r border-[var(--portfolio-accent)]" />
      <span className="pointer-events-none absolute bottom-3 left-3 size-4 border-b border-l border-[var(--portfolio-accent)]" />
      <span className="pointer-events-none absolute right-3 bottom-3 size-4 border-r border-b border-[var(--portfolio-accent)]" />
    </div>
  );
}
