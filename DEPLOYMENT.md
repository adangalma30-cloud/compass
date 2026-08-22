# Compass backend deployment

The API in `server/` must run on a public HTTPS URL before the APK can search,
save places, or load a profile. On a phone `localhost` means the phone itself,
so the app cannot reach a server on your machine.

This guide uses **Render** because its free tier includes PostgreSQL. A
`Dockerfile` is included if you prefer Fly.io, Cloud Run, Railway or a VPS.

---

## 1. Deploy the API

1. Go to <https://dashboard.render.com> → **New** → **Blueprint**.
2. Connect the `adangalma30-cloud/compass` repository and pick the
   **`compass-0.0.6`** branch.
3. Render reads `render.yaml` and creates:
   - `compass-api` — the Node web service
   - `compass-db` — a PostgreSQL database, with `DATABASE_URL` wired in
     automatically
4. Click **Apply**. The first deploy takes a few minutes.

The database schema is created automatically on first boot, so there is no
migration step.

## 2. Set the environment variables

In Render → `compass-api` → **Environment**, set:

| Variable | Value | Why |
| --- | --- | --- |
| `CLERK_SECRET_KEY` | `sk_test_…` from the Clerk Dashboard | Verifies session tokens. **Secret.** |
| `CLERK_PUBLISHABLE_KEY` | `pk_test_…` (same value the app uses) | **Also required.** Clerk's Express middleware needs both keys; without this every API request fails. |
| `PUBLIC_API_URL` | The service's own URL, e.g. `https://compass-api.onrender.com` | Makes place-photo URLs absolute so images load in the Android WebView. |
| `OVERPASS_API_URL` | Optional | Override the Overpass mirror used for nearby discovery. Discovery works without it. |
| `CORS_ALLOWED_ORIGINS` | e.g. `https://compass.example.com` | Only needed for a deployed **web** build. Android origins are always allowed. |

`DATABASE_URL` is set by the blueprint — do not edit it.

> **Never** give `CLERK_SECRET_KEY` or `DATABASE_URL`
> a `VITE_` prefix. Anything `VITE_` prefixed is compiled into the app bundle
> and is readable by anyone who downloads the APK. `npm run check` fails the
> build if it detects this.

## 3. Confirm the deployment

```bash
curl https://YOUR-SERVICE.onrender.com/api/health
```

Expected:

```json
{
  "ok": true,
  "databaseConfigured": true,
  "databaseReachable": true,
  "authConfigured": true,
  "liveDiscoveryConfigured": true
}
```

Any `false` tells you exactly which variable is missing:

| Field | If false |
| --- | --- |
| `databaseReachable` | `DATABASE_URL` wrong, or the database is still starting. |
| `authConfigured` | `CLERK_SECRET_KEY` **or** `CLERK_PUBLISHABLE_KEY` missing. |
| `liveDiscoveryConfigured` | Always true: OpenStreetMap discovery needs no API key. |

## 4. Point the app at the API

Add the URL as a secret in the **Workflow** repository
(Settings → Secrets and variables → Actions):

```
VITE_API_URL = https://YOUR-SERVICE.onrender.com
```

No trailing slash. Then run the **Build Compass APK** workflow.

---

## Business discovery

Discovery is backed by OpenStreetMap and requires no API key or billing:

- **Nominatim** for text search
- **Overpass** for nearby lookups around a coordinate

Both are donated infrastructure with strict usage policies. The server sends an
identifying `User-Agent`, throttles Nominatim to one request per second, caches
responses for ten minutes, and applies request timeouts. Results carry an
`attribution` field which the app displays, as the ODbL licence requires.

If your traffic grows beyond light use, point `OVERPASS_API_URL` at a mirror or
your own Overpass instance.

## Seeding place coverage

Nearby discovery reads from PostgreSQL and only tops up from Overpass when an
area is uncached or stale. Overpass frequently refuses traffic from shared
hosting, so areas populate slowly if the deployed API is the only thing asking.

Fill them in ahead of time from your own machine:

```bash
# Render dashboard -> compass-db -> Connections -> External Database URL
export DATABASE_URL="postgresql://...external...render.com/compass"

node scripts/seed-areas.mjs --list          # show presets
node scripts/seed-areas.mjs nairobi         # seed a city
node scripts/seed-areas.mjs nairobi mombasa # several at once
node scripts/seed-areas.mjs --lat -1.2864 --lon 36.8172 --radius 2500
```

Use the **External** database URL: the internal one is only reachable from
inside Render. Re-running is safe, since rows are upserted and coverage is
refreshed in place. Seeding Nairobi takes about a minute and adds roughly 2,300
places.

## Free tier caveat

Render's free instances sleep after roughly 15 minutes idle, so the first
request after a pause can take 30+ seconds. The app shows "We couldn't reach
Compass" if that request times out. Upgrade the instance if this matters.

## Deploying elsewhere

The `Dockerfile` builds a self-contained image:

```bash
docker build -t compass-api .
docker run -p 8787:8787 --env-file .env compass-api
```

The server reads `PORT` and binds `0.0.0.0`, so it works on any container host.
You will need a PostgreSQL database separately — Neon and Supabase both have
free tiers that provide a `DATABASE_URL`.
