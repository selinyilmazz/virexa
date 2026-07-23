/**
 * Shared country list - previously defined only inline inside
 * `ProfileEditForm.tsx`; extracted so the Settings redesign's "General"
 * category (which also shows/edits `profiles.country`, per
 * `UserSettings`'s doc comment on why Country appears in two places) can
 * use the exact same options without a second, driftable copy.
 */
export const countryOptions = [
  "Türkiye",
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Canada",
  "Netherlands",
  "Spain",
  "Italy",
  "Other",
];
