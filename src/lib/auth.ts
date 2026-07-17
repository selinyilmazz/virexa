import { useSyncExternalStore } from "react";

export type AuthSession = {
  name: string;
  email: string;
  avatar: string;
};

const STORAGE_KEY = "virexa:session";
export const AUTH_EVENT = "virexa:auth-changed";

let cache: AuthSession | null | undefined;

function readFromStorage(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function getCache(): AuthSession | null {
  if (cache === undefined) {
    cache = readFromStorage();
  }
  return cache;
}

function persist(session: AuthSession | null) {
  cache = session;
  if (typeof window !== "undefined") {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

export function getSession(): AuthSession | null {
  return getCache();
}

export function setSession(session: AuthSession) {
  persist(session);
}

export function clearSession() {
  persist(null);
}

export function deriveNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Virexa User";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function subscribeToAuth(callback: () => void) {
  window.addEventListener(AUTH_EVENT, callback);
  return () => window.removeEventListener(AUTH_EVENT, callback);
}

export function useSession(): AuthSession | null {
  return useSyncExternalStore(subscribeToAuth, getSession, () => null);
}
