import type { ReactNode } from "react";
import { GithubMarkIcon, CompassIcon } from "@/components/developer-hub/CategoryIcons";

/**
 * Hand-crafted, simplified brand marks for the Developer Hub card-quality
 * pass ("the page feels like a wireframe... replace emojis with
 * professional branding"). No new icon-library dependency was installed
 * (this sandbox has no npm registry access) - every mark here is an
 * inline SVG, either a small geometric abstraction of the real logo
 * (Vercel's triangle, Vue's V, Microsoft's four squares, Kubernetes'
 * wheel, etc. - all simple enough to reproduce faithfully) or, where a
 * brand's real mark is too intricate to abstract responsibly (Coursera,
 * Udemy, MDN, DBeaver, Warp, Postgres tutorial sites...), a clean
 * wordmark/initials tile on that brand's real color instead of a fake
 * pictorial logo. Every color used below is the brand's real, public
 * brand color.
 */

type IconProps = { className?: string };

function MicrosoftIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function GoogleDotsIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="4.4" fill="#4285F4" />
      <circle cx="16" cy="8" r="4.4" fill="#EA4335" />
      <circle cx="8" cy="16" r="4.4" fill="#FBBC05" />
      <circle cx="16" cy="16" r="4.4" fill="#34A853" />
    </svg>
  );
}

/** Exported for reuse by the Developer Hub landing page's Hero illustration. */
export function KubernetesIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x="11" y="1.5" width="2" height="6" rx="1" transform={`rotate(${(360 / 7) * i} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function TerraformIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <rect x="3" y="13.5" width="6.2" height="7.2" />
      <rect x="10.4" y="6.8" width="6.2" height="7.2" />
      <rect x="10.4" y="13.5" width="6.2" height="7.2" opacity="0.55" />
    </svg>
  );
}

function CiscoIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-hidden="true" fill="currentColor">
      {[6, 10, 14, 18, 14, 10, 6].map((h, i) => (
        <rect key={i} x={i * 4} y={20 - h} width="2.6" height={h} rx="1.3" />
      ))}
    </svg>
  );
}

/** Exported for reuse by the Developer Hub landing page's Hero illustration (brand-icon cluster around the laptop). */
export function DockerIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <rect x="3" y="11" width="4" height="3.4" />
      <rect x="7.4" y="11" width="4" height="3.4" />
      <rect x="11.8" y="11" width="4" height="3.4" />
      <rect x="7.4" y="6.8" width="4" height="3.4" />
      <rect x="11.8" y="6.8" width="4" height="3.4" />
      <path d="M2 14.5c0 3.6 3.2 5.5 8.5 5.5 6 0 10-2.4 11.4-5.7.6.1 1.6-.1 2.1-.9-.6-.7-1.5-.7-1.9-.6-.3-.6-.9-1-.9-1-1 .4-1.3 1.4-1.3 1.4H4c-.9 0-2 .3-2 1.3Z" />
    </svg>
  );
}

/** Exported for reuse by the Developer Hub landing page's Hero illustration. */
export function ReactIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </svg>
  );
}

/** Exported for reuse by the Developer Hub landing page's Hero illustration. */
export function NodeIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2 21 7v10l-9 5-9-5V7Z" />
    </svg>
  );
}

function PythonIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2c-3 0-3.2 1.3-3.2 1.3v2.6h6.4v.9H5.8S3 6.5 3 10.3s2.4 3.7 2.4 3.7h1.9v-2c0-2.7 2.3-3.4 4.7-3.4h4c1.8 0 3.2-1.4 3.2-3.2V5.5C19.2 3 15.5 2 12 2Z"
        fill="#3776AB"
      />
      <path
        d="M12 22c3 0 3.2-1.3 3.2-1.3v-2.6H8.8v-.9h9.4S21 17.5 21 13.7s-2.4-3.7-2.4-3.7h-1.9v2c0 2.7-2.3 3.4-4.7 3.4h-4c-1.8 0-3.2 1.4-3.2 3.2v1.9C4.8 21 8.5 22 12 22Z"
        fill="#FFD43B"
      />
    </svg>
  );
}

function VercelIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 3 22 20H2Z" />
    </svg>
  );
}

function NextjsIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#000000" />
      <path d="M9 7v10l1.8-.01V10.9L16.2 17H18L10.6 7H9Z" fill="#FFFFFF" />
    </svg>
  );
}

function VueIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M2 3h4l6 10 6-10h4L12 21Z" fill="#41B883" />
      <path d="M6 3h4l2 3.4L14 3h4l-6 10Z" fill="#35495E" />
    </svg>
  );
}

function SvelteIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="#FF3E00">
      <path d="M17 4.5c-2-2-5.2-2.6-7.6-1.1L5.6 5.7A5 5 0 0 0 3.3 9a4.9 4.9 0 0 0 .7 3.7 5 5 0 0 0-.7 2.6A5.1 5.1 0 0 0 8.4 20a5.6 5.6 0 0 0 3-.8l3.8-2.4a5 5 0 0 0 2.3-3.3 4.9 4.9 0 0 0-.7-3.7 5 5 0 0 0 .7-2.6A5.1 5.1 0 0 0 17 4.5Z" />
    </svg>
  );
}

function TailwindIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 20" className={className} aria-hidden="true" fill="#38BDF8">
      <path d="M6 9c1-4 3-5 6-5s5 1 6 5c-1-1.5-2.5-2-4-1.5-1 .3-1.7 1.2-2.5 2.1C10.5 10.9 9 12 6 9Z" />
      <path d="M0 15c1-4 3-5 6-5s5 1 6 5c-1-1.5-2.5-2-4-1.5-1 .3-1.7 1.2-2.5 2.1C4.5 16.9 3 18 0 15Z" />
    </svg>
  );
}

function SupabaseIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="#3ECF8E">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

function FigmaIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="9" cy="7" r="3" fill="#F24E1E" />
      <circle cx="15" cy="7" r="3" fill="#A259FF" />
      <circle cx="9" cy="13" r="3" fill="#0ACF83" />
      <circle cx="15" cy="13" r="3" fill="#1ABCFE" />
      <circle cx="9" cy="19" r="3" fill="#FF7262" />
    </svg>
  );
}

function PostmanIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#FF6C37" />
      <path d="M8 13.5 15 8l-3.2 6.5-2-1Z" fill="#ffffff" />
    </svg>
  );
}

function GitIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="12" r="2.2" />
      <path d="M6 8.2v7.6M8 6.9l8 3.7M8 17.1l8-3.7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CodeBracketsIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 6-5 6 5 6M16 6l5 6-5 6" />
    </svg>
  );
}

function ElephantIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M4 12c0-4.4 3.6-7 8-7s8 2.6 8 7v2a2 2 0 0 1-2 2v3h-2v-3H8v3H6v-3a2 2 0 0 1-2-2Z" />
      <circle cx="9" cy="11" r="1" fill="#fff" />
    </svg>
  );
}

/** Simplified AWS "smile" arrow mark, real brand colors - exported for reuse by the Developer Hub landing page's Hero illustration. */
export function AwsIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <text x="1" y="14" fontSize="11" fontWeight="800" fill="currentColor">
        aws
      </text>
      <path d="M2 17c5 2.6 15 2.6 20 0" stroke="#FF9900" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="m19 15.3 3 .9-1.6 2.6Z" fill="#FF9900" />
    </svg>
  );
}

/** Simplified VS Code "ribbon" mark in the editor's real brand blue - exported for reuse by the Developer Hub landing page's Hero illustration. */
export function VSCodeIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M17 2.5 8.3 10 4 6.7 1.8 8l4.8 4-4.8 4L4 17.3 8.3 14 17 21.5l4.2-2V4.5Zm0 5.4v8.2L11.6 12Z" fill="#007ACC" />
    </svg>
  );
}

/** Short, bold wordmark/initials tile - used when a brand's real mark is too intricate to responsibly abstract at icon size. */
function Wordmark({ label, className = "text-sm" }: { label: string; className?: string }) {
  return <span className={`font-extrabold tracking-tight ${className}`}>{label}</span>;
}

export type BrandVisual = {
  /** Tailwind background classes (solid or gradient) for the tile. */
  bg: string;
  /** Text/icon color classes applied to the tile's content. */
  fg: string;
  content: ReactNode;
};

const ICON = "size-6";

/** Keyed by the exact `provider` string used in `src/data/developer-hub.ts`, or a GitHub repo's `full_name` for repo items. */
const BRAND_VISUALS: Record<string, BrandVisual> = {
  "Amazon Web Services": { bg: "bg-[#232F3E]", fg: "text-[#FF9900]", content: <Wordmark label="aws" className="text-base lowercase" /> },
  "AWS Skill Builder": { bg: "bg-[#232F3E]", fg: "text-[#FF9900]", content: <Wordmark label="aws" className="text-base lowercase" /> },
  Microsoft: { bg: "bg-white", fg: "", content: <MicrosoftIcon className={ICON} /> },
  "Microsoft Learn": { bg: "bg-white", fg: "", content: <MicrosoftIcon className={ICON} /> },
  "Google Cloud": { bg: "bg-white", fg: "", content: <GoogleDotsIcon className={ICON} /> },
  "The Linux Foundation / CNCF": { bg: "bg-[#326CE5]", fg: "text-white", content: <KubernetesIcon className={ICON} /> },
  "Kubernetes.io": { bg: "bg-[#326CE5]", fg: "text-white", content: <KubernetesIcon className={ICON} /> },
  HashiCorp: { bg: "bg-[#5C4EE5]", fg: "text-white", content: <TerraformIcon className={ICON} /> },
  CompTIA: { bg: "bg-[#C8102E]", fg: "text-white", content: <Wordmark label="A+" className="text-lg" /> },
  ISC2: { bg: "bg-[#00558C]", fg: "text-white", content: <Wordmark label="CC" className="text-lg" /> },
  Cisco: { bg: "bg-[#1BA0D7]", fg: "text-white", content: <CiscoIcon className="h-5 w-6" /> },
  GitHub: { bg: "bg-[#181717]", fg: "text-white", content: <GithubMarkIcon className={ICON} /> },
  "GitHub Education": { bg: "bg-[#181717]", fg: "text-white", content: <GithubMarkIcon className={ICON} /> },
  freeCodeCamp: { bg: "bg-[#0A0A23]", fg: "text-[#0BC888]", content: <Wordmark label="fCC" className="text-base" /> },
  Coursera: { bg: "bg-[#0056D2]", fg: "text-white", content: <Wordmark label="C" className="text-xl" /> },
  "Harvard University (edX)": { bg: "bg-[#A51C30]", fg: "text-white", content: <Wordmark label="H" className="text-xl" /> },
  "MDN Web Docs": { bg: "bg-[#1B1B33]", fg: "text-white", content: <Wordmark label="MDN" className="text-xs" /> },
  "Software Freedom Conservancy": { bg: "bg-[#F05133]", fg: "text-white", content: <GitIcon className={ICON} /> },
  Docker: { bg: "bg-[#2496ED]", fg: "text-white", content: <DockerIcon className={ICON} /> },
  "Docker Docs": { bg: "bg-[#2496ED]", fg: "text-white", content: <DockerIcon className={ICON} /> },
  "Postman, Inc.": { bg: "bg-white", fg: "", content: <PostmanIcon className={ICON} /> },
  "Figma, Inc.": { bg: "bg-white", fg: "", content: <FigmaIcon className={ICON} /> },
  "DBeaver Corp": { bg: "bg-[#382923]", fg: "text-[#F39C12]", content: <Wordmark label="DB" className="text-base" /> },
  Warp: { bg: "bg-gradient-to-br from-[#01A4FF] via-[#6E4CF6] to-[#F72585]", fg: "text-white", content: <Wordmark label="W" className="text-xl" /> },
  "roadmap.sh": { bg: "bg-slate-900", fg: "text-white", content: <CompassIcon className={ICON} /> },
  "devhints.io": { bg: "bg-slate-800", fg: "text-white", content: <CodeBracketsIcon className={ICON} /> },
  "PostgreSQL Tutorial": { bg: "bg-[#336791]", fg: "text-white", content: <ElephantIcon className={ICON} /> },

  // Cheat sheets - keyed by their own slug (see `developer-hub-service.ts`)
  // so each shows the real technology's brand rather than a shared
  // generic "devhints.io" tile.
  "git-cheat-sheet": { bg: "bg-[#F05133]", fg: "text-white", content: <GitIcon className={ICON} /> },
  "docker-cheat-sheet": { bg: "bg-[#2496ED]", fg: "text-white", content: <DockerIcon className={ICON} /> },
  "kubectl-cheat-sheet": { bg: "bg-[#326CE5]", fg: "text-white", content: <KubernetesIcon className={ICON} /> },
  "bash-cheat-sheet": { bg: "bg-slate-800", fg: "text-white", content: <CodeBracketsIcon className={ICON} /> },
  "regex-cheat-sheet": { bg: "bg-slate-800", fg: "text-white", content: <CodeBracketsIcon className={ICON} /> },
  "python-cheat-sheet": { bg: "bg-[#FFD43B]", fg: "", content: <PythonIcon className={ICON} /> },
  "postgresql-cheat-sheet": { bg: "bg-[#336791]", fg: "text-white", content: <ElephantIcon className={ICON} /> },

  // GitHub Explorer - keyed by repo full_name so each card shows the project's own brand, not a generic GitHub mark.
  "vercel/next.js": { bg: "bg-black", fg: "text-white", content: <NextjsIcon className={ICON} /> },
  "microsoft/vscode": { bg: "bg-[#007ACC]", fg: "text-white", content: <MicrosoftIcon className="size-5" /> },
  "facebook/react": { bg: "bg-[#20232A]", fg: "text-[#61DAFB]", content: <ReactIcon className={ICON} /> },
  "langchain-ai/langchain": { bg: "bg-[#1C3C3C]", fg: "text-[#3ECF8E]", content: <Wordmark label="LC" className="text-base" /> },
  "vercel/ai": { bg: "bg-black", fg: "text-white", content: <VercelIcon className={ICON} /> },
  "sveltejs/svelte": { bg: "bg-[#FFF0EA]", fg: "", content: <SvelteIcon className={ICON} /> },
  "nodejs/node": { bg: "bg-[#333333]", fg: "text-[#68A063]", content: <NodeIcon className={ICON} /> },
  "tailwindlabs/tailwindcss": { bg: "bg-[#0B1120]", fg: "text-white", content: <TailwindIcon className="h-5 w-6" /> },
  "denoland/deno": { bg: "bg-black", fg: "text-white", content: <Wordmark label="deno" className="text-xs lowercase" /> },
  "oven-sh/bun": { bg: "bg-[#FBF0DF]", fg: "text-[#B91372]", content: <Wordmark label="bun" className="text-sm lowercase" /> },
  "vuejs/vue": { bg: "bg-[#F8F8F8]", fg: "", content: <VueIcon className={ICON} /> },
  "supabase/supabase": { bg: "bg-[#1C1C1C]", fg: "text-[#3ECF8E]", content: <SupabaseIcon className={ICON} /> },
};

/** Neutral, still-branded-feeling fallback for anything not explicitly mapped above (keeps the UI safe if the curated data ever grows). */
function fallbackVisual(label: string): BrandVisual {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
  return { bg: "bg-slate-800", fg: "text-white", content: <Wordmark label={initials || "?"} className="text-base" /> };
}

/** Resolves the best brand visual for a catalog item - by GitHub `full_name` first (repo items), then by `provider`, falling back to a neutral initials tile. */
export function resolveBrandVisual(key: string): BrandVisual {
  return BRAND_VISUALS[key] ?? fallbackVisual(key);
}
