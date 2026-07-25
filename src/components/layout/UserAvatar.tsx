import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { getAvatarColor, getAvatarUrl, getDisplayName, getInitials, hasRealAvatar } from "@/lib/supabase/utils";

type UserAvatarProps = {
  user: User;
  /** Tailwind size utility, e.g. "size-9" (default, matches the header trigger) or "size-11" (dropdown header, larger). */
  sizeClassName?: string;
  /** Tailwind text-size utility for the initials fallback - should roughly match `sizeClassName`. */
  textClassName?: string;
};

/**
 * User Menu redesign: a real photo when the user actually has one
 * (`user_metadata.avatar_url`, set via OAuth or a future avatar upload),
 * otherwise their initials in a deterministically colored circle -
 * replacing the previous behavior of silently falling back to a generic
 * stock placeholder image (`mockUser.avatar`) that isn't the signed-in
 * person at all. Every avatar shown anywhere in the header now goes
 * through this one component, so the photo/initials decision is made
 * exactly once instead of drifting between call sites.
 */
export function UserAvatar({ user, sizeClassName = "size-9", textClassName = "text-sm" }: UserAvatarProps) {
  const displayName = getDisplayName(user);

  if (hasRealAvatar(user)) {
    return (
      <span className={`relative ${sizeClassName} shrink-0 overflow-hidden rounded-full`}>
        <Image src={getAvatarUrl(user)} alt={displayName} fill unoptimized className="object-cover" />
      </span>
    );
  }

  const { bg, fg } = getAvatarColor(user.id);
  return (
    <span
      aria-hidden="true"
      className={`flex ${sizeClassName} shrink-0 items-center justify-center rounded-full font-bold ${textClassName}`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {getInitials(displayName)}
    </span>
  );
}
