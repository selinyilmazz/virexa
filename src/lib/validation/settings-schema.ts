import { z } from "zod";
import type { TFunction } from "@/i18n/translate";

/**
 * Structural validation for `UserSettings` (see `src/lib/settings.ts`)
 * before it's persisted to Supabase. Kept in sync with that type by
 * hand - there's only one settings shape in the app, so a parallel
 * inferred type (rather than deriving `UserSettings` from this schema,
 * or vice versa) keeps both files independently readable. Built as a
 * function of `t` (rather than a static schema), same pattern as
 * `createProfileSchema`, so the per-field validation messages are
 * localized - called fresh in `SettingsForm`'s submit handler, where `t`
 * is already in scope.
 */
export function createSettingsSchema(t: TFunction) {
  return z.object({
    language: z.string().min(2, t("validation.settings.languageRequired")).max(10),
    timezone: z.string().min(1, t("validation.settings.timezoneRequired")).max(50),
    summaryLength: z.enum(["short", "medium", "long"]),
    preferredCategories: z.array(z.string()).max(20, t("validation.settings.tooManyCategories")),
    theme: z.enum(["light", "dark", "system"]),
    readingWidth: z.enum(["comfortable", "compact"]),
    readingProgressBar: z.boolean(),
    rememberScrollPosition: z.boolean(),
    notifications: z.object({
      email: z.boolean(),
      push: z.boolean(),
      weeklyDigest: z.boolean(),
      breakingNews: z.boolean(),
      developerReleases: z.boolean(),
      securityAlerts: z.boolean(),
      dailyDigest: z.boolean(),
      bookmarkReminders: z.boolean(),
      developerHubUpdates: z.boolean(),
    }),
    emailPreferences: z.object({
      productUpdates: z.boolean(),
      accountActivity: z.boolean(),
    }),
    privacy: z.object({
      profileVisibility: z.enum(["public", "private"]),
      analyticsConsent: z.boolean(),
      personalizedRecommendations: z.boolean(),
      trackSearchHistory: z.boolean(),
      trackReadingHistory: z.boolean(),
    }),
    openLinksInNewTab: z.boolean(),
  });
}

export type SettingsFormValues = z.infer<ReturnType<typeof createSettingsSchema>>;
