"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type NewsImageProps = Omit<ImageProps, "onError" | "unoptimized"> & {
  /** Shown instead of `src` once the real image fails to load in the browser (dead link, hotlink protection, a since-removed image) - see `resolveFallbackImageForCategory` (`lib/news/image-fallback.ts`) for how callers usually build this. */
  fallbackSrc: string;
};

/**
 * Thin `next/image` wrapper adding a client-side broken-image safety
 * net (Image Enrichment phase, requirement 2: "Broken image
 * oluşmamalı" / "Bozuk URL'ler otomatik olarak placeholder'a düşsün").
 * `resolveArticleImage`/`resolveDisplayImage` already guarantee a valid
 * URL at ingestion and read time, but that can't catch an image that
 * was reachable when fetched and has since gone dead (link rot,
 * hotlink protection, a since-deleted image) - this catches that at
 * render time instead, swapping to `fallbackSrc` on the browser's own
 * `onError` rather than leaving a broken image icon in the UI.
 *
 * Used everywhere a real article image is rendered (`NewsCard`,
 * `ArticleHero`, `RelatedArticleCard`, `AdminArticleDetailContent`,
 * `HeroSection`) instead of a bare `next/image` `<Image>`, so this one
 * fallback behavior only has to be implemented once. Always
 * `unoptimized`, matching every existing image usage in this app
 * (external domains aren't whitelisted in `next.config.ts`, and this
 * keeps that existing image-optimization strategy unchanged).
 */
export function NewsImage({ src, fallbackSrc, alt, ...rest }: NewsImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  // Tracks which `src` `currentSrc` was derived from, so a prop change
  // (a parent reusing this component instance for a different article)
  // is detected and applied during render - the React-recommended way
  // to "reset" state on a prop change, instead of an effect that would
  // set state after an extra render pass.
  const [renderedSrc, setRenderedSrc] = useState(src);

  if (src !== renderedSrc) {
    setRenderedSrc(src);
    setCurrentSrc(src);
  }

  return (
    <Image
      {...rest}
      src={currentSrc}
      alt={alt}
      unoptimized
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
    />
  );
}
