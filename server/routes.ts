import { Router, type Request, type RequestHandler } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import {
  addFavorite,
  databaseConfigured,
  getBusiness,
  getFavorites,
  listBusinesses,
  removeFavorite,
  upsertBusiness,
  upsertUser,
} from "./db";
import { fetchPlacePhoto, hasPlacesProvider, searchPlaces } from "./places";

type RequestWithIdentity = Request & {
  compassIdentity?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    emailVerified: boolean;
  };
};

async function identityForRequest(request: Request) {
  const userId = getAuth(request).userId;
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
      response.status(401).json({ error: "Authentication required", code: "unauthorized" });
      return;
    }
    (request as RequestWithIdentity).compassIdentity = identity;
    await upsertUser(identity);
    next();
  } catch {
    response.status(401).json({ error: "Authentication could not be validated", code: "unauthorized" });
  }
};

const requireVerified: RequestHandler = async (request, response, next) => {
  await requireAuth(request, response, () => {
    const identity = (request as RequestWithIdentity).compassIdentity;
    if (!identity?.emailVerified) {
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

router.get("/health", (_request, response) => {
  response.json({
    ok: true,
    databaseConfigured,
    liveDiscoveryConfigured: hasPlacesProvider(),
  });
});

router.get("/businesses", async (request, response) => {
  try {
    const auth = getAuth(request);
    const authenticated = Boolean(auth.userId);
    const requestedLimit = numberParam(request.query.limit);
    const limit = authenticated ? Math.min(requestedLimit ?? 50, 100) : Math.min(requestedLimit ?? 4, 4);
    const params = {
      query: typeof request.query.query === "string" ? request.query.query : undefined,
      category: typeof request.query.category === "string" ? request.query.category : undefined,
      city: typeof request.query.city === "string" ? request.query.city : undefined,
      featured: request.query.featured === "true",
      limit,
    };

    const liveSearchRequested = Boolean(params.query || request.query.nearby === "true");
    let businesses;
    let source: "preview" | "live" = "preview";
    if (authenticated && liveSearchRequested && hasPlacesProvider()) {
      const live = await searchPlaces({
        query: params.query,
        category: params.category,
        city: params.city,
        latitude: numberParam(request.query.latitude),
        longitude: numberParam(request.query.longitude),
      });
      businesses = live ?? [];
      source = "live";
      for (const business of businesses) await upsertBusiness(business);
    } else {
      businesses = await listBusinesses(params);
    }

    response.json({
      businesses,
      count: businesses.length,
      source,
      guestLimited: !authenticated,
      liveDiscoveryConfigured: hasPlacesProvider(),
    });
  } catch {
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

router.get("/place-photo", async (request, response) => {
  const reference = typeof request.query.reference === "string" ? request.query.reference : "";
  if (!reference) {
    response.status(400).end();
    return;
  }
  try {
    const image = await fetchPlacePhoto(reference);
    if (!image || !image.ok || !image.body) {
      response.status(404).end();
      return;
    }
    response.status(image.status);
    response.setHeader("Cache-Control", "public, max-age=86400");
    response.setHeader("Content-Type", image.headers.get("content-type") ?? "image/jpeg");
    const buffer = Buffer.from(await image.arrayBuffer());
    response.send(buffer);
  } catch {
    response.status(404).end();
  }
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