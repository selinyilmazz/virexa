"use client";

import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { syncProfileAuthContext } from "@/lib/profile";
import { syncBookmarksAuthContext } from "@/lib/bookmarks";
import { syncSettingsAuthContext } from "@/lib/settings";
import { syncReadingHistoryAuthContext } from "@/lib/reading-history";

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  /**
   * True only while the client hasn't yet heard from Supabase at all
   * (no `initialSession` was provided and `onAuthStateChange` hasn't
   * fired yet). In normal usage this is always `false`, because the
   * root layout resolves the session server-side first - see
   * `initialSession` below.
   */
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
  /**
   * Session resolved server-side (root layout, via
   * `src/lib/supabase/server.ts`) and passed down so the very first
   * client render already reflects the real auth state - this is what
   * prevents the "Sign In -> Profile" flash on page load (see
   * DESIGN.md-equivalent note in the task: no loading flicker in Header).
   */
  initialSession: Session | null;
};

/** Pushes the resolved user into every per-user data store (profile, bookmarks, settings, reading history). */
function syncDataStores(user: User | null) {
  syncProfileAuthContext(user ? { id: user.id, email: user.email, created_at: user.created_at as string | undefined } : null);
  syncBookmarksAuthContext(user?.id ?? null);
  syncSettingsAuthContext(user?.id ?? null);
  syncReadingHistoryAuthContext(user?.id ?? null);
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(initialSession);
  // The server has already resolved the definitive auth state (signed in
  // or signed out) by the time this component ever renders, so there is
  // nothing to "wait for" on mount.
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // `onAuthStateChange` fires immediately with the current session
    // when subscribed to (Supabase's documented behavior), so this one
    // subscription both seeds the data stores on mount from
    // `initialSession` and keeps them in sync on every later sign-in/
    // sign-out - no separate "initial sync" effect needed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
      syncDataStores(nextSession?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, isLoading }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
