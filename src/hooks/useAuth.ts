"use client";

import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "@/components/providers/AuthProvider";

/**
 * Reads the current Supabase auth session/user. Every component that
 * needs to know "is someone signed in, and who" should use this instead
 * of talking to Supabase directly - it's the single source of truth for
 * auth state on the client (see `AuthProvider`, mounted once in the root
 * layout, so every Client Component in the app tree already has access).
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
