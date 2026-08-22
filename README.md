# Compass 0.0.6

Compass is a mobile-friendly local business discovery app: Clerk accounts,
verified-email gated features, saved places, and a server-side discovery API,
packaged as an Android APK with Capacitor.

---

## Quick start

```bash
git clone https://github.com/adangalma30-cloud/compass.git
cd compass
git checkout compass-0.0.6

npm run setup      # installs dependencies and creates .env from the template
# edit .env and add your Clerk keys
npm run check      # confirms the setup is valid before you build
```

Then run the app (two terminals):

```bash
npm run server:dev   # API on :8787
npm run dev          # web app on :5000, proxies /api to the server
```

`npm run check` is the fastest way to find a configuration problem. It reports
exactly what is missing and how to fix it, instead of letting the app fail later
with a blank screen.

---

## Configuration

Copy `.env.example` to `.env` and fill it in. `.env` is git-ignored.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | **yes** | Client Clerk key. Without it the app shows "authentication is not configured". |
| `CLERK_SECRET_KEY` | **yes** (server) | Lets the API verify session tokens. |
| `CLERK_PUBLISHABLE_KEY` | **yes** (server) | Clerk's Express middleware needs this alongside the secret key, or every API request fails. |
| `PUBLIC_API_URL` | **yes** (server, deployed) | The API's own public URL, so place-photo links are absolute and load in the APK. |
| `VITE_API_URL` | **yes for Android** | Public HTTPS URL of the API. See the warning below. |
| `DATABASE_URL` | no | PostgreSQL. Without it the API serves bundled preview listings and saved places are unavailable. |
| `OVERPASS_API_URL` | no | Override the Overpass mirror used for nearby discovery. |
| `OSM_USER_AGENT` | no | Identifies the app to OpenStreetMap. A default is provided. |
| `PORT` | no | API port, defaults to `8787`. |

Anything prefixed `VITE_` is compiled into the client bundle and is public.
**Never put a secret in a `VITE_` variable** — `npm run check` fails the build if
you do.

> **`VITE_API_URL` and the APK**
> On a phone, `localhost` means the phone itself. If `VITE_API_URL` is empty or
> points at localhost, every API call in the APK fails and sign-in cannot
> complete. It must be a public HTTPS URL the device can reach.
> `npm run check:android` enforces this.

---

## Building the Android APK

### Requirements

- **Node 20.19+**
- **JDK 21** — Capacitor 7 compiles against Java 21. Android Studio ships a
  suitable JDK under its `jbr/` directory.
- **Android SDK** with `platforms;android-35` and `build-tools;35.0.0`.
  Set `ANDROID_HOME`, or create `android/local.properties`:
  ```
  sdk.dir=/path/to/Android/sdk
  ```

### Build

```bash
npm run check:android    # verifies JDK 21, SDK, and VITE_API_URL first
npm run android:debug    # debug APK
npm run android:release  # unsigned release APK
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

`android:debug` runs the preflight check, builds the web assets, syncs
Capacitor, then runs Gradle. Preflight runs first so a misconfiguration fails in
seconds rather than minutes into a Gradle run.

Other useful commands:

```bash
npm run verify         # lint + web build + server typecheck
npm run android:clean  # clean the Gradle build
npm run android:sync   # rebuild web assets and sync into the Android project
```

### Deploying the backend

The APK cannot work without the API running on a public HTTPS URL. See
[DEPLOYMENT.md](DEPLOYMENT.md) for the Render blueprint (`render.yaml`) and the
container option (`Dockerfile`).

### Building in CI

`adangalma30-cloud/Workflow` builds the APK on GitHub Actions. Run the
**Build Compass APK** workflow and set `compass_ref` to the branch you want
(for example `compass-0.0.6`). The APK is uploaded as the `compass-debug-apk`
artifact.

The workflow needs `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL` as repository
secrets. Without them the APK still builds, but it cannot sign in.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run setup` | Install dependencies and create `.env` from the template. |
| `npm run check` | Preflight the web/dev setup. |
| `npm run check:android` | Also verify JDK 21, Android SDK and `VITE_API_URL`. |
| `npm run dev` | Vite dev server on :5000. |
| `npm run server:dev` | API server with reload on :8787. |
| `npm run build` | Typecheck and build the web assets. |
| `npm run verify` | Lint, build, and typecheck the server. |
| `npm run android:debug` | Preflight, sync, and assemble a debug APK. |
| `node scripts/seed-areas.mjs --list` | Pre-populate the place cache for a city. See DEPLOYMENT.md. |

---

## Architecture notes

- **Auth is Clerk, with one source of truth.** `src/lib/authState.ts` is the only
  place that decides what "signed in" and "verified" mean. Components read it via
  `useAuthState()` rather than calling Clerk hooks directly, so the navbar,
  Home, and Profile can never disagree.
- **The APK authenticates with a bearer token, not a cookie.** The WebView runs
  on a local origin where Clerk's session cookie is not sent, so
  `ApiTokenBridge` attaches the current session token to every API request. The
  server verifies it on each call.
- **`androidScheme: "https"`** in `capacitor.config.ts` gives the WebView a
  secure origin, which is what lets the session persist across app restarts.
- **The server is authoritative.** Protected routes resolve the user from the
  verified token, never from a client-supplied id.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| "Compass authentication is not configured." | `VITE_CLERK_PUBLISHABLE_KEY` missing. Run `npm run check`. |
| Sign-in works in the browser but not the APK | `VITE_API_URL` unset or pointing at localhost. Run `npm run check:android`. |
| Gradle fails with an "invalid source release" or toolchain error | JDK older than 21. Point `JAVA_HOME` at a JDK 21. |
| `SDK location not found` | Set `ANDROID_HOME` or create `android/local.properties`. |
| `./gradlew: Permission denied` | `chmod +x android/gradlew`. |
| Saved places unavailable | No `DATABASE_URL`, or the account's email is unverified. |
