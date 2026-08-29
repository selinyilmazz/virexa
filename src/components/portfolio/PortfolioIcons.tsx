/**
 * Hand-drawn inline SVG icons for the portfolio route, following the same
 * "hand-coded stroke icon" convention already established in this codebase
 * (see `CategoryNav.tsx` / `developer-hub/CategoryIcons.tsx`'s `ICON_PROPS`)
 * instead of pulling in a new icon library dependency.
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

export function SunIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </svg>
  );
}

export function MoonIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7Z" />
    </svg>
  );
}

export function GithubIcon({ className = "size-5" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2a10 10 0 0 0-3.16 19.5c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.4 9.4 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

export function LinkedinIcon({ className = "size-5" }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M6.94 8.5H3.56V20.5H6.94V8.5Z" />
      <path d="M5.25 7c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Z" />
      <path d="M20.5 20.5h-3.38v-5.9c0-1.4-.5-2.36-1.75-2.36-.96 0-1.53.65-1.78 1.27-.09.22-.11.53-.11.84v6.15H9.9s.05-9.98 0-11h3.38v1.56c.45-.7 1.25-1.7 3.05-1.7 2.23 0 3.9 1.46 3.9 4.59v6.55Z" />
    </svg>
  );
}

export function MailIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2.2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function MapPinIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 21.5s7-6.3 7-11.8a7 7 0 0 0-14 0c0 5.5 7 11.8 7 11.8Z" />
      <circle cx="12" cy="9.7" r="2.4" />
    </svg>
  );
}

export function DownloadIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M12 3.5v11.6M7.5 11.3 12 15.8l4.5-4.5" />
      <path d="M4.5 18.5v1.2c0 .72.58 1.3 1.3 1.3h12.4c.72 0 1.3-.58 1.3-1.3v-1.2" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </svg>
  );
}

export function ExternalLinkIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M9 6H5.8A1.8 1.8 0 0 0 4 7.8v10.4A1.8 1.8 0 0 0 5.8 20h10.4A1.8 1.8 0 0 0 18 18.2V15" />
      <path d="M14 4h6v6M20 4l-9.5 9.5" />
    </svg>
  );
}

export function MenuIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function GraduationCapIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="m2.5 9 9.5-4.5L21.5 9 12 13.5 2.5 9Z" />
      <path d="M6.5 11v4.5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V11" />
      <path d="M21.5 9v6" />
    </svg>
  );
}

export function FolderCodeIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M3.5 6.8c0-.7.6-1.3 1.3-1.3h4.4l1.8 2h8.2c.7 0 1.3.6 1.3 1.3v9c0 .7-.6 1.3-1.3 1.3H4.8c-.7 0-1.3-.6-1.3-1.3Z" />
      <path d="m9.8 11.5-2 2 2 2M14.2 11.5l2 2-2 2" />
    </svg>
  );
}

export function AwardIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.3 13.7-1.3 6.3 5-2.5 5 2.5-1.3-6.3" />
    </svg>
  );
}

export function LayersIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8Z" />
      <path d="m3.5 13 8.5 4.5L20.5 13" />
      <path d="m3.5 17.5 8.5 4.5 8.5-4.5" />
    </svg>
  );
}

export function GlobeIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.3 3.7 5.3 3.7 8.5s-1.3 6.2-3.7 8.5c-2.4-2.3-3.7-5.3-3.7-8.5S9.6 5.8 12 3.5Z" />
    </svg>
  );
}

export function BarChartIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M5 20V10M12 20V4M19 20v-7" />
    </svg>
  );
}

export function PulseIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M2.5 12h4l2-6 4 12 2-9 1.5 3h5.5" />
    </svg>
  );
}

export function BriefcaseIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <rect x="3" y="7.5" width="18" height="12" rx="1.6" />
      <path d="M8.5 7.5V5.8c0-.72.58-1.3 1.3-1.3h4.4c.72 0 1.3.58 1.3 1.3V7.5" />
      <path d="M3 12.5h18" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}
