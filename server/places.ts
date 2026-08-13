import type { ApiBusiness } from "./db";

type GooglePlace = {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: { location?: { lat?: number; lng?: number } };
  photos?: Array<{ photo_reference: string }>;
  business_status?: string;
};

type GoogleTextSearchResponse = {
  status: string;
  error_message?: string;
  results?: GooglePlace[];
};

function categoryFromTypes(types: string[] = []) {
  if (types.some((type) => type.includes("restaurant") || type.includes("food"))) return "Restaurant";
  if (types.some((type) => type.includes("cafe"))) return "Café";
  if (types.some((type) => type.includes("bar"))) return "Bar";
  if (types.some((type) => type.includes("store") || type.includes("shop"))) return "Retail";
  return "Local business";
}

function photoProxyUrl(photoReference: string) {
  return `/api/place-photo?reference=${encodeURIComponent(photoReference)}`;
}

function placeToBusiness(place: GooglePlace): ApiBusiness {
  const coordinates = place.geometry?.location;
  const category = categoryFromTypes(place.types);
  const imageReference = place.photos?.[0]?.photo_reference;
  return {
    id: `google-${place.place_id}`,
    externalId: place.place_id,
    name: place.name,
    description: `${category} discovered through Compass live search.`,
    rating: place.rating ?? 0,
    reviews: place.user_ratings_total ?? 0,
    city: place.formatted_address?.split(",").slice(-2).join(",").trim() ?? "Nearby",
    category,
    tags: place.types?.slice(0, 3).map((type) => type.replaceAll("_", " ")) ?? [],
    icon: "Compass",
    photo: imageReference ? photoProxyUrl(imageReference) : undefined,
    featured: false,
    address: place.formatted_address,
    latitude: coordinates?.lat,
    longitude: coordinates?.lng,
    gallery: imageReference ? [photoProxyUrl(imageReference)] : [],
    source: "google_places",
  };
}

export function hasPlacesProvider() {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY);
}

export async function searchPlaces(params: {
  query?: string;
  category?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const query = [params.query, params.category, params.city].filter(Boolean).join(" ") || "businesses";
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey);
  if (params.latitude !== undefined && params.longitude !== undefined) {
    url.searchParams.set("location", `${params.latitude},${params.longitude}`);
    url.searchParams.set("radius", String(params.radius ?? 5000));
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Places provider returned ${response.status}`);
  const payload = (await response.json()) as GoogleTextSearchResponse;
  if (payload.status !== "OK" && payload.status !== "ZERO_RESULTS") {
    throw new Error(payload.error_message ?? `Places provider returned ${payload.status}`);
  }
  return (payload.results ?? []).filter((place) => place.business_status !== "CLOSED_PERMANENTLY").map(placeToBusiness);
}

export async function fetchPlacePhoto(reference: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("maxwidth", "1200");
  url.searchParams.set("photo_reference", reference);
  url.searchParams.set("key", apiKey);
  return fetch(url);
}