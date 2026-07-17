import type { User } from "@supabase/supabase-js";

/**
 * Single source of truth for "is this user an admin" - `middleware.ts`
 * (edge gate for every `/admin/*` request) and `authorization.ts`
 * (`requireAdminUser`/`getAdminUserOrNull`, the server-side defense-in-
 * depth check) both call this instead of each rolling their own check.
 *
 * Reads Supabase Auth's `app_metadata.role`, never `user_metadata`:
 * `user_metadata` can be updated by the signed-in user themselves via
 * the client SDK (`supabase.auth.updateUser()`), so trusting it here
 * would let any signed-in user grant themselves admin. `app_metadata`
 * can only be written with the service-role key - the only place this
 * app ever does that is the Admin Users Management role-change action
 * (`src/app/api/admin/users/[id]/route.ts`, via
 * `supabase.auth.admin.updateUserById(id, { app_metadata: { role } })`),
 * which itself requires an existing admin to be signed in - so
 * `app_metadata.role` is the only field on a Supabase Auth user this
 * app can safely trust for authorization. See `AdminUserRole` in
 * `services/admin/admin-user-service.ts` for the two valid values.
 */
export function isAdminUser(user: Pick<User, "app_metadata"> | null | undefined): boolean {
  return user?.app_metadata?.role === "admin";
}
