/**
 * Wavy section-transition divider - purely decorative, no data/content.
 * `fill` should reference a CSS custom property so it always matches
 * whichever section it's transitioning INTO, in both light and dark
 * mode: `"var(--portfolio-band-bg)"` when entering a `.portfolio-band-
 * light` insert, `"var(--portfolio-bg)"` (the ambient token) when
 * returning to the regular dark/photo background. The area of the SVG
 * above the curve is left unfilled, so whatever sits behind the divider
 * (the previous section's own background) shows through there - that's
 * what produces the "wave peeling back to reveal the next section"
 * effect, matching the reference the user liked. A thin accent-colored
 * stroke traces the curve itself, tying it to the same hairline-border
 * motif used everywhere else on this page instead of a plain flat cut.
 */
export function PortfolioWaveDivider({ fill, flip = false }: { fill: string; flip?: boolean }) {
  return (
    <div aria-hidden="true" className="relative h-14 w-full overflow-hidden sm:h-20" style={flip ? { transform: "scaleY(-1)" } : undefined}>
      {/* `fill`/`stroke` set via `style` rather than the raw SVG
          attribute - guarantees the `var(--...)` CSS custom property
          resolves through the normal style pipeline instead of relying
          on browser-specific presentation-attribute var() support. */}
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path
          d="M0,30 C240,90 480,0 720,35 C960,70 1200,10 1440,40 L1440,100 L0,100 Z"
          style={{ fill }}
        />
        <path
          d="M0,30 C240,90 480,0 720,35 C960,70 1200,10 1440,40"
          fill="none"
          style={{ stroke: "var(--portfolio-accent)", strokeOpacity: 0.45 }}
          strokeWidth="1.25"
        />
      </svg>
    </div>
  );
}
