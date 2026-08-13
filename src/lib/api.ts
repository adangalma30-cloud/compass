import type { Business } from "../types/business";

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

type BusinessesResponse = {
  businesses: Business[];
  count: number;
  source: "preview" | "live";
  guestLimited: boolean;
  liveDiscoveryConfigured: boolean;
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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Compass could not complete that request.");
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