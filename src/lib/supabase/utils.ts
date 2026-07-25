import type { User } from "@supabase/supabase-js";
import { mockUser } from "@/data/user";

/** A small, high-contrast, brand-adjacent palette for initials avatars - deterministically picked per user (see `getAvatarColor`), never random, so the same person always gets the same color across sessions/devices. */
const AVATAR_COLORS: { bg: string; fg: string }[] = [
  { bg: "#e0e7ff", fg: "#4338ca" }, // indigo
  { bg: "#fce7f3", fg: "#be185d" }, // pink
  { bg: "#dcfce7", fg: "#15803d" }, // green
  { bg: "#fef3c7", fg: "#a16207" }, // amber
  { bg: "#e0f2fe", fg: "#0369a1" }, // sky
  { bg: "#fee2e2", fg: "#b91c1c" }, // red
  { bg: "#ede9fe", fg: "#6d28d9" }, // violet
  { bg: "#ccfbf1", fg: "#0f766e" }, // teal
];

/** Turns an email local-part into a readable display name, e.g. "jane.doe" -> "Jane Doe". */
export function deriveNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Virexa User";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Resolves the name to show for a signed-in user: their `full_name`
 * metadata (set at sign-up, or later via `supabase.auth.updateUser`) if
 * present, otherwise a name derived from their email.
 */
export function getDisplayName(user: User): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim().length > 0) {
    return fullName;
  }
  return user.email ? deriveNameFromEmail(user.email) : "Virexa User";
}

/**
 * Resolves the avatar to show for a signed-in user, falling back to the
 * app's default placeholder avatar until real avatar uploads are backed
 * by a database (see DESIGN.md - deferred to the Bookmark/Profile
 * database task).
 */
export function getAvatarUrl(user: User): string {
  const avatarUrl = user.user_metadata?.avatar_url;
  if (typeof avatarUrl === "string" && avatarUrl.trim().length > 0) {
    return avatarUrl;
  }
  return mockUser.avatar;
}

/** `true` only when the user has a real uploaded/OAuth-provided avatar - `false` for the generic mock placeholder `getAvatarUrl()` otherwise falls back to (User Menu redesign: a real user with no photo should show their initials in a colored circle, not a stock stand-in image that isn't actually them). */
export function hasRealAvatar(user: User): boolean {
  const avatarUrl = user.user_metadata?.avatar_url;
  return typeof avatarUrl === "string" && avatarUrl.trim().length > 0;
}

/** "Selin Yılmaz" -> "SY", "Selin" -> "S", "" -> "?" - first letter of the first two words of a display name, uppercased. Used by the initials avatar fallback. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
}

/** Deterministic background/text color pair for an initials avatar, hashed from a stable per-user seed (their id - never their display name, which a user could change and get a jarring color swap for no reason). Same seed always yields the same color, on every device and every session. */
export function getAvatarColor(seed: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}
