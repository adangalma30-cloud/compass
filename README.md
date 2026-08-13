# Compass 0.0.4

Compass is a mobile-friendly local business discovery app with a persistent Clerk account, verified-email gated features, saved places, and a server-side discovery API.

## Development

```bash
npm install
npm run server:dev
# in another terminal
npm run dev
```

The Vite app proxies `/api` requests to the server on port `8787`. The server uses the Replit-provided `PORT` value when it is present.

## Required configuration

Authentication is handled by Clerk. Configure these environment secrets in the workspace:

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

The API uses `DATABASE_URL` when a PostgreSQL database is attached. Without it, development falls back to the bundled preview listings so the guest experience remains usable.

For live search, nearby discovery, and Google place photos, add the server-only secret:

- `GOOGLE_PLACES_API_KEY`

Never add the Google key to a `VITE_*` variable or ship it in the Android bundle. Live discovery is intentionally unavailable until that server secret is configured.

## Validation and Android

```bash
npm run lint
npm run build
npm run typecheck:server
npm run android:debug
```

`android:debug` runs `cap sync`, sets the Android app version to `0.0.4` / version code `4`, and creates a debug-signed APK when the Android SDK is installed. The app requests coarse/fine location only when the user chooses nearby discovery.