"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { recordDeveloperHubVisit } from "@/lib/developer-hub/continue-learning";

type TrackedResourceLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  item: { id: string; title: string; provider: string; resourceType: string; brandKey: string };
};

/**
 * Drop-in replacement for the plain outbound `<a target="_blank">` used
 * for a resource's title link in `CatalogCard`/`FeaturedResourceCard`.
 * Renders an identical anchor (same props/children/className, so it has
 * zero visual effect on either card) but also records a real "visit" for
 * the Developer Hub's "Continue Learning" section when the visitor is
 * signed in - see `continue-learning.ts`'s doc comment for why this is a
 * real recently-visited timestamp, never a fabricated progress
 * percentage. No-ops silently for signed-out visitors (nothing to
 * personalize yet), so this is safe to render unconditionally from a
 * Server Component - a Client Component with no server-tainted imports
 * can always be rendered directly from one, per this app's established
 * server/client boundary rules (see `shared.ts`'s doc comment).
 */
export function TrackedResourceLink({ href, children, item, ...anchorProps }: TrackedResourceLinkProps) {
  const { user } = useAuth();

  function handleClick() {
    if (!user) return;
    recordDeveloperHubVisit(user.id, { ...item, url: href });
  }

  return (
    <a href={href} onClick={handleClick} {...anchorProps}>
      {children}
    </a>
  );
}
