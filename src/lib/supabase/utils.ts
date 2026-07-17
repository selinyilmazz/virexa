import type { User } from "@supabase/supabase-js";
import { mockUser } from "@/data/user";

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
