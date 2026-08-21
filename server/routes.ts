import { Router, type Request, type RequestHandler } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import {
  addFavorite,
  cacheBusinesses,
  coverageFor,
  databaseConfigured,
  databaseReachable,
  nearbyFromCache,
  recordCoverage,
  getBusiness,
  getFavorites,
  listBusinesses,
  removeFavorite,
  upsertUser,
} from "./db";
import {
  OSM_ATTRIBUTION,
  PlacesProviderError,
  hasPlacesProvider,
  nearbyPlaces,
  searchPlaces,
} from "./places";

type RequestWithIdentity = Request & {
  compassIdentity?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    emailVerified: boolean;
  };
};

/**
 * Reads the authenticated user id, if any.
 *
 * getAuth() throws when clerkMiddleware() is not mounted (which happens when
 * the Clerk keys are unset). Public routes must still work in that state, so
 * the failure is treated as "not signed in" rather than propagating.
 */
function currentUserId(request: Request): string | undefined {
  try {
    return getAuth(request).userId ?? undefined;
  } catch {
    return undefined;
  }
}

async function identityForRequest(request: Request) {
  const userId = currentUserId(request);
  if (!userId) return undefined;
  const user = await clerkClient.users.getUser(userId);
  const emailAddress = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  if (!emailAddress) return undefined;
  return {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Compass member",
    email: emailAddress,
    profileImage: user.imageUrl,
    emailVerified: user.primaryEmailAddress?.verification?.status === "verified",
  };
}

const requireAuth: RequestHandler = async (request, response, next) => {
  try {
    const identity = await identityForRequest(request);
    if (!identity) {
      // Distinguishes "no/!valid token" from "token fine, lookup failed", which
      // otherwise look identical from the client.
      const hasHeader = Boolean(request.headers.authorization);
      process.stderr.write(
        `compass-api: auth refused on ${request.method} ${request.originalUrl} (authorization header ${hasHeader ? "present but not accepted" : "absent"})\n`,
      );
      response.status(401).json({ error: "Authentication required", code: "unauthorized" });
      return;
    }
    (request as RequestWithIdentity).compassIdentity = identity;
    await upsertUser(identity);
    next();
  } catch (error) {
    process.stderr.write(
      `compass-api: auth validation failed on ${request.method} ${request.originalUrl}: ${String(error)}\n`,
    );
    response.status(401).json({ error: "Authentication could not be validated", code: "unauthorized" });
  }
};

const requireVerified: RequestHandler = async (request, response, next) => {
  await requireAuth(request, response, () => {
    const identity = (request as RequestWithIdentity).compassIdentity;
    if (!identity?.emailVerified) {
      process.stderr.write(
        `compass-api: rejected ${request.method} ${request.originalUrl} for ${identity?.id ?? "unknown"}: email not verified server-side\n`,
      );
      response.status(403).json({
        error: "Verify your email to unlock this Compass feature.",
        code: "email_unverified",
      });
      return;
    }
    next();
  });
};

function numberParam(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const router = Router();

router.get("/health", async (_request, response) => {
  // Reports real connectivity so a misconfigured deployment is visible from
  // the outside rather than only surfacing as failed favorites later.
  const databaseOk = databaseConfigured ? await databaseReachable() : false;
  response.json({
    ok: true,
    databaseConfigured,
    databaseReachable: databaseOk,
    authConfigured: Boolean(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY),
    liveDiscoveryConfigured: hasPlacesProvider(),
  });
});

/**
 * Minimum number of cached places before an area is considered usable. Below
 * this a top-up is fetched inline, because returning almost nothing would look
 * like the feature is broken.
 */
const MIN_CACHED_NEARBY = 5;

/** Areas currently being refreshed, so concurrent requests trigger one fetch. */
const refreshingCells = new Set<string>();

/**
 * Populates the cache for an area from OpenStreetMap.
 *
 * Failures are logged and swallowed: a refresh is an optimisation, and nearby
 * search must keep working from cache when every upstream mirror is refusing
 * traffic.
 */
async function refreshArea(latitude: number, longitude: number, radius: number): Promise<number> {
  const cell = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  if (refreshingCells.has(cell)) return 0;
  refreshingCells.add(cell);
  try {
    const places = await nearbyPlaces({ latitude, longitude, radius, limit: 100 });
    await cacheBusinesses(places);
    await recordCoverage(latitude, longitude, radius, places.length);
    process.stdout.write(`compass-api: cached ${places.length} places for ${cell}\n`);
    return places.length;
  } catch (error) {
    process.stderr.write(`compass-api: area refresh failed for ${cell}: ${String(error)}\n`);
    return 0;
  } finally {
    refreshingCells.delete(cell);
  }
}

router.get("/businesses", async (request, response) => {
  const authenticated = Boolean(currentUserId(request));
  const requestedLimit = numberParam(request.query.limit);
  const limit = authenticated ? Math.min(requestedLimit ?? 50, 100) : Math.min(requestedLimit ?? 4, 4);
  const latitude = numberParam(request.query.latitude);
  const longitude = numberParam(request.query.longitude);
  const query = typeof request.query.query === "string" ? request.query.query.trim() : "";
  const category = typeof request.query.category === "string" ? request.query.category : undefined;
  const city = typeof request.query.city === "string" ? request.query.city : undefined;
  const nearbyRequested = request.query.nearby === "true" && latitude !== undefined && longitude !== undefined;

  try {
    // ---- Nearby: served from our own PostgreSQL cache -------------------
    //
    // The cache is the primary source. Overpass is consulted only when the
    // area has never been fetched or has gone stale, and a stale-but-usable
    // area is refreshed in the background so the user is never left waiting
    // on donated infrastructure that frequently refuses cloud traffic.
    if (nearbyRequested && !query) {
      const radius = Math.min(Math.max(numberParam(request.query.radius) ?? 2000, 100), 10_000);
      const lat = latitude as number;
      const lon = longitude as number;

      const coverage = await coverageFor(lat, lon);
      let cached = await nearbyFromCache({ latitude: lat, longitude: lon, radius, limit });

      // Whether the area is well stocked must be judged on what the cache
      // actually holds, not on this page of results: the guest limit is 4,
      // which would otherwise make every guest request look like a cache miss
      // and force a blocking upstream fetch.
      const availableNearby = cached.length >= limit
        ? (await nearbyFromCache({ latitude: lat, longitude: lon, radius, limit: MIN_CACHED_NEARBY })).length
        : cached.length;

      // Too little to be useful: fetch now so the first visitor to an area
      // still gets results.
      if (availableNearby < MIN_CACHED_NEARBY && (!coverage.known || !coverage.fresh)) {
        const fetched = await refreshArea(lat, lon, radius);
        if (fetched > 0) {
          cached = await nearbyFromCache({ latitude: lat, longitude: lon, radius, limit });
        }
      } else if (coverage.known && !coverage.fresh) {
        // Usable but stale: answer from cache immediately and refresh after.
        void refreshArea(lat, lon, radius);
      }

      response.json({
        businesses: cached,
        count: cached.length,
        source: "live",
        guestLimited: !authenticated,
        liveDiscoveryConfigured: true,
        attribution: OSM_ATTRIBUTION,
        // Lets the client explain an empty result honestly.
        cacheStatus: cached.length > 0 ? (coverage.fresh ? "fresh" : "refreshing") : "empty",
      });
      return;
    }

    // ---- Text search: goes upstream, then caches -------------------------
    if (query) {
      const businesses = await searchPlaces({ query, category, city, latitude, longitude, limit });
      await cacheBusinesses(businesses.slice(0, limit));

      response.json({
        businesses: businesses.slice(0, limit),
        count: Math.min(businesses.length, limit),
        source: "live",
        guestLimited: !authenticated,
        liveDiscoveryConfigured: true,
        attribution: OSM_ATTRIBUTION,
      });
      return;
    }

    // ---- Default home feed: curated listings from the database -----------
    const businesses = await listBusinesses({
      category,
      city,
      featured: request.query.featured === "true",
      limit,
    });

    response.json({
      businesses,
      count: businesses.length,
      source: "preview",
      guestLimited: !authenticated,
      liveDiscoveryConfigured: true,
      attribution: OSM_ATTRIBUTION,
    });
  } catch (error) {
    process.stderr.write(`compass-api: /businesses failed: ${String(error)}\n`);
    if (error instanceof PlacesProviderError) {
      response.status(502).json({ error: error.message, code: "discovery_unavailable" });
      return;
    }
    response.status(503).json({
      error: "We couldn't load Compass right now.",
      code: "businesses_unavailable",
    });
  }
});

router.get("/businesses/:id", async (request, response) => {
  try {
    const business = await getBusiness(request.params.id);
    if (!business) {
      response.status(404).json({ error: "Business not found", code: "not_found" });
      return;
    }
    response.json({ business });
  } catch {
    response.status(503).json({ error: "We couldn't load this business right now.", code: "business_unavailable" });
  }
});

/**
 * Legacy photo proxy.
 *
 * Discovery is now backed by OpenStreetMap, which does not supply photography,
 * so there is nothing to proxy. The route is kept so photo URLs cached by an
 * earlier build resolve to a clean 404 and the UI falls back to its placeholder
 * rather than hanging or erroring.
 */
router.get("/place-photo", (_request, response) => {
  response.status(404).json({ error: "No photo available.", code: "photo_unavailable" });
});

router.get("/me", requireAuth, async (request, response) => {
  const identity = (request as RequestWithIdentity).compassIdentity;
  response.json({
    user: identity,
    favorites: identity ? await getFavorites(identity.id) : [],
  });
});

router.get("/me/favorites", requireVerified, async (request, response) => {
  const identity = (request as RequestWithIdentity).compassIdentity;
  if (!identity) return;
  response.json({ favoriteIds: await getFavorites(identity.id) });
});

router.put("/me/favorites/:businessId", requireVerified, async (request, response) => {
  const identity = (request as RequestWithIdentity).compassIdentity;
  if (!identity) return;
  const businessId = typeof request.params.businessId === "string" ? request.params.businessId : request.params.businessId[0];
  const business = await getBusiness(businessId);
  if (!business) {
    response.status(404).json({ error: "Business not found", code: "not_found" });
    return;
  }
  if (!databaseConfigured) {
    response.status(503).json({ error: "Favorites are temporarily unavailable.", code: "database_unavailable" });
    return;
  }
  await addFavorite(identity.id, business.id);
  response.status(204).end();
});

router.delete("/me/favorites/:businessId", requireVerified, async (request, response) => {
  const identity = (request as RequestWithIdentity).compassIdentity;
  if (!identity) return;
  if (!databaseConfigured) {
    response.status(503).json({ error: "Favorites are temporarily unavailable.", code: "database_unavailable" });
    return;
  }
  const businessId = typeof request.params.businessId === "string" ? request.params.businessId : request.params.businessId[0];
  await removeFavorite(identity.id, businessId);
  response.status(204).end();
});

router.patch("/me", requireVerified, async (request, response) => {
  const identity = (request as RequestWithIdentity).compassIdentity;
  if (!identity) return;
  const name = typeof request.body?.name === "string" ? request.body.name.trim() : identity.name;
  if (name.length < 2 || name.length > 80) {
    response.status(400).json({ error: "Name must be between 2 and 80 characters.", code: "invalid_name" });
    return;
  }
  const user = await upsertUser({ ...identity, name });
  response.json({ user });
});

export default router;