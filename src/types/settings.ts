/**
 * Shape of a user's settings row (see `user_settings` in
 * `supabase/migrations/0001_production_schema.sql`, extended by
 * `0015_bookmark_types_and_settings.sql`), in the camelCase form the UI
 * works with. Lives in its own file so both `src/lib/settings.ts` (the
 * client-facing store) and `src/repositories/settings-repository.ts` (the
 * Supabase data-access layer) can import it without depending on each
 * other.
 */
export type UserSettings = {
  language: string;
  /** Not a `user_settings` column - the Settings page's General/Account sections both read and write this via `profiles.country` (`lib/profile.ts`) so there is exactly one stored value, not two that could drift. */
  timezone: string;
  summaryLength: "short" | "medium" | "long";
  preferredCategories: string[];
  /** Saved preference only - Virexa has no dark theme implemented app-wide yet (see `HeaderThemeToggle.tsx`). */
  theme: "light" | "dark" | "system";
  readingWidth: "comfortable" | "compact";
  readingProgressBar: boolean;
  rememberScrollPosition: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    weeklyDigest: boolean;
    breakingNews: boolean;
    developerReleases: boolean;
    securityAlerts: boolean;
    dailyDigest: boolean;
    /** Navigation/Profile/Settings UX update - see migration 0017. */
    bookmarkReminders: boolean;
    developerHubUpdates: boolean;
  };
  emailPreferences: {
    productUpdates: boolean;
    accountActivity: boolean;
  };
  /** Real, saved Privacy category preferences (Navigation/Profile/Settings UX update). */
  privacy: {
    profileVisibility: "public" | "private";
    analyticsConsent: boolean;
    personalizedRecommendations: boolean;
    trackSearchHistory: boolean;
    trackReadingHistory: boolean;
  };
  openLinksInNewTab: boolean;
};
