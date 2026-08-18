import "dotenv/config";
import cors from "cors";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { databaseConfigured, initDatabase } from "./db";
import router from "./routes";
import { hasPlacesProvider } from "./places";

const app = express();
const port = Number(process.env.PORT ?? 8787);

/**
 * Allowed browser origins.
 *
 * The Android build calls the API from the WebView origin (https://localhost
 * with androidScheme "https") and authenticates with a bearer token rather
 * than a cookie, so that origin plus any configured web origins are permitted.
 * `CORS_ALLOWED_ORIGINS` is a comma-separated list for deployed web clients.
 */
const staticOrigins = new Set(
  [
    "https://localhost",
    "http://localhost",
    "capacitor://localhost",
    "http://localhost:5000",
    ...(process.env.CORS_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ],
);

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (native HTTP clients, curl, health
      // checks) are not browser cross-origin requests and are allowed.
      if (!origin) return callback(null, true);
      if (staticOrigins.has(origin)) return callback(null, true);
      // Reject by omitting the CORS headers rather than throwing, so the
      // browser reports a normal CORS failure instead of a 500.
      return callback(null, false);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "1mb" }));

/**
 * Clerk request authentication.
 *
 * clerkMiddleware() needs BOTH the secret key and the publishable key. Without
 * the publishable key it throws on every request, including public ones, which
 * takes the whole API down rather than just disabling authentication. It is
 * therefore only mounted when both are present, and its own failures are
 * contained so a Clerk outage cannot break guest browsing.
 */
const clerkConfigured = Boolean(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY);
if (clerkConfigured) {
  const clerk = clerkMiddleware();
  app.use((request, response, next) => {
    Promise.resolve(clerk(request, response, next)).catch(() => {
      // Leave the request unauthenticated; protected routes still reject it.
      next();
    });
  });
}

app.use("/api", router);

// Root probe so uptime checks and manual visits get a useful answer.
app.get("/", (_request, response) => {
  response.json({
    service: "compass-api",
    status: "ok",
    databaseConfigured,
    liveDiscoveryConfigured: hasPlacesProvider(),
  });
});

app.use((_request, response) => {
  response.status(404).json({ error: "Route not found", code: "not_found" });
});

/**
 * Final error handler.
 *
 * Without this, a malformed JSON body produces an unhandled body-parser error
 * and an HTML stack trace. Errors are logged server-side and reduced to a
 * generic message so nothing internal reaches the client.
 */
// Express identifies error handlers by arity, so the fourth parameter must
// remain even though it is unused.
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  const status = typeof (error as { status?: number })?.status === "number" ? (error as { status: number }).status : 500;
  if (status >= 500) process.stderr.write(`compass-api: unhandled error: ${String(error)}\n`);
  response.status(status === 400 ? 400 : 500).json(
    status === 400
      ? { error: "That request could not be understood.", code: "bad_request" }
      : { error: "Something went wrong. Please try again.", code: "server_error" },
  );
});

/** Fails fast on missing configuration instead of 401ing every request later. */
function reportConfiguration() {
  const problems: string[] = [];
  if (!process.env.CLERK_SECRET_KEY) {
    problems.push("CLERK_SECRET_KEY is not set: every authenticated request will fail.");
  }
  if (!process.env.CLERK_PUBLISHABLE_KEY) {
    problems.push("CLERK_PUBLISHABLE_KEY is not set: Clerk middleware is disabled, so sign-in, favorites and profile will not work.");
  }
  if (!process.env.DATABASE_URL) {
    problems.push("DATABASE_URL is not set: saved places are unavailable and listings fall back to bundled preview data.");
  }
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    problems.push("GOOGLE_PLACES_API_KEY is not set: live search and nearby discovery stay disabled.");
  }
  if (!process.env.PUBLIC_API_URL) {
    problems.push("PUBLIC_API_URL is not set: place photo URLs will be relative and will not load in the Android app.");
  }
  for (const problem of problems) process.stderr.write(`compass-api: ${problem}\n`);
}

async function start() {
  reportConfiguration();

  // A database problem must not stop the API booting: guest discovery and
  // authentication still work without it, and the server reports the
  // degradation through /api/health.
  try {
    await initDatabase();
  } catch (error) {
    process.stderr.write(`compass-api: database initialisation failed: ${String(error)}\n`);
  }

  app.listen(port, "0.0.0.0", () => {
    process.stdout.write(`compass-api listening on ${port}\n`);
  });
}

void start();
