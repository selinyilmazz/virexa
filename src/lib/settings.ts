"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { createSettingsRepository } from "@/repositories/settings-repository";
import { createUserResourceStore, type ResourceStatus } from "@/lib/cache/resource-store";
import type { UserSettings } from "@/types/settings";

export type { UserSettings } from "@/types/settings";

/**
 * Settings, backed by the `user_settings` table (see
 * `supabase/migrations/0001_production_schema.sql`) via
 * `src/repositories/settings-repository.ts`. `defaultSettings` mirrors
 * the table's column defaults, used both as the placeholder before the
 * real row has loaded and as the seed for a brand-new account.
 */
export const defaultSettings: UserSettings = {
  darkMode: false,
  language: "en",
  summaryLength: "medium",
  preferredCategories: ["Technology", "AI"],
  notifications: {
    email: true,
    push: false,
    weeklyDigest: true,
  },
  emailPreferences: {
    productUpdates: true,
    marketingEmails: false,
    accountActivity: true,
  },
  privacy: {
    publicProfile: true,
    showReadingActivity: false,
  },
  autoPlayVideos: false,
  compactView: false,
  openLinksInNewTab: true,
};

// Client-only: repositories/Supabase clients are never touched during SSR.
const supabase = typeof window !== "undefined" ? createClient() : null;
const settingsRepository = supabase ? createSettingsRepository(supabase) : null;

const store = createUserResourceStore<UserSettings>({
  defaultValue: defaultSettings,
  fetcher: async (userId) => {
    if (!settingsRepository) return defaultSettings;
    const settings = await settingsRepository.get(userId);
    return settings ?? defaultSettings;
  },
});

/**
 * Called by `AuthProvider` on every auth state change. Signing out
 * resets settings back to the defaults in the cache; signing in loads
 * that user's real saved settings automatically ("Sayfa açıldığında
 * database'den otomatik yüklensin").
 */
export function syncSettingsAuthContext(userId: string | null) {
  store.setUser(userId);
}

export function getSettings(): UserSettings {
  return store.getState().data;
}

export function getSettingsStatus(): ResourceStatus {
  return store.getState().status;
}

export function getSettingsError(): string | null {
  return store.getState().error;
}

export function retrySettings(): Promise<void> {
  return store.retry();
}

/**
 * Optimistically applies the full settings object immediately, then
 * persists it to Supabase in the background. Throws (after rolling the
 * cache back) if the write fails.
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  await store.mutate(
    () => settings,
    async (userId, next) => {
      if (!settingsRepository) throw new Error("Supabase is not configured.");
      await settingsRepository.upsert(userId, next);
    }
  );
}

/** Resets the local cache to defaults (used by the Danger Zone flow, right before sign-out). */
export function resetSettings() {
  store.setUser(null);
}

function subscribeToSettings(callback: () => void) {
  return store.subscribe(callback);
}

export function useSettings(): UserSettings {
  return useSyncExternalStore(subscribeToSettings, getSettings, () => defaultSettings);
}

export function useSettingsStatus(): ResourceStatus {
  return useSyncExternalStore(subscribeToSettings, getSettingsStatus, () => "idle");
}

export function useSettingsError(): string | null {
  return useSyncExternalStore(subscribeToSettings, getSettingsError, () => null);
}
