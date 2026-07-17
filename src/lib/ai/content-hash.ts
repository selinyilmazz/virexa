import { createHash } from "crypto";

/**
 * Deterministic fingerprint of an article's title+content, used as the
 * content-identity part of an AI cache key (see `ai-cache.ts`). If an
 * article's text changes, its hash changes, and every cached AI result
 * keyed on the old hash simply stops being looked up - regeneration
 * happens naturally on the next request, no explicit invalidation step
 * needed ("Summary tekrar üretilmesin. Hash değişmedikçe cache
 * kullanılsın.").
 *
 * Uses Node's built-in `crypto` module - no new dependency, and this is
 * server-only code (never imported by a "use client" component).
 */
export function hashArticleContent(title: string, content: string): string {
  return createHash("sha256").update(`${title}\n${content}`).digest("hex").slice(0, 16);
}
