import { useSyncExternalStore } from "react";
import { mockUser } from "@/data/user";

export type UserProfile = {
  fullName: string;
  username: string;
  email: string;
  bio: string;
  country: string;
  avatar: string;
  joinDate: string;
};

const STORAGE_KEY = "virexa:profile";
export const PROFILE_EVENT = "virexa:profile-changed";

function defaultProfile(): UserProfile {
  return {
    fullName: mockUser.name,
    username: "selinyilmaz",
    email: mockUser.email,
    bio: "AI and technology enthusiast. Reading everything about the future of software.",
    country: "Türkiye",
    avatar: mockUser.avatar,
    joinDate: mockUser.joinDate,
  };
}

const SERVER_PROFILE = defaultProfile();

let cache: UserProfile | null = null;

function readFromStorage(): UserProfile {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile();
    return { ...defaultProfile(), ...(JSON.parse(raw) as Partial<UserProfile>) };
  } catch {
    return defaultProfile();
  }
}

function getCache(): UserProfile {
  if (cache === null) {
    cache = readFromStorage();
  }
  return cache;
}

function persist(profile: UserProfile) {
  cache = profile;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event(PROFILE_EVENT));
  }
}

export function getProfile(): UserProfile {
  return getCache();
}

export function saveProfile(updates: Partial<UserProfile>) {
  persist({ ...getCache(), ...updates });
}

export function resetProfile() {
  cache = defaultProfile();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(PROFILE_EVENT));
  }
}

function subscribeToProfile(callback: () => void) {
  window.addEventListener(PROFILE_EVENT, callback);
  return () => window.removeEventListener(PROFILE_EVENT, callback);
}

export function useProfile(): UserProfile {
  return useSyncExternalStore(subscribeToProfile, getProfile, () => SERVER_PROFILE);
}
