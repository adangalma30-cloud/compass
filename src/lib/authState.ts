/**
 * Single source of truth for how the rest of Compass reads authentication.
 *
 * Clerk owns the actual session. This module adapts Clerk's hooks into one
 * shape so that no component invents its own notion of "signed in".
 *
 * Components must use `useAuthState()` instead of calling `useAuth()`/
 * `useUser()` directly, so there is exactly one place where the rules for
 * "signed in" and "verified" are defined.
 */

import { useAuth, useUser } from "@clerk/react";

export type AuthStatus = "loading" | "signed-out" | "unverified" | "signed-in";

export type CompassUser = {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
  emailVerified: boolean;
};

export type AuthState = {
  /** False until Clerk has restored any existing session from storage. */
  isLoaded: boolean;
  /** True when a real, provider-validated session exists. */
  isSignedIn: boolean;
  /** True when the signed-in account has a verified email address. */
  isVerified: boolean;
  status: AuthStatus;
  user?: CompassUser;
};

export function useAuthState(): AuthState {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  // Both hooks must settle before the UI can trust the answer, otherwise the
  // navbar briefly renders the signed-out state for an authenticated user.
  const isLoaded = authLoaded && userLoaded;

  if (!isLoaded) {
    return { isLoaded: false, isSignedIn: false, isVerified: false, status: "loading" };
  }

  if (!isSignedIn || !user) {
    return { isLoaded: true, isSignedIn: false, isVerified: false, status: "signed-out" };
  }

  const primaryEmail = user.primaryEmailAddress;
  const emailVerified = primaryEmail?.verification?.status === "verified";

  return {
    isLoaded: true,
    isSignedIn: true,
    isVerified: emailVerified,
    status: emailVerified ? "signed-in" : "unverified",
    user: {
      id: user.id,
      name: user.firstName || user.username || "Compass member",
      email: primaryEmail?.emailAddress ?? "",
      imageUrl: user.imageUrl || undefined,
      emailVerified,
    },
  };
}
