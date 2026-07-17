/**
 * Turns arbitrary article titles into a URL-safe, lowercase slug.
 * Used to derive a stable `NewsArticle.slug` from provider titles and,
 * combined with the source id, a stable `NewsArticle.id`.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Builds a stable article id from a source id and a title slug. */
export function buildArticleId(sourceId: string, slug: string): string {
  return `${sourceId}:${slug}`;
}

/**
 * Returns a slug guaranteed to be unique against `usedSlugs`, appending
 * `-2`, `-3`, ... when the base slug (or a prior suffixed variant) is
 * already taken. Example: "openai-gpt5", "openai-gpt5-2", "openai-gpt5-3".
 *
 * Mutates `usedSlugs` by adding the slug it returns, so callers can pass
 * the same set through a loop and get a unique slug on every call.
 */
export function makeUniqueSlug(baseSlug: string, usedSlugs: Set<string>): string {
  if (!usedSlugs.has(baseSlug)) {
    usedSlugs.add(baseSlug);
    return baseSlug;
  }

  let suffix = 2;
  let candidate = `${baseSlug}-${suffix}`;
  while (usedSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  usedSlugs.add(candidate);
  return candidate;
}
