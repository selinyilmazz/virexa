"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NewsImage } from "@/components/news/NewsImage";

export type FeaturedSlide = {
  slug: string;
  category: string;
  categoryHref: string;
  title: string;
  summary: string;
  source: string;
  publishedDate: string;
  readingTime?: string;
  image: string;
  fallbackImage: string;
  articleHref: string;
};

const AUTO_ADVANCE_MS = 7000;

/**
 * Client half of the "Featured Story" hero - cinematic full-bleed
 * background-image treatment (Hero redesign, references: Apple News,
 * Bloomberg featured articles, Netflix hero banners, Stripe visual
 * storytelling). Previously a split layout - a large dark panel on the
 * left, the article photo boxed small on the right, wasting the image
 * and reading as templated. Now the article's own image fills the
 * entire card as a `fill`/`object-cover` background layer, with a fixed
 * two-part gradient overlay (darker left + darker bottom, lighter right)
 * guaranteeing the text stays readable no matter what the underlying
 * photo looks like.
 *
 * Server-fetched `slides` (real top-trending articles, see
 * `HeroSection.tsx`/`getFeaturedArticles`) are handed in as plain data;
 * this component only owns which slide is currently shown, the
 * auto-advance timer, and the transition when the slide changes - no
 * data fetching here.
 *
 * Auto-advances every `AUTO_ADVANCE_MS`, paused on hover/focus so a
 * reader who's actually looking at the card never has it change under
 * them; a dot click jumps straight to that slide and resets the timer.
 * `key={slide.slug}` on the background+overlay wrapper is what drives
 * the slide-change transition: React remounts that subtree on every
 * slide change, restarting both the CSS fade-in (`hero-bg-fade`, 450ms)
 * and the slow, barely-noticeable 100%->105% zoom (`hero-bg-zoom`, 20s) -
 * see `globals.css` for both keyframes. Renders nothing if `slides` is
 * empty (server-side already falls back to a single static slide in
 * that case - see `HeroSection.tsx`).
 */
export function FeaturedStoryCarousel({ slides }: { slides: FeaturedSlide[] }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[Math.min(index, slides.length - 1)];

  return (
    <div
      className="relative isolate min-h-[520px] overflow-hidden rounded-2xl bg-slate-950 shadow-xl shadow-slate-950/20 lg:min-h-[600px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Background image + overlay - remounted per slide (`key`) so the
          fade/zoom animations restart on every change. */}
      <div key={slide.slug} className="hero-bg-fade absolute inset-0">
        <div className="hero-bg-zoom absolute inset-0">
          <NewsImage
            src={slide.image}
            fallbackSrc={slide.fallbackImage}
            alt={slide.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Left-darker/bottom-darker, right-lighter gradient overlay -
            guarantees text readability regardless of the article's own
            image (per Hero redesign spec). */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,10,20,.88) 0%, rgba(5,10,20,.72) 45%, rgba(5,10,20,.35) 100%), linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.65) 100%)",
          }}
        />
      </div>

      {/* Text content - always on the left, over the darkest part of the overlay. */}
      <div className="relative flex min-h-[520px] flex-col justify-end gap-5 p-6 sm:p-10 lg:min-h-[600px] lg:max-w-2xl lg:justify-center lg:p-14">
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-fit text-xs font-semibold uppercase tracking-[0.16em] text-[#5b8def]">
            Featured Story
          </span>
          <Link
            href={slide.categoryHref}
            className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            {slide.category}
          </Link>
        </div>

        <h1 className="line-clamp-4 font-serif text-3xl font-bold leading-[1.2] tracking-tight text-white sm:text-4xl lg:text-[2.5rem]">
          <Link href={slide.articleHref} className="transition-opacity hover:opacity-90">
            {slide.title}
          </Link>
        </h1>

        <p className="line-clamp-3 max-w-xl text-base leading-relaxed text-white/70">{slide.summary}</p>

        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-white/60">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2f67e8] text-[11px] font-bold text-white">
            {slide.source.charAt(0).toUpperCase()}
          </span>
          <span className="text-white/85">{slide.source}</span>
          {slide.publishedDate && (
            <>
              <span aria-hidden="true">•</span>
              <time>{slide.publishedDate}</time>
            </>
          )}
          {slide.readingTime && (
            <>
              <span aria-hidden="true">•</span>
              <span>{slide.readingTime}</span>
            </>
          )}
        </div>

        <Link
          href={slide.articleHref}
          className="mt-2 inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-6 py-3 text-base font-semibold text-slate-950 transition-colors hover:bg-slate-100"
        >
          Read Full Story
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Small "Featured Today" info tag, bottom-left corner. */}
      <span className="absolute bottom-5 left-6 z-10 hidden items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm sm:flex">
        🔥 Featured Today
      </span>

      {slides.length > 1 && (
        <div className="absolute bottom-5 right-6 z-10 flex gap-2 sm:bottom-6 sm:right-8">
          {slides.map((item, dotIndex) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => setIndex(dotIndex)}
              aria-label={`Show featured story ${dotIndex + 1}`}
              aria-current={dotIndex === index}
              className={`h-1.5 rounded-full transition-all ${
                dotIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
