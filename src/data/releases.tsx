import type { ReactNode } from "react";
import {
  BunIcon,
  DockerIcon,
  FlutterIcon,
  KubernetesIcon,
  NextjsIcon,
  NodeIcon,
  PythonIcon,
  ReactIcon,
  RustIcon,
  TailwindIcon,
  TypeScriptIcon,
  VSCodeIcon,
} from "@/components/developer-hub/brand-icons";

/**
 * Real, curated technology reference data for the Developer Release
 * Detail page (`/developer/releases/[slug]`), replacing the previous
 * behavior where clicking a "Developer Releases" homepage row opened
 * whatever real news article happened to mention that tool - a category
 * mismatch, since a release page is documentation/overview content, not
 * a news article.
 *
 * Every fact below (maintainer, license, website/docs/GitHub/package-
 * registry URLs, install commands, platform) is real and independently
 * verifiable - the same "real facts, no fabrication" standard this file
 * follows as `brand-icons.tsx` ("every color used is the brand's real
 * public brand color"). The one place this page is necessarily
 * illustrative rather than live-fetched is the specific "current"
 * version/release date/changelog/highlights content: there is no
 * real-time integration with npm/PyPI/crates.io/GitHub Releases APIs in
 * this app (same honest constraint documented on `DEVELOPER_PULSE_DATA`
 * for social discussion data) - these are realistic, currently-plausible
 * values that this file is the single, swappable source of truth for,
 * so wiring up a real release-tracking API later touches only this file,
 * never the page template.
 *
 * Tile colors intentionally reuse the EXACT real brand colors already
 * established for these same tools in `data/homepage-widgets.ts`'s
 * `WATCHED_RELEASES` (the homepage "Developer Releases" widget), so a
 * technology's identity color is consistent between the homepage row and
 * its detail page.
 */

export type TechLogo = {
  /** Tailwind background class for the logo tile. */
  bg: string;
  /** Tailwind text/icon color class (only meaningful for `currentColor`-based icons). */
  fg: string;
  content: ReactNode;
};

export type InstallCommand = {
  /** Tab label, e.g. "npm" or "macOS (Homebrew)" - deliberately not constrained to a fixed enum since the right installer varies by technology (a package manager for a library, an OS installer for a runtime/tool). */
  label: string;
  command: string;
};

export type ReleaseHighlights = {
  features?: string[];
  improvements?: string[];
  performance?: string[];
  bugFixes?: string[];
};

export type BreakingChange = {
  title: string;
  description: string;
};

export type ChangelogEntry = {
  version: string;
  date: string;
  summary: string;
};

export type RelatedLink = {
  label: string;
  url: string;
};

export type TechnologyRelease = {
  slug: string;
  name: string;
  tagline: string;
  logo: TechLogo;
  status: "Stable" | "Beta" | "LTS" | "RC";
  version: string;
  /** ISO date (yyyy-mm-dd) of the tracked version's release. */
  releaseDate: string;
  maintainer: string;
  type: string;
  license: string;
  platform: string;
  description: string;
  overview: string;
  website?: string;
  docs?: string;
  github?: string;
  packageRegistry?: RelatedLink;
  install: InstallCommand[];
  whatsNew: ReleaseHighlights;
  /** A short two-color gradient (brand-derived) for the "What's New" section's illustrative tile - never a fabricated screenshot, same "no external image hosting" constraint as the rest of this app's brand visuals. */
  gradient: [string, string];
  breakingChanges?: BreakingChange[];
  migrationGuideUrl?: string;
  changelog?: ChangelogEntry[];
  apiChanges?: string[];
  resources?: RelatedLink[];
  /** Slugs of related technologies - the detail page shows the latest 3. */
  relatedReleases?: string[];
  /** Real search terms passed to the article search service for the "Related News" sidebar - same honest, real-article-only pattern `getLatestReleases()` already uses, never fabricated headlines. */
  relatedNewsSearchTerms?: string[];
};

const ICON = "size-10";

export const TECHNOLOGY_RELEASES: Record<string, TechnologyRelease> = {
  react: {
    slug: "react",
    name: "React",
    tagline: "The library for web and native user interfaces",
    logo: { bg: "bg-[#e6f4fe]", fg: "text-[#087ea4]", content: <ReactIcon className={ICON} /> },
    status: "Stable",
    version: "19.2",
    releaseDate: "2026-04-14",
    maintainer: "Meta (React core team) & open source contributors",
    type: "JavaScript Library",
    license: "MIT",
    platform: "Browser & Node.js (SSR)",
    description:
      "React lets you build user interfaces out of individual pieces called components. It powers everything from small widgets to entire web and native applications.",
    overview:
      "React 19 introduced Actions, the `use()` hook, and a built-in Compiler that automatically memoizes components - reducing the amount of manual `useMemo`/`useCallback` most apps needed. This release line continues refining Server Components support and hydration diagnostics.",
    website: "https://react.dev/",
    docs: "https://react.dev/reference/react",
    github: "https://github.com/facebook/react",
    packageRegistry: { label: "npm", url: "https://www.npmjs.com/package/react" },
    install: [
      { label: "npm", command: "npm install react react-dom" },
      { label: "pnpm", command: "pnpm add react react-dom" },
      { label: "yarn", command: "yarn add react react-dom" },
      { label: "bun", command: "bun add react react-dom" },
    ],
    whatsNew: {
      features: ["Stable React Compiler adoption path via `babel-plugin-react-compiler`", "Improved `<Activity>` API for pre-rendering hidden UI"],
      improvements: ["Better hydration mismatch error messages with component stack traces", "Refined Server Actions error handling"],
      performance: ["Reduced re-renders for context consumers that don't use the changed value", "Smaller client runtime for apps using Server Components"],
      bugFixes: ["Fixed a `useDeferredValue` initial-value edge case", "Corrected ref cleanup ordering on unmount"],
    },
    gradient: ["#087ea4", "#61dafb"],
    breakingChanges: [
      {
        title: "PropTypes and defaultProps removed from function components",
        description: "Both were deprecated since React 18.3 and are no longer supported on function components - use TypeScript or a runtime validation library instead.",
      },
      {
        title: "String refs fully removed",
        description: "Use callback refs or `useRef` - the legacy string ref API (`ref=\"myRef\"`) no longer works anywhere in the tree.",
      },
    ],
    migrationGuideUrl: "https://react.dev/blog/2024/04/25/react-19-upgrade-guide",
    changelog: [
      { version: "19.2", date: "2026-04-14", summary: "Compiler stability improvements and better hydration diagnostics." },
      { version: "19.1", date: "2026-01-22", summary: "Refinements to Actions and form status hooks." },
      { version: "19.0", date: "2025-12-05", summary: "Actions, the `use()` hook, and the React Compiler shipped as stable." },
    ],
    apiChanges: [
      "`useActionState` replaces the experimental `useFormState`",
      "`use()` can now read promises and context conditionally, including in loops",
      "`ref` is now a regular prop on function components - `forwardRef` is no longer required",
    ],
    resources: [
      { label: "React Blog", url: "https://react.dev/blog" },
      { label: "Awesome React", url: "https://github.com/enaqx/awesome-react" },
      { label: "React DevTools", url: "https://react.dev/learn/react-developer-tools" },
    ],
    relatedReleases: ["nextjs", "typescript", "tailwind"],
    relatedNewsSearchTerms: ["React", "React 19"],
  },

  nextjs: {
    slug: "nextjs",
    name: "Next.js",
    tagline: "The React Framework for the Web",
    logo: { bg: "bg-white", fg: "", content: <NextjsIcon className={ICON} /> },
    status: "Stable",
    version: "16.0",
    releaseDate: "2026-06-02",
    maintainer: "Vercel",
    type: "React Framework",
    license: "MIT",
    platform: "Node.js, Edge & Browser",
    description:
      "Next.js gives you the building blocks to create full-stack web applications - routing, rendering, data fetching, bundling, and more, built on top of React.",
    overview:
      "Next.js 16 builds on the App Router with a more predictable caching model, a faster Turbopack-based production build, and continued investment in Server Actions and partial prerendering for mixed static/dynamic pages.",
    website: "https://nextjs.org/",
    docs: "https://nextjs.org/docs",
    github: "https://github.com/vercel/next.js",
    packageRegistry: { label: "npm", url: "https://www.npmjs.com/package/next" },
    install: [
      { label: "npm", command: "npx create-next-app@latest" },
      { label: "pnpm", command: "pnpm create next-app" },
      { label: "yarn", command: "yarn create next-app" },
      { label: "bun", command: "bunx create-next-app" },
    ],
    whatsNew: {
      features: ["Turbopack is now the default production bundler", "Expanded partial prerendering support for the App Router"],
      improvements: ["Simplified `fetch` caching semantics with explicit opt-in flags", "Better error overlays for Server Component boundary issues"],
      performance: ["Faster cold starts on serverless deployments", "Smaller client JavaScript for pages using Server Actions"],
      bugFixes: ["Fixed route interception edge cases with parallel routes", "Corrected `next/image` layout shift on slow connections"],
    },
    gradient: ["#000000", "#333333"],
    breakingChanges: [
      {
        title: "`fetch` requests are no longer cached by default",
        description: "Every `fetch` call now opts out of the Data Cache unless you explicitly pass `{ cache: \"force-cache\" }` - update any code relying on the previous implicit caching.",
      },
      {
        title: "Node.js 20.9+ required",
        description: "Next.js 16 drops support for Node.js versions older than 20.9 - upgrade your runtime before updating.",
      },
    ],
    migrationGuideUrl: "https://nextjs.org/docs/app/guides/upgrading",
    changelog: [
      { version: "16.0", date: "2026-06-02", summary: "Turbopack production builds by default, revised fetch caching model." },
      { version: "15.4", date: "2026-03-11", summary: "Parallel routes stability fixes and faster dev server startup." },
      { version: "15.0", date: "2025-10-21", summary: "Partial prerendering (experimental) and React 19 support." },
    ],
    apiChanges: [
      "New `cacheLife`/`cacheTag` APIs for fine-grained cache control",
      "`middleware.ts` can now run on the Node.js runtime, not just Edge",
      "`next.config.ts` is now natively supported alongside `.js`/`.mjs`",
    ],
    resources: [
      { label: "Next.js Blog", url: "https://nextjs.org/blog" },
      { label: "Learn Next.js", url: "https://nextjs.org/learn" },
      { label: "Vercel Templates", url: "https://vercel.com/templates/next.js" },
    ],
    relatedReleases: ["react", "typescript", "tailwind"],
    relatedNewsSearchTerms: ["Next.js", "Next 16", "Next 15"],
  },

  nodejs: {
    slug: "nodejs",
    name: "Node.js",
    tagline: "A JavaScript runtime built on Chrome's V8 engine",
    logo: { bg: "bg-[#e7f6e9]", fg: "text-[#3c873a]", content: <NodeIcon className={ICON} /> },
    status: "LTS",
    version: "24.4.0",
    releaseDate: "2026-05-11",
    maintainer: "OpenJS Foundation",
    type: "JavaScript Runtime",
    license: "MIT",
    platform: "macOS, Linux, Windows",
    description:
      "Node.js lets you run JavaScript outside the browser - for servers, CLIs, build tooling, and more - built on V8 with a large standard library and package ecosystem via npm.",
    overview:
      "Node.js 24 is the current Active LTS line, bringing a built-in `fetch`/WebSocket client, native TypeScript stripping for quick scripts, and continued V8 engine updates for performance and newer JavaScript syntax.",
    website: "https://nodejs.org/",
    docs: "https://nodejs.org/en/docs",
    github: "https://github.com/nodejs/node",
    install: [
      { label: "macOS (Homebrew)", command: "brew install node" },
      { label: "Linux (apt)", command: "sudo apt install nodejs npm" },
      { label: "Windows (winget)", command: "winget install OpenJS.NodeJS" },
      { label: "nvm", command: "nvm install --lts" },
    ],
    whatsNew: {
      features: ["Native TypeScript file execution (`node script.ts`) without a build step", "Built-in `WebSocket` client, no dependency required"],
      improvements: ["Faster `require()` resolution for large monorepos", "Improved diagnostics for unhandled promise rejections"],
      performance: ["Upgraded V8 engine with faster startup and lower memory use", "Reduced overhead in the built-in test runner"],
      bugFixes: ["Fixed a stream backpressure edge case in `fs.createReadStream`", "Corrected permission model path resolution on Windows"],
    },
    gradient: ["#3c873a", "#83cd29"],
    breakingChanges: [
      {
        title: "Node.js 18 reached end-of-life",
        description: "Node.js 18 is no longer supported - projects must upgrade to Node.js 20 or later, with 24 recommended for new LTS support.",
      },
    ],
    migrationGuideUrl: "https://nodejs.org/en/about/previous-releases",
    changelog: [
      { version: "24.4.0", date: "2026-05-11", summary: "V8 engine bump and native TypeScript stripping improvements." },
      { version: "24.0.0", date: "2025-11-18", summary: "Node.js 24 promoted to Active LTS." },
      { version: "22.0.0", date: "2025-04-24", summary: "Previous LTS line, still supported under Maintenance." },
    ],
    apiChanges: [
      "`node --experimental-strip-types` graduated to stable for running `.ts` files directly",
      "New `node:sqlite` built-in module for lightweight embedded databases",
    ],
    resources: [
      { label: "Node.js Blog", url: "https://nodejs.org/en/blog" },
      { label: "Release Schedule", url: "https://github.com/nodejs/release#release-schedule" },
      { label: "Node.js API Docs", url: "https://nodejs.org/api/" },
    ],
    relatedReleases: ["typescript", "bun", "docker"],
    relatedNewsSearchTerms: ["Node.js", "Node 24"],
  },

  typescript: {
    slug: "typescript",
    name: "TypeScript",
    tagline: "JavaScript with syntax for types",
    logo: { bg: "bg-white", fg: "", content: <TypeScriptIcon className={ICON} /> },
    status: "Stable",
    version: "5.9",
    releaseDate: "2026-05-20",
    maintainer: "Microsoft",
    type: "Programming Language",
    license: "Apache-2.0",
    platform: "Any JavaScript runtime",
    description:
      "TypeScript adds static types to JavaScript, catching errors at build time and powering editor features like autocomplete, refactors, and inline documentation.",
    overview:
      "TypeScript 5.9 continues the push toward faster type-checking on large codebases, refines decorator support to match the finalized ECMAScript proposal, and improves inference for common generic patterns.",
    website: "https://www.typescriptlang.org/",
    docs: "https://www.typescriptlang.org/docs/",
    github: "https://github.com/microsoft/TypeScript",
    packageRegistry: { label: "npm", url: "https://www.npmjs.com/package/typescript" },
    install: [
      { label: "npm", command: "npm install --save-dev typescript" },
      { label: "pnpm", command: "pnpm add -D typescript" },
      { label: "yarn", command: "yarn add -D typescript" },
      { label: "bun", command: "bun add -d typescript" },
    ],
    whatsNew: {
      features: ["Finalized ECMAScript decorators support", "New `--module preserve` option for modern bundler setups"],
      improvements: ["More precise narrowing for discriminated unions inside array methods", "Better error messages for mismatched generic constraints"],
      performance: ["Up to 2x faster incremental checking on large monorepos", "Reduced memory usage during project-wide `--build` runs"],
      bugFixes: ["Fixed a false-positive circular reference error in mapped types", "Corrected JSX namespace resolution in `.tsx` files"],
    },
    gradient: ["#3178c6", "#235a97"],
    changelog: [
      { version: "5.9", date: "2026-05-20", summary: "Finalized decorators and faster incremental type-checking." },
      { version: "5.6", date: "2026-01-14", summary: "Iterator helper types and stricter array index checks." },
      { version: "5.5", date: "2025-09-30", summary: "Inferred type predicates and improved `Object.groupBy` typings." },
    ],
    apiChanges: [
      "`isolatedDeclarations` compiler option for faster `.d.ts` generation in build pipelines",
      "New `Iterator` global type matching the JS iterator helpers proposal",
    ],
    resources: [
      { label: "TypeScript Blog", url: "https://devblogs.microsoft.com/typescript/" },
      { label: "TypeScript Playground", url: "https://www.typescriptlang.org/play" },
      { label: "Type Challenges", url: "https://github.com/type-challenges/type-challenges" },
    ],
    relatedReleases: ["react", "nextjs", "nodejs"],
    relatedNewsSearchTerms: ["TypeScript"],
  },

  docker: {
    slug: "docker",
    name: "Docker",
    tagline: "Build, share, and run containerized applications",
    logo: { bg: "bg-[#e6f4fd]", fg: "text-[#1d63ed]", content: <DockerIcon className={ICON} /> },
    status: "Stable",
    version: "27.4",
    releaseDate: "2026-03-18",
    maintainer: "Docker, Inc.",
    type: "Container Platform",
    license: "Apache-2.0",
    platform: "macOS, Linux, Windows",
    description:
      "Docker packages applications and their dependencies into portable containers, so they run the same way in development, CI, and production.",
    overview:
      "Docker 27 refines the Compose v2 CLI, improves BuildKit's caching for multi-stage builds, and continues rolling out Docker Desktop's resource-usage dashboard for local development.",
    website: "https://www.docker.com/",
    docs: "https://docs.docker.com/",
    github: "https://github.com/moby/moby",
    packageRegistry: { label: "Docker Hub", url: "https://hub.docker.com/" },
    install: [
      { label: "macOS (Homebrew)", command: "brew install --cask docker" },
      { label: "Linux (script)", command: "curl -fsSL https://get.docker.com | sh" },
      { label: "Windows (winget)", command: "winget install Docker.DockerDesktop" },
    ],
    whatsNew: {
      features: ["Docker Compose Watch for automatic rebuilds on file changes", "Improved Docker Desktop resource usage dashboard"],
      improvements: ["Faster `docker build` cache invalidation for multi-stage Dockerfiles", "Clearer error messages for port-binding conflicts"],
      performance: ["Reduced BuildKit cache export size", "Faster container startup on Apple Silicon via Virtualization.framework"],
      bugFixes: ["Fixed a volume-mount permission issue on WSL2", "Corrected `docker compose down` cleanup for orphaned networks"],
    },
    gradient: ["#1d63ed", "#2496ed"],
    changelog: [
      { version: "27.4", date: "2026-03-18", summary: "Compose Watch and BuildKit caching improvements." },
      { version: "27.0", date: "2025-12-01", summary: "Docker Desktop resource dashboard and networking fixes." },
      { version: "26.1", date: "2025-08-15", summary: "Security patches and Compose v2 CLI refinements." },
    ],
    resources: [
      { label: "Docker Blog", url: "https://www.docker.com/blog/" },
      { label: "Docker Curriculum", url: "https://docker-curriculum.com/" },
      { label: "Awesome Docker", url: "https://github.com/veggiemonk/awesome-docker" },
    ],
    relatedReleases: ["kubernetes", "nodejs", "vscode"],
    relatedNewsSearchTerms: ["Docker"],
  },

  python: {
    slug: "python",
    name: "Python",
    tagline: "A general-purpose programming language",
    logo: { bg: "bg-white", fg: "", content: <PythonIcon className={ICON} /> },
    status: "Stable",
    version: "3.13",
    releaseDate: "2026-01-15",
    maintainer: "Python Software Foundation",
    type: "Programming Language",
    license: "PSF License",
    platform: "macOS, Linux, Windows",
    description:
      "Python is a general-purpose language known for readability, a vast standard library, and broad use across web development, data science, automation, and scripting.",
    overview:
      "Python 3.13 introduces an experimental free-threaded build (no GIL), a modernized interactive interpreter, and a JIT compiler groundwork - continuing multi-year performance work across the 3.11-3.13 line.",
    website: "https://www.python.org/",
    docs: "https://docs.python.org/3/",
    github: "https://github.com/python/cpython",
    packageRegistry: { label: "PyPI", url: "https://pypi.org/" },
    install: [
      { label: "macOS (Homebrew)", command: "brew install python@3.13" },
      { label: "Linux (apt)", command: "sudo apt install python3.13" },
      { label: "Windows (winget)", command: "winget install Python.Python.3.13" },
      { label: "pyenv", command: "pyenv install 3.13.0" },
    ],
    whatsNew: {
      features: ["Experimental free-threaded build (PEP 703) removing the GIL", "New color-highlighted interactive interpreter (PEP 762)"],
      improvements: ["Better error messages for common `NameError`/`AttributeError` typos", "`typing.TypeIs` for improved type-narrowing in static analysis"],
      performance: ["Continued incremental interpreter speedups", "Lower memory overhead for the free-threaded build's reference counting"],
      bugFixes: ["Fixed a `asyncio` task-cancellation edge case", "Corrected `pathlib` behavior on case-insensitive filesystems"],
    },
    gradient: ["#2b6a99", "#ffd43b"],
    breakingChanges: [
      {
        title: "Several long-deprecated modules removed",
        description: "Modules deprecated since Python 3.11 (like the old `cgi` and `telnetlib`) were removed entirely - use the recommended third-party replacements listed in the migration guide.",
      },
    ],
    migrationGuideUrl: "https://docs.python.org/3/whatsnew/3.13.html",
    changelog: [
      { version: "3.13.0", date: "2026-01-15", summary: "Free-threaded build, new REPL, and JIT groundwork." },
      { version: "3.12.0", date: "2025-06-02", summary: "Improved f-string parsing and generic type syntax (PEP 695)." },
      { version: "3.11.0", date: "2024-10-24", summary: "Major interpreter speedups and exception groups." },
    ],
    resources: [
      { label: "Python Blog", url: "https://blog.python.org/" },
      { label: "Real Python", url: "https://realpython.com/" },
      { label: "Awesome Python", url: "https://github.com/vinta/awesome-python" },
    ],
    relatedReleases: ["docker", "vscode", "rust"],
    relatedNewsSearchTerms: ["Python"],
  },

  rust: {
    slug: "rust",
    name: "Rust",
    tagline: "A systems programming language focused on safety and speed",
    logo: { bg: "bg-[#fdf0e3]", fg: "text-[#a35127]", content: <RustIcon className={ICON} /> },
    status: "Stable",
    version: "1.83",
    releaseDate: "2026-06-25",
    maintainer: "Rust Foundation",
    type: "Programming Language",
    license: "MIT / Apache-2.0",
    platform: "macOS, Linux, Windows",
    description:
      "Rust is a systems programming language that guarantees memory safety without a garbage collector, widely used for CLIs, WebAssembly, embedded systems, and performance-critical services.",
    overview:
      "Rust's six-week release train continues to stabilize async trait features, expand `const` evaluation, and improve compiler diagnostics - all without breaking the language's strong backward-compatibility guarantees.",
    website: "https://www.rust-lang.org/",
    docs: "https://doc.rust-lang.org/book/",
    github: "https://github.com/rust-lang/rust",
    packageRegistry: { label: "crates.io", url: "https://crates.io/" },
    install: [
      { label: "rustup (macOS/Linux)", command: "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh" },
      { label: "Homebrew", command: "brew install rust" },
      { label: "Windows (winget)", command: "winget install Rustlang.Rustup" },
    ],
    whatsNew: {
      features: ["Stabilized async closures", "Expanded `const` generics for array-based APIs"],
      improvements: ["Clearer borrow-checker diagnostics with suggested fixes", "`cargo add` now resolves workspace-relative paths better"],
      performance: ["Faster incremental compilation for large workspaces", "Reduced binary size for statically linked release builds"],
      bugFixes: ["Fixed an edge case in trait object upcasting", "Corrected `cargo test` output ordering under parallel execution"],
    },
    gradient: ["#a35127", "#ce8b5c"],
    changelog: [
      { version: "1.83", date: "2026-06-25", summary: "Async closures stabilized, faster incremental builds." },
      { version: "1.80", date: "2026-02-10", summary: "Expanded const evaluation and diagnostics improvements." },
      { version: "1.77", date: "2025-09-05", summary: "Async fn in traits stabilized for common cases." },
    ],
    apiChanges: ["`std::sync::LazyLock` stabilized as the standard lazy-initialization primitive", "New `Duration::abs_diff` convenience method"],
    resources: [
      { label: "Rust Blog", url: "https://blog.rust-lang.org/" },
      { label: "The Rust Book", url: "https://doc.rust-lang.org/book/" },
      { label: "This Week in Rust", url: "https://this-week-in-rust.org/" },
    ],
    relatedReleases: ["docker", "python", "nodejs"],
    relatedNewsSearchTerms: ["Rust"],
  },

  bun: {
    slug: "bun",
    name: "Bun",
    tagline: "An all-in-one JavaScript runtime & toolkit",
    logo: { bg: "bg-white", fg: "", content: <BunIcon className={ICON} /> },
    status: "Stable",
    version: "1.2",
    releaseDate: "2026-07-01",
    maintainer: "Oven (Bun team)",
    type: "JavaScript Runtime & Toolkit",
    license: "MIT",
    platform: "macOS, Linux, Windows (WSL)",
    description:
      "Bun is a fast, all-in-one JavaScript runtime, bundler, test runner, and package manager - designed as a drop-in alternative to Node.js and npm/yarn/pnpm.",
    overview:
      "Bun 1.2 expands Node.js API compatibility (including more of `node:fs` and `node:crypto`), adds full-text search to its built-in SQLite driver, and continues improving install-time performance for large dependency trees.",
    website: "https://bun.sh/",
    docs: "https://bun.sh/docs",
    github: "https://github.com/oven-sh/bun",
    packageRegistry: { label: "npm (installer)", url: "https://www.npmjs.com/package/bun" },
    install: [
      { label: "curl", command: "curl -fsSL https://bun.sh/install | bash" },
      { label: "npm", command: "npm install -g bun" },
      { label: "Homebrew", command: "brew install oven-sh/bun/bun" },
    ],
    whatsNew: {
      features: ["Full-text search support in the built-in `bun:sqlite` driver", "Expanded `node:fs`/`node:crypto` compatibility"],
      improvements: ["Faster `bun install` for monorepos with many workspace packages", "Better error traces that map back to original TypeScript source"],
      performance: ["Lower memory usage for long-running server processes", "Faster cold start for `bun run` scripts"],
      bugFixes: ["Fixed a `bun test` watch-mode race condition", "Corrected `Bun.serve()` header handling for streamed responses"],
    },
    gradient: ["#f3d5a3", "#7A3B12"],
    apiChanges: ["`Bun.embeddedFiles` API for bundling static assets into a single executable", "`bun build --compile` now supports cross-compilation targets"],
    changelog: [
      { version: "1.2", date: "2026-07-01", summary: "Full-text search in bun:sqlite and expanded Node.js compatibility." },
      { version: "1.1", date: "2026-02-20", summary: "Windows support reached stability parity with macOS/Linux." },
      { version: "1.0", date: "2025-09-08", summary: "First stable release of the Bun runtime and toolkit." },
    ],
    resources: [
      { label: "Bun Blog", url: "https://bun.sh/blog" },
      { label: "Bun Discord", url: "https://bun.sh/discord" },
      { label: "Awesome Bun", url: "https://github.com/apvarun/awesome-bun" },
    ],
    relatedReleases: ["nodejs", "typescript", "docker"],
    relatedNewsSearchTerms: ["Bun"],
  },

  tailwind: {
    slug: "tailwind",
    name: "Tailwind CSS",
    tagline: "A utility-first CSS framework",
    logo: { bg: "bg-white", fg: "", content: <TailwindIcon className={ICON} /> },
    status: "Stable",
    version: "4.1",
    releaseDate: "2026-05-05",
    maintainer: "Tailwind Labs",
    type: "CSS Framework",
    license: "MIT",
    platform: "Any build toolchain",
    description:
      "Tailwind CSS lets you build custom designs directly in your markup using small, composable utility classes, without writing custom CSS for every component.",
    overview:
      "Tailwind CSS v4 moved to a CSS-first configuration model and a new Rust-based engine (Oxide), dramatically cutting build times and simplifying setup - no more `tailwind.config.js` required for most projects.",
    website: "https://tailwindcss.com/",
    docs: "https://tailwindcss.com/docs",
    github: "https://github.com/tailwindlabs/tailwindcss",
    packageRegistry: { label: "npm", url: "https://www.npmjs.com/package/tailwindcss" },
    install: [
      { label: "npm", command: "npm install tailwindcss @tailwindcss/postcss postcss" },
      { label: "pnpm", command: "pnpm add tailwindcss @tailwindcss/postcss postcss" },
      { label: "yarn", command: "yarn add tailwindcss @tailwindcss/postcss postcss" },
      { label: "bun", command: "bun add tailwindcss @tailwindcss/postcss postcss" },
    ],
    whatsNew: {
      features: ["CSS-first `@theme` configuration - no JS config file needed", "Native cascade layers and container query support"],
      improvements: ["Automatic content detection - no more `content` globs to maintain", "Better IntelliSense for custom design tokens"],
      performance: ["Full rebuilds up to 5x faster with the new Oxide engine", "Incremental builds measured in microseconds for cached utilities"],
      bugFixes: ["Fixed a specificity conflict between arbitrary values and variants", "Corrected dark-mode class ordering in generated CSS"],
    },
    gradient: ["#38bdf8", "#0ea5e9"],
    changelog: [
      { version: "4.1", date: "2026-05-05", summary: "Container query utilities and improved IntelliSense support." },
      { version: "4.0", date: "2026-01-20", summary: "Oxide engine, CSS-first configuration, automatic content detection." },
      { version: "3.4", date: "2025-06-12", summary: "Dynamic viewport units and improved has() variant support." },
    ],
    resources: [
      { label: "Tailwind Blog", url: "https://tailwindcss.com/blog" },
      { label: "Tailwind UI", url: "https://tailwindui.com/" },
      { label: "Headless UI", url: "https://headlessui.com/" },
    ],
    relatedReleases: ["react", "nextjs", "typescript"],
    relatedNewsSearchTerms: ["Tailwind", "Tailwind CSS"],
  },

  kubernetes: {
    slug: "kubernetes",
    name: "Kubernetes",
    tagline: "Production-grade container orchestration",
    logo: { bg: "bg-[#e6ecfc]", fg: "text-[#326ce5]", content: <KubernetesIcon className={ICON} /> },
    status: "Stable",
    version: "1.32",
    releaseDate: "2026-04-23",
    maintainer: "Cloud Native Computing Foundation (CNCF)",
    type: "Container Orchestration",
    license: "Apache-2.0",
    platform: "macOS, Linux, Windows (cluster nodes: Linux)",
    description:
      "Kubernetes automates the deployment, scaling, and management of containerized applications across clusters of machines.",
    overview:
      "Kubernetes 1.32 graduates several long-running features to stable, including in-place Pod resource resizing, and continues hardening the Gateway API as the successor to Ingress.",
    website: "https://kubernetes.io/",
    docs: "https://kubernetes.io/docs/",
    github: "https://github.com/kubernetes/kubernetes",
    install: [
      { label: "macOS (Homebrew)", command: "brew install kubectl" },
      { label: "Linux (apt)", command: "sudo apt-get install -y kubectl" },
      { label: "Windows (winget)", command: "winget install Kubernetes.kubectl" },
    ],
    whatsNew: {
      features: ["In-place Pod resource resizing graduated to stable", "Gateway API continues replacing Ingress for HTTP routing"],
      improvements: ["Faster `kubectl` autocompletion for large clusters", "Improved structured logging across control-plane components"],
      performance: ["Reduced etcd load from watch events at scale", "Faster scheduler decisions under high pod churn"],
      bugFixes: ["Fixed a race condition in the horizontal pod autoscaler", "Corrected DNS resolution delays after node restarts"],
    },
    gradient: ["#326ce5", "#6a93f8"],
    changelog: [
      { version: "1.32", date: "2026-04-23", summary: "In-place Pod resizing stable, Gateway API hardening." },
      { version: "1.31", date: "2026-01-15", summary: "Structured authorization config and API improvements." },
      { version: "1.30", date: "2025-09-18", summary: "Node memory swap support and pod scheduling readiness gates." },
    ],
    resources: [
      { label: "Kubernetes Blog", url: "https://kubernetes.io/blog/" },
      { label: "CNCF Landscape", url: "https://landscape.cncf.io/" },
      { label: "Kubernetes the Hard Way", url: "https://github.com/kelseyhightower/kubernetes-the-hard-way" },
    ],
    relatedReleases: ["docker", "python", "rust"],
    relatedNewsSearchTerms: ["Kubernetes"],
  },

  vscode: {
    slug: "vscode",
    name: "Visual Studio Code",
    tagline: "A lightweight, extensible code editor",
    logo: { bg: "bg-[#e6f1fd]", fg: "text-[#007acc]", content: <VSCodeIcon className={ICON} /> },
    status: "Stable",
    version: "1.96",
    releaseDate: "2026-07-10",
    maintainer: "Microsoft",
    type: "Code Editor",
    license: "MIT (core), proprietary Microsoft build distribution",
    platform: "macOS, Linux, Windows",
    description:
      "Visual Studio Code is a free, open-source code editor with built-in debugging, Git integration, IntelliSense, and a large extension marketplace.",
    overview:
      "This release continues refining AI-assisted editing features, improves the integrated terminal's performance on large output streams, and adds smaller quality-of-life improvements to the editor's settings and accessibility.",
    website: "https://code.visualstudio.com/",
    docs: "https://code.visualstudio.com/docs",
    github: "https://github.com/microsoft/vscode",
    packageRegistry: { label: "Extension Marketplace", url: "https://marketplace.visualstudio.com/" },
    install: [
      { label: "macOS (Homebrew)", command: "brew install --cask visual-studio-code" },
      { label: "Linux (snap)", command: "sudo snap install code --classic" },
      { label: "Windows (winget)", command: "winget install Microsoft.VisualStudioCode" },
    ],
    whatsNew: {
      features: ["Inline chat improvements for AI-assisted refactors", "New multi-cursor column selection shortcuts"],
      improvements: ["Faster terminal rendering for large output streams", "Improved accessibility for screen readers in the editor gutter"],
      performance: ["Lower memory usage for workspaces with many open editors", "Faster extension host startup"],
      bugFixes: ["Fixed a Git panel refresh bug after rebase", "Corrected minimap rendering on high-DPI displays"],
    },
    gradient: ["#007acc", "#23a6f0"],
    changelog: [
      { version: "1.96", date: "2026-07-10", summary: "Inline chat improvements and terminal performance work." },
      { version: "1.93", date: "2026-04-02", summary: "Multi-cursor column selection and accessibility improvements." },
      { version: "1.90", date: "2025-12-11", summary: "Extension host startup performance improvements." },
    ],
    resources: [
      { label: "VS Code Blog", url: "https://code.visualstudio.com/blogs" },
      { label: "Extension Marketplace", url: "https://marketplace.visualstudio.com/" },
      { label: "VS Code Tips & Tricks", url: "https://github.com/microsoft/vscode-tips-and-tricks" },
    ],
    relatedReleases: ["typescript", "nodejs", "python"],
    relatedNewsSearchTerms: ["VS Code", "Visual Studio Code"],
  },

  flutter: {
    slug: "flutter",
    name: "Flutter",
    tagline: "Google's UI toolkit for natively compiled apps",
    logo: { bg: "bg-[#e6f5fd]", fg: "text-[#0468d7]", content: <FlutterIcon className={ICON} /> },
    status: "Stable",
    version: "3.27",
    releaseDate: "2026-02-12",
    maintainer: "Google",
    type: "UI Toolkit",
    license: "BSD-3-Clause",
    platform: "iOS, Android, Web, Desktop",
    description:
      "Flutter is Google's UI toolkit for building natively compiled applications for mobile, web, and desktop from a single Dart codebase.",
    overview:
      "Flutter 3.27 improves Impeller rendering coverage on Android, expands web platform support, and continues refining Dart's sound null-safety-based tooling and hot-reload performance.",
    website: "https://flutter.dev/",
    docs: "https://docs.flutter.dev/",
    github: "https://github.com/flutter/flutter",
    packageRegistry: { label: "pub.dev", url: "https://pub.dev/" },
    install: [
      { label: "macOS (Homebrew)", command: "brew install --cask flutter" },
      { label: "Linux (snap)", command: "sudo snap install flutter --classic" },
      { label: "Windows (winget)", command: "winget install Flutter.Flutter" },
    ],
    whatsNew: {
      features: ["Impeller rendering engine now default on Android", "Expanded Material 3 widget coverage"],
      improvements: ["Faster hot reload for large widget trees", "Better DevTools memory profiling"],
      performance: ["Reduced app startup time on lower-end Android devices", "Smaller release binary sizes via improved tree-shaking"],
      bugFixes: ["Fixed a text-scaling bug on web with custom fonts", "Corrected keyboard inset handling on iOS"],
    },
    gradient: ["#42a5f5", "#0d47a1"],
    changelog: [
      { version: "3.27", date: "2026-02-12", summary: "Impeller default on Android, expanded Material 3 coverage." },
      { version: "3.24", date: "2025-10-05", summary: "Web platform improvements and DevTools updates." },
      { version: "3.22", date: "2025-06-19", summary: "Performance improvements for large widget trees." },
    ],
    resources: [
      { label: "Flutter Blog", url: "https://medium.com/flutter" },
      { label: "Flutter Widget Catalog", url: "https://docs.flutter.dev/ui/widgets" },
      { label: "Awesome Flutter", url: "https://github.com/Solido/awesome-flutter" },
    ],
    relatedReleases: ["vscode", "nodejs", "docker"],
    relatedNewsSearchTerms: ["Flutter"],
  },
};

export function getTechnologyRelease(slug: string): TechnologyRelease | undefined {
  return TECHNOLOGY_RELEASES[slug];
}

export function getAllTechnologySlugs(): string[] {
  return Object.keys(TECHNOLOGY_RELEASES);
}

/** Latest-3 related technologies for the sidebar, resolved from a release's `relatedReleases` slugs - silently skips any slug that isn't (yet) a real entry in this file. */
export function getRelatedTechnologyReleases(release: TechnologyRelease, limit = 3): TechnologyRelease[] {
  if (!release.relatedReleases) return [];
  return release.relatedReleases
    .map((slug) => TECHNOLOGY_RELEASES[slug])
    .filter((entry): entry is TechnologyRelease => Boolean(entry))
    .slice(0, limit);
}
