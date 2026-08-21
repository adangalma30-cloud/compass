import type { Business } from "../types/business";

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

type BusinessesResponse = {
  businesses: Business[];
  count: number;
  source: "preview" | "live";
  guestLimited: boolean;
  liveDiscoveryConfigured: boolean;
  /** Data licence notice that must be displayed alongside live results. */
  attribution?: string;
};

type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    emailVerified: boolean;
  };
  favorites: string[];
};

/**
 * Supplies the current Clerk session token.
 *
 * The Android WebView loads the app from a local origin, so the session cookie
 * Clerk sets for browsers is not sent with API calls. Instead the app attaches
 * a short-lived bearer token that the server verifies on every request. The
 * getter is injected at startup by `ApiTokenBridge` to avoid importing React
 * state into this module.
 */
type TokenGetter = () => Promise<string | null>;

let getSessionToken: TokenGetter = async () => null;

export function setSessionTokenGetter(getter: TokenGetter) {
  getSessionToken = getter;
}

/** Thrown for API failures so callers can react to auth problems specifically. */
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  get isAuthError() {
    return this.status === 401;
  }

  get isVerificationError() {
    return this.status === 403 && this.code === "email_unverified";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  // Attach the session token when one exists. Guest requests stay anonymous.
  const token = await getSessionToken().catch(() => null);
  if (token) headers.Authorization = `Bearer ${token}`;

  // A free-tier host sleeps when idle and can take ~50s to wake. Without a
  // ceiling the request hangs indefinitely and the UI never resolves, so the
  // timeout is generous enough to survive a cold start but still finite.
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60_000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      // Cookies still work in the browser build; the bearer token covers the
      // Android build where cookies are unavailable.
      credentials: "include",
      headers,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError("We couldn't reach Compass. Check your connection.", 0, "network_error");
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; code?: string }
      | null;
    throw new ApiError(
      payload?.error ?? "Compass could not complete that request.",
      response.status,
      payload?.code,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  getBusinesses(params: {
    query?: string;
    category?: string;
    city?: string;
    featured?: boolean;
    nearby?: boolean;
    latitude?: number;
    longitude?: number;
    /** Search radius in metres for nearby discovery. */
    radius?: number;
    limit?: number;
  } = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") search.set(key, String(value));
    }
    return request<BusinessesResponse>(`/api/businesses${search.toString() ? `?${search.toString()}` : ""}`);
  },
  getBusiness(id: string | number) {
    return request<{ business: Business }>(`/api/businesses/${encodeURIComponent(String(id))}`);
  },
  getMe() {
    return request<MeResponse>("/api/me");
  },
  getFavorites() {
    return request<{ favoriteIds: string[] }>("/api/me/favorites").then((response) => response.favoriteIds);
  },
  updateMe(name: string) {
    return request<{ user: MeResponse["user"] }>("/api/me", {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },
  addFavorite(id: string) {
    return request<void>(`/api/me/favorites/${encodeURIComponent(id)}`, { method: "PUT" });
  },
  removeFavorite(id: string) {
    return request<void>(`/api/me/favorites/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};