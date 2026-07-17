"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import { createProfileRepository } from "@/repositories/profile-repository";
import { createUserResourceStore, type ResourceStatus } from "@/lib/cache/resource-store";
import { mockUser } from "@/data/user";
import type { ProfileRow } from "@/types/database";

/**
 * Profile data, backed by the `profiles` table (see
 * `supabase/migrations/0001_production_schema.sql`) via
 * `src/repositories/profile-repository.ts`. `email` and `joinDate` are
 * not columns on `profiles` - they come from the Supabase auth user
 * itself (`user.email` / `user.created_at`), fed in by
 * `syncProfileAuthContext` below, which `AuthProvider` calls whenever
 * the signed-in user changes.
 *
 * The exported surface (`UserProfile`, `getProfile`, `saveProfile`,
 * `resetProfile`, `useProfile`) is unchanged from the previous
 * localStorage-backed version, so no consuming component needed to
 * change its imports.
 */
export type UserProfile = {
  fullName: string;
  username: string;
  email: string;
  bio: string;
  country: string;
  avatar: string;
  joinDate: string;
};

function defaultProfile(): UserProfile {
  return {
    fullName: mockUser.name,
    username: "",
    email: "",
    bio: "",
    country: "",
    avatar: mockUser.avatar,
    joinDate: mockUser.joinDate,
  };
}

const SERVER_PROFILE = defaultProfile();

// Fed in by `syncProfileAuthContext`, called from `AuthProvider` on every
// auth state change - the auth user is the source of truth for these two
// fields, not the `profiles` row.
let authEmail = "";
let authJoinDate = mockUser.joinDate;

function formatJoinDate(iso: string | undefined): string {
  if (!iso) return mockUser.joinDate;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return mockUser.joinDate;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function rowToProfile(row: ProfileRow | null): UserProfile {
  const fallback = defaultProfile();
  return {
    fullName: row?.full_name || fallback.fullName,
    username: row?.username ?? "",
    email: authEmail,
    bio: row?.bio ?? "",
    country: row?.country ?? "",
    avatar: row?.avatar_url || fallback.avatar,
    joinDate: authJoinDate,
  };
}

// Client-only: repositories/Supabase clients are never touched during SSR.
const supabase = typeof window !== "undefined" ? createClient() : null;
const profileRepository = supabase ? createProfileRepository(supabase) : null;

const store = createUserResourceStore<UserProfile>({
  defaultValue: SERVER_PROFILE,
  fetcher: async (userId) => {
    if (!profileRepository) return SERVER_PROFILE;
    const row = await profileRepository.getById(userId);
    return rowToProfile(row);
  },
});

/**
 * Called by `AuthProvider` on every auth state change (sign in, sign
 * out, token refresh). Updates the auth-derived fields and tells the
 * store which user's data to load - signing out clears the cache
 * immediately, signing in fetches that user's real profile (including
 * from a different device/browser).
 */
export function syncProfileAuthContext(user: { id: string; email?: string; created_at?: string } | null) {
  authEmail = user?.email ?? "";
  authJoinDate = formatJoinDate(user?.created_at);
  store.setUser(user?.id ?? null);
}

export function getProfile(): UserProfile {
  return store.getState().data;
}

export function getProfileStatus(): ResourceStatus {
  return store.getState().status;
}

export function getProfileError(): string | null {
  return store.getState().error;
}

export function retryProfile(): Promise<void> {
  return store.retry();
}

/**
 * Optimistically applies `updates` immediately, then persists to
 * Supabase in the background. Throws (after rolling the cache back) if
 * the write fails, so callers that want to show an error toast can
 * `await` this and catch.
 */
export async function saveProfile(updates: Partial<UserProfile>): Promise<void> {
  await store.mutate(
    (current) => ({ ...current, ...updates }),
    async (userId, next) => {
      if (!profileRepository) throw new Error("Supabase is not configured.");
      await profileRepository.upsert(userId, {
        full_name: next.fullName,
        username: next.username,
        bio: next.bio,
        country: next.country,
        avatar_url: next.avatar,
      });
    }
  );
}

/** Resets the local cache to defaults (used by the Danger Zone flow, right before sign-out). */
export function resetProfile() {
  store.setUser(null);
}

function subscribeToProfile(callback: () => void) {
  return store.subscribe(callback);
}

export function useProfile(): UserProfile {
  return useSyncExternalStore(subscribeToProfile, getProfile, () => SERVER_PROFILE);
}

export function useProfileStatus(): ResourceStatus {
  return useSyncExternalStore(subscribeToProfile, getProfileStatus, () => "idle");
}

export function useProfileError(): string | null {
  return useSyncExternalStore(subscribeToProfile, getProfileError, () => null);
}
