import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "../lib/authState";

/**
 * Guards routes that require a signed-in user.
 *
 * While Clerk restores a stored session the guard renders a neutral
 * placeholder. Redirecting during that window is what previously bounced
 * already-authenticated users back to the sign-in screen on a cold start.
 */
export default function RequireAuth({
  children,
  requireVerified = false,
}: {
  children: ReactNode;
  /** When true, an unverified account is sent to the verification screen. */
  requireVerified?: boolean;
}) {
  const { isLoaded, isSignedIn, isVerified } = useAuthState();
  const location = useLocation();

  if (!isLoaded) {
    return <div className="min-h-screen animate-pulse bg-[#eef1f7]" />;
  }

  if (!isSignedIn) {
    // Remember where the user was heading so sign-in can return them there.
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  if (requireVerified && !isVerified) {
    return <Navigate to="/verify-email" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
