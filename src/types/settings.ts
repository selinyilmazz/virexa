/**
 * Shape of a user's settings row (see `user_settings` in
 * `supabase/migrations/0001_production_schema.sql`), in the camelCase
 * form the UI works with. Lives in its own file so both
 * `src/lib/settings.ts` (the client-facing store) and
 * `src/repositories/settings-repository.ts` (the Supabase data-access
 * layer) can import it without depending on each other.
 */
export type UserSettings = {
  darkMode: boolean;
  language: string;
  summaryLength: "short" | "medium" | "long";
  preferredCategories: string[];
  notifications: {
    email: boolean;
    push: boolean;
    weeklyDigest: boolean;
  };
  emailPreferences: {
    productUpdates: boolean;
    marketingEmails: boolean;
    accountActivity: boolean;
  };
  privacy: {
    publicProfile: boolean;
    showReadingActivity: boolean;
  };
  autoPlayVideos: boolean;
  compactView: boolean;
  openLinksInNewTab: boolean;
};
