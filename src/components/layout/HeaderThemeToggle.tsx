/**
 * Dark mode toggle icon (homepage redesign - matches the reference
 * header's moon icon). Deliberately visual-only: Virexa has no dark
 * theme implemented anywhere else in the app (every page/component is
 * built against a fixed light palette), so wiring this to an actual
 * `dark:` class toggle would only flip this one icon's own state while
 * leaving the entire rest of the site unstyled for dark mode - worse
 * than not having the control at all. This renders the icon in the same
 * position/style a working toggle would occupy, without claiming a
 * capability the app doesn't have yet.
 */
export function HeaderThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      className="hidden shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-[#2f67e8] md:flex"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20.5 14.5a8.5 8.5 0 1 1-9-11 7 7 0 0 0 9 11Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
