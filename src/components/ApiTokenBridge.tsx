import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { setSessionTokenGetter } from "../lib/api";

/**
 * Connects Clerk's session token to the API client.
 *
 * Rendered once inside `ClerkProvider`. Clerk refreshes the short-lived token
 * automatically, so every API call asks for the current one rather than
 * caching it. Nothing is written to disk by this component.
 */
export default function ApiTokenBridge() {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    setSessionTokenGetter(() => getToken());
    return () => setSessionTokenGetter(async () => null);
  }, [getToken, isLoaded]);

  return null;
}
