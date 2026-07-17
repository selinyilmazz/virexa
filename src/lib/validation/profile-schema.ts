import { z } from "zod";

/**
 * Validates the editable subset of `UserProfile` (see `src/lib/profile.ts`)
 * before it's sent to Supabase. `email`, `avatar`, and `joinDate` aren't
 * included: email is read-only in the UI, avatar is validated separately
 * by `ProfileAvatarUpload` (file type/size), and joinDate is never
 * user-edited.
 */
export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required.")
    .max(80, "Full name must be 80 characters or fewer."),
  username: z
    .string()
    .trim()
    .max(32, "Username must be 32 characters or fewer.")
    .regex(/^[a-zA-Z0-9_.]*$/, "Username can only contain letters, numbers, dots and underscores."),
  bio: z.string().trim().max(500, "Bio must be 500 characters or fewer."),
  country: z.string().trim().max(56, "Country name must be 56 characters or fewer."),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
