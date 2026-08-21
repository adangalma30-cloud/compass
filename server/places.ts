import type { ApiBusiness } from "./db";

/**
 * Real place discovery backed by OpenStreetMap.
 *
 * Two upstream services are used because they solve different problems:
 *
 *   - Nominatim  — free-text search ("coffee in Nairobi"). It is a geocoder,
 *                  so it is good at resolving names and places but must not be
 *                  used to enumerate POIs in an area.
 *   - Overpass   — "what is around this coordinate", which is exactly what the
 *                  nearby feature needs and what Nominatim forbids.
 *
 * Neither requires an API key, so nothing secret ships in the APK. Both are
 * donated infrastructure with strict usage policies, so this module:
 *   - sends an identifying User-Agent (required by Nominatim)
 *   - serialises Nominatim calls to at most one per second (required)
 *   - caches responses so repeat queries do not hit upstream
 *   - applies request timeouts so a slow provider cannot hang the API
 *
 * Attribution ("© OpenStreetMap contributors") is required wherever results
 * are displayed and is returned to the client with every response.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
/**
 * Overpass mirrors, tried in order.
 *
 * The main instance is heavily loaded and periodically refuses traffic from
 * shared hosting ranges, so relying on one endpoint makes nearby discovery
 * fail for reasons unrelated to the app. OVERPASS_API_URL, when set, is tried
 * first.
 */
const OVERPASS_URLS = [
  process.env.OVERPASS_API_URL,
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
].filter((url): url is string => Boolean(url));

/** Nominatim requires a genuine identifying User-Agent; stock ones are refused. */
const USER_AGENT =
  process.env.OSM_USER_AGENT ??
  "CompassApp/0.0.6 (local business discovery; +https://github.com/adangalma30-cloud/compass)";

export const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

const NOMINATIM_MIN_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20_000;

/** Raised when an upstream provider fails, so routes can answer 502 rather than 500. */
export class PlacesProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlacesProviderError";
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

type CacheEntry = { expires: number; value: ApiBusiness[] };
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): ApiBusiness[] | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(key: string, value: ApiBusiness[]) {
  // Bounded so a long-running instance cannot grow without limit.
  if (cache.size > 500) cache.clear();
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
}

/** Serialises Nominatim requests to honour its one-request-per-second limit. */
let nominatimChain: Promise<unknown> = Promise.resolve();
function throttleNominatim<T>(task: () => Promise<T>): Promise<T> {
  const run = nominatimChain.then(async () => {
    const result = await task();
    await new Promise((resolve) => setTimeout(resolve, NOMINATIM_MIN_INTERVAL_MS));
    return result;
  });
  // Keep the chain alive even when a task rejects.
  nominatimChain = run.catch(() => undefined);
  return run;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...init.headers },
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      throw new PlacesProviderError("Place search timed out.");
    }
    // Log the underlying cause: a DNS/TLS/egress failure on the host looks
    // identical to a provider outage from the client's side otherwise.
    const cause = (error as { cause?: unknown })?.cause;
    process.stderr.write(
      `compass-api: upstream request to ${url} failed: ${String(error)}${cause ? ` | cause: ${String(cause)}` : ""}\n`,
    );
    throw new PlacesProviderError("Place search is unavailable.");
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Tag interpretation
// ---------------------------------------------------------------------------

type OsmTags = Record<string, string | undefined>;

/**
 * Maps OpenStreetMap tags onto the categories Compass already displays, so the
 * existing filter chips keep working against real data.
 */
function categoryFromTags(tags: OsmTags): string {
  const amenity = tags.amenity ?? "";
  const shop = tags.shop ?? "";
  const tourism = tags.tourism ?? "";
  const leisure = tags.leisure ?? "";

  if (amenity === "restaurant" || amenity === "fast_food" || amenity === "food_court") return "Restaurant";
  if (amenity === "cafe" || amenity === "ice_cream") return "Café";
  if (amenity === "bar" || amenity === "pub" || amenity === "biergarten" || amenity === "nightclub") return "Bar";
  if (amenity === "bank" || amenity === "atm" || amenity === "bureau_de_change") return "Finance";
  if (amenity === "pharmacy" || amenity === "hospital" || amenity === "clinic" || amenity === "doctors") return "Health";
  if (amenity === "fuel" || amenity === "charging_station") return "Fuel";
  if (tourism === "hotel" || tourism === "guest_house" || tourism === "hostel") return "Hotel";
  if (tourism === "museum" || tourism === "gallery" || tourism === "attraction") return "Culture";
  if (leisure === "fitness_centre" || leisure === "sports_centre") return "Fitness";
  if (shop === "books") return "Retail";
  if (shop) return "Retail";
  if (amenity) return "Local business";
  return "Local business";
}

/** Human-readable single-line address from OSM's separate address tags. */
function addressFromTags(tags: OsmTags): string | undefined {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:suburb"],
    tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"],
    tags["addr:postcode"],
    tags["addr:country"],
  ].filter((part) => Boolean(part && part.trim()));
  return parts.length ? parts.join(", ") : undefined;
}

function cityFromTags(tags: OsmTags): string | undefined {
  return tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"] ?? tags["addr:suburb"];
}

/** Normalises the several tags OSM uses for a website. */
function websiteFromTags(tags: OsmTags): string | undefined {
  const raw = tags.website ?? tags["contact:website"] ?? tags.url;
  if (!raw) return undefined;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function phoneFromTags(tags: OsmTags): string | undefined {
  return tags.phone ?? tags["contact:phone"] ?? tags["contact:mobile"];
}

/** Converts an OSM `opening_hours` string into the shape the detail page renders. */
function hoursFromTags(tags: OsmTags) {
  const raw = tags.opening_hours;
  if (!raw) return undefined;
  if (raw === "24/7") return [{ days: "Every day", time: "Open 24 hours" }];
  return raw
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .slice(0, 7)
    .map((rule) => {
      const match = rule.match(/^(\S+)\s+(.*)$/);
      return match ? { days: match[1], time: match[2] } : { days: rule, time: "" };
    });
}

/** Descriptive tag chips, derived from the most meaningful OSM values. */
function tagsFromOsm(tags: OsmTags): string[] {
  const candidates = [tags.cuisine, tags.shop, tags.amenity, tags.tourism, tags.leisure, tags.brand];
  const flattened = candidates
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(";"))
    .map((value) => value.replaceAll("_", " ").trim())
    .filter(Boolean);
  return Array.from(new Set(flattened)).slice(0, 3);
}

function describe(name: string, category: string, city?: string): string {
  return city
    ? `${category} in ${city}, from OpenStreetMap.`
    : `${category} discovered through Compass, from OpenStreetMap.`;
}

// ---------------------------------------------------------------------------
// Overpass — nearby discovery
// ---------------------------------------------------------------------------

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: OsmTags;
};

/** Great-circle distance in metres, used to sort results by proximity. */
function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function elementToBusiness(element: OverpassElement, origin?: { lat: number; lon: number }): ApiBusiness | undefined {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  // Unnamed features (benches, bins, driveways) are noise for a discovery app.
  if (!name) return undefined;

  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  const category = categoryFromTags(tags);
  const city = cityFromTags(tags);
  const distance = origin && lat !== undefined && lon !== undefined
    ? distanceMetres(origin.lat, origin.lon, lat, lon)
    : undefined;

  return {
    id: `osm-${element.type}-${element.id}`,
    externalId: `${element.type}/${element.id}`,
    name,
    description: distance !== undefined
      ? `${category} · ${distance < 1000 ? `${Math.round(distance)} m away` : `${(distance / 1000).toFixed(1)} km away`}`
      : describe(name, category, city),
    // OSM carries no ratings; 0 tells the UI there is no score to show rather
    // than inventing one.
    rating: 0,
    reviews: 0,
    city: city ?? "Nearby",
    category,
    tags: tagsFromOsm(tags),
    icon: "Compass",
    featured: false,
    address: addressFromTags(tags),
    phone: phoneFromTags(tags),
    website: websiteFromTags(tags),
    hours: hoursFromTags(tags),
    latitude: lat,
    longitude: lon,
    gallery: [],
    source: "openstreetmap",
  };
}

/** POI categories worth surfacing; keeps the Overpass query bounded and fast. */
const NEARBY_FILTER =
  '["name"]["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|bakery|pharmacy|bank|hospital|clinic|doctors|fuel|marketplace|cinema|library|nightclub)$"]';
const NEARBY_SHOP_FILTER = '["name"]["shop"]';
const NEARBY_TOURISM_FILTER = '["name"]["tourism"~"^(hotel|guest_house|hostel|museum|gallery|attraction)$"]';

export async function nearbyPlaces(params: {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
}): Promise<ApiBusiness[]> {
  const radius = Math.min(Math.max(params.radius ?? 2000, 100), 10_000);
  const limit = Math.min(Math.max(params.limit ?? 40, 1), 100);
  // Coordinates are rounded for the cache key so small GPS jitter still hits
  // the same entry, which keeps load off the shared Overpass instance.
  const key = `nearby:${params.latitude.toFixed(3)}:${params.longitude.toFixed(3)}:${radius}`;
  const cached = cacheGet(key);
  if (cached) return cached.slice(0, limit);

  const around = `(around:${radius},${params.latitude},${params.longitude})`;
  const query = `[out:json][timeout:15];(nwr${around}${NEARBY_FILTER};nwr${around}${NEARBY_SHOP_FILTER};nwr${around}${NEARBY_TOURISM_FILTER};);out center tags ${limit * 3};`;

  // Try each mirror in turn so one refusing traffic does not break the feature.
  let payload: { elements?: OverpassElement[] } | undefined;
  let lastError: unknown;
  for (const endpoint of OVERPASS_URLS) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: query }).toString(),
      });
      if (response.status === 429 || response.status === 504 || response.status >= 500) {
        lastError = new PlacesProviderError(`Mirror ${endpoint} returned ${response.status}.`);
        continue;
      }
      if (!response.ok) {
        lastError = new PlacesProviderError(`Nearby discovery failed (${response.status}).`);
        continue;
      }
      payload = (await response.json()) as { elements?: OverpassElement[] };
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!payload) {
    process.stderr.write(`compass-api: all Overpass mirrors failed: ${String(lastError)}\n`);
    throw new PlacesProviderError("Nearby discovery is busy right now. Please try again shortly.");
  }
  const origin = { lat: params.latitude, lon: params.longitude };
  const businesses = (payload.elements ?? [])
    .map((element) => elementToBusiness(element, origin))
    .filter((business): business is ApiBusiness => Boolean(business))
    .sort((a, b) => {
      const da = a.latitude !== undefined && a.longitude !== undefined
        ? distanceMetres(origin.lat, origin.lon, a.latitude, a.longitude) : Number.MAX_SAFE_INTEGER;
      const db = b.latitude !== undefined && b.longitude !== undefined
        ? distanceMetres(origin.lat, origin.lon, b.latitude, b.longitude) : Number.MAX_SAFE_INTEGER;
      return da - db;
    });

  // De-duplicate: OSM often maps the same business as both a node and a way.
  const seen = new Set<string>();
  const unique = businesses.filter((business) => {
    const fingerprint = `${business.name.toLowerCase()}|${business.category}`;
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });

  cacheSet(key, unique);
  return unique.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Nominatim — text search
// ---------------------------------------------------------------------------

type NominatimResult = {
  osm_type?: string;
  osm_id?: number;
  place_id?: number;
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  category?: string;
  type?: string;
  address?: OsmTags;
  extratags?: OsmTags;
  boundingbox?: string[];
};

function nominatimToBusiness(result: NominatimResult): ApiBusiness | undefined {
  const tags: OsmTags = { ...(result.extratags ?? {}) };
  // Nominatim reports the primary classification outside `extratags`, so it is
  // folded in to reuse the same category mapping as Overpass.
  if (result.category && result.type) tags[result.category] = result.type;

  const name = result.name?.trim() || result.display_name?.split(",")[0]?.trim();
  if (!name) return undefined;

  const address = result.address ?? {};
  const city = address.city ?? address.town ?? address.village ?? address.suburb ?? address.county;
  const category = categoryFromTags(tags);
  const osmType = result.osm_type ?? "node";
  const osmId = result.osm_id ?? result.place_id ?? 0;

  return {
    id: `osm-${osmType}-${osmId}`,
    externalId: `${osmType}/${osmId}`,
    name,
    description: describe(name, category, city),
    rating: 0,
    reviews: 0,
    city: city ?? "Unknown",
    category,
    tags: tagsFromOsm(tags),
    icon: "Compass",
    featured: false,
    address: result.display_name,
    phone: phoneFromTags(tags),
    website: websiteFromTags(tags),
    hours: hoursFromTags(tags),
    latitude: result.lat ? Number(result.lat) : undefined,
    longitude: result.lon ? Number(result.lon) : undefined,
    gallery: [],
    source: "openstreetmap",
  };
}

export async function searchPlaces(params: {
  query?: string;
  category?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit?: number;
}): Promise<ApiBusiness[]> {
  const terms = [params.query, params.category === "All" ? undefined : params.category, params.city]
    .filter((term) => Boolean(term && term.trim()))
    .join(" ")
    .trim();

  // With no text but a location, "nearby" is the correct behaviour.
  if (!terms) {
    if (params.latitude !== undefined && params.longitude !== undefined) {
      return nearbyPlaces({
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius,
        limit: params.limit,
      });
    }
    return [];
  }

  const limit = Math.min(Math.max(params.limit ?? 25, 1), 50);
  const key = `search:${terms.toLowerCase()}:${params.latitude?.toFixed(2) ?? ""}:${params.longitude?.toFixed(2) ?? ""}:${limit}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", terms);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("limit", String(limit));
  // Bias results towards the user without hard-limiting them to the viewbox.
  if (params.latitude !== undefined && params.longitude !== undefined) {
    const span = 0.35;
    url.searchParams.set(
      "viewbox",
      [
        params.longitude - span,
        params.latitude + span,
        params.longitude + span,
        params.latitude - span,
      ].join(","),
    );
  }

  const response = await throttleNominatim(() => fetchWithTimeout(url.toString()));

  if (response.status === 429) {
    throw new PlacesProviderError("Search is busy right now. Please try again shortly.");
  }
  if (!response.ok) {
    throw new PlacesProviderError(`Search failed (${response.status}).`);
  }

  const payload = (await response.json()) as NominatimResult[];
  const businesses = (Array.isArray(payload) ? payload : [])
    .map(nominatimToBusiness)
    .filter((business): business is ApiBusiness => Boolean(business));

  cacheSet(key, businesses);
  return businesses;
}

/**
 * Discovery needs no API key, so it is always available. Kept as a function so
 * routes and /api/health continue to report capability the same way.
 */
export function hasPlacesProvider() {
  return true;
}
