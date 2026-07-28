import { z } from "zod";
import type { TFunction } from "@/i18n/translate";

/**
 * Validates the editable subset of `UserProfile` (see `src/lib/profile.ts`)
 * before it's sent to Supabase. `email`, `avatar`, and `joinDate` aren't
 * included: email is read-only in the UI, avatar is validated separately
 * by `ProfileAvatarUpload` (file type/size), and joinDate is never
 * user-edited. Built as a function of `t` (rather than a static schema)
 * so the per-field validation messages are localized - called fresh in
 * `ProfileEditForm`'s submit handler, where `t` is already in scope.
 */
export function createProfileSchema(t: TFunction) {
  return z.object({
    fullName: z
      .string()
      .trim()
      .min(1, t("validation.profile.fullNameRequired"))
      .max(80, t("validation.profile.fullNameMax")),
    username: z
      .string()
      .trim()
      .max(32, t("validation.profile.usernameMax"))
      .regex(/^[a-zA-Z0-9_.]*$/, t("validation.profile.usernameFormat")),
    bio: z.string().trim().max(500, t("validation.profile.bioMax")),
    country: z.string().trim().max(56, t("validation.profile.countryMax")),
  });
}

export type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>;
