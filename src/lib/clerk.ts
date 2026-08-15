import { publishableKeyFromHost } from "@clerk/react/internal";

/**
 * Router base path.
 *
 * The Android build is bundled with Vite's `base: "./"`, which makes
 * `import.meta.env.BASE_URL` a relative value ("./"). Feeding that straight to
 * the router produced URLs like "./sign-in", which never matched a route, so
 * the app appeared to do nothing after a successful sign-in. Only a real
 * absolute sub-path is kept; anything relative collapses to "".
 */
function resolveBasePath(): string {
  const raw = import.meta.env.BASE_URL ?? "/";
  if (!raw.startsWith("/")) return "";
  const trimmed = raw.replace(/\/$/, "");
  return trimmed === "" ? "" : trimmed;
}

export const basePath = resolveBasePath();

/** Absolute in-app route helper, safe for both web and the Android WebView. */
export function appPath(path: string): string {
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}

export const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
export const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
