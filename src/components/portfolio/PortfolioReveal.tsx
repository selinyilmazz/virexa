"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight scroll-reveal wrapper - no animation library dependency,
 * just an `IntersectionObserver` toggling `.portfolio-reveal-visible`
 * (see `portfolio.css`, which also handles `prefers-reduced-motion`
 * itself). Fires once per element (`unobserve` after first intersect) -
 * this is a one-time entrance effect, not a re-triggering scroll gimmick.
 * `as` lets callers pick the wrapping tag (defaults to `div`) so this
 * never forces an extra block-level wrapper where an inline one is
 * needed.
 */
export function PortfolioReveal({
  children,
  className,
  delayMs = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "span" | "li";
}) {
  // `any` here is deliberate: `Tag` is a union of intrinsic tag names, and
  // each maps to a different DOM element type - a single ref object has
  // to be assignable to all of them, which TS can't express cleanly for a
  // dynamic tag without this escape hatch. The runtime value is always a
  // real DOM element regardless.
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement> as never}
      className={`portfolio-reveal${isVisible ? " portfolio-reveal-visible" : ""}${className ? ` ${className}` : ""}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
