/**
 * Line-art icons for the Developer Hub landing page's Popular Categories
 * cards - replaces plain emoji with clean, Lucide/Heroicons-style stroke
 * icons (card quality pass). Deliberately hand-drawn inline SVG rather
 * than pulling in a new icon library dependency: this codebase already
 * has an established "hand-coded stroke icon" convention for exactly
 * this kind of small nav/category icon (see `CategoryNav.tsx`'s
 * `ICON_PROPS` + its AI/Programming/Cloud/Security icons), so these
 * simply extend that same convention instead of introducing a second,
 * inconsistent icon system.
 */
const ICON_PROPS = {
  "aria-hidden": true as const,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type IconProps = { className?: string };

export function BadgeCheckIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 2.5 14 4l2.5-.6.9 2.4 2.4.9-.6 2.5 1.5 2-1.5 2 .6 2.5-2.4.9-.9 2.4-2.5-.6L12 21.5 10 20l-2.5.6-.9-2.4-2.4-.9.6-2.5-1.5-2 1.5-2-.6-2.5 2.4-.9.9-2.4 2.5.6Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function BookOpenIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 6.5c-1.5-1.3-3.7-2-6.5-2-.6 0-1 .4-1 1v11c0 .6.4 1 1 1 2.8 0 5 .7 6.5 2 1.5-1.3 3.7-2 6.5-2 .6 0 1-.4 1-1v-11c0-.6-.4-1-1-1-2.8 0-5 .7-6.5 2Z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

export function RouteIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="6" cy="19" r="2.2" />
      <circle cx="18" cy="5" r="2.2" />
      <path d="M8.2 19h7.6c1.8 0 3.2-1.4 3.2-3.2 0-1.8-1.4-3.2-3.2-3.2H8.2C6.4 12.6 5 11.2 5 9.4 5 7.6 6.4 6.2 8.2 6.2h7.6" />
    </svg>
  );
}

export function GithubMarkIcon({ className = "size-6" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2a10 10 0 0 0-3.16 19.5c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.4 9.4 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

export function WrenchIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 4.9L3 17.5 5.5 20l6.3-6.3a4 4 0 0 0 4.9-5.4l-2.8 2.8-2-2 2.8-2.8Z" />
    </svg>
  );
}

export function CompassIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-2 5-5 2 2-5 5-2Z" />
    </svg>
  );
}

/** "All Resources" nav tab - a simple grid/layout icon. */
export function GridIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  );
}

/** "Releases" nav tab - a rocket icon. */
export function RocketIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M14.5 3.5c2.5 1 4 3.5 4 6.5-2.5 1-5 1-7 0 0-2 1.5-5.5 3-6.5Z" />
      <path d="M11.5 10c-2 2-2.5 5-2.5 7 2 0 5-.5 7-2.5" />
      <path d="M8 15.5c-1.3.4-2.2 1.6-2.5 4 2.4-.3 3.6-1.2 4-2.5" />
      <circle cx="14.5" cy="7.5" r="1.2" />
    </svg>
  );
}

/** "Cheat Sheets" nav tab - a document/file icon. */
export function FileTextIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4" />
      <path d="M9 13.5h6M9 17h4.5" />
    </svg>
  );
}

/** Generic "AI" concept icon (a sparkle) - used in the Hero illustration's floating tech badges. Deliberately a plain concept icon here, not a specific brand mark. */
export function SparkleIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className} fill="currentColor" stroke="none">
      <path d="M12 2.5c.4 3.4 1.1 5.6 2.2 6.8 1.1 1.1 3.3 1.8 6.8 2.2-3.4.4-5.6 1.1-6.8 2.2-1.1 1.1-1.8 3.3-2.2 6.8-.4-3.4-1.1-5.6-2.2-6.8-1.1-1.1-3.3-1.8-6.8-2.2 3.4-.4 5.6-1.1 6.8-2.2 1.1-1.1 1.8-3.3 2.2-6.8Z" />
    </svg>
  );
}

/** Generic "Cloud" concept icon - used in the Hero illustration's floating tech badges. */
export function CloudIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M7 18h10.5a3.5 3.5 0 0 0 .5-6.96A5.5 5.5 0 0 0 7.6 9.1 4.5 4.5 0 0 0 7 18Z" />
    </svg>
  );
}
