import { z } from "zod";

/**
 * Structural validation for `UserSettings` (see `src/lib/settings.ts`)
 * before it's persisted to Supabase. Kept in sync with that type by
 * hand - there's only one settings shape in the app, so a parallel
 * inferred type (rather than deriving `UserSettings` from this schema,
 * or vice versa) keeps both files independently readable.
 */
export const settingsSchema = z.object({
  darkMode: z.boolean(),
  language: z.string().min(2, "Select a language.").max(10),
  summaryLength: z.enum(["short", "medium", "long"]),
  preferredCategories: z.array(z.string()).max(20, "Too many categories selected."),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    weeklyDigest: z.boolean(),
  }),
  emailPreferences: z.object({
    productUpdates: z.boolean(),
    marketingEmails: z.boolean(),
    accountActivity: z.boolean(),
  }),
  privacy: z.object({
    publicProfile: z.boolean(),
    showReadingActivity: z.boolean(),
  }),
  autoPlayVideos: z.boolean(),
  compactView: z.boolean(),
  openLinksInNewTab: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
