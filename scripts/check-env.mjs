#!/usr/bin/env node
/**
 * Preflight check for the Compass build.
 *
 * Catches the mistakes that otherwise surface as a confusing failure minutes
 * into a Gradle run, or as an APK that installs but cannot sign in.
 *
 *   node scripts/check-env.mjs            # checks the web/dev setup
 *   node scripts/check-env.mjs --android  # also checks Android build requirements
 */

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const androidMode = process.argv.includes("--android");

const problems = [];
const warnings = [];
const notes = [];

function ok(message) {
  console.log(`  ok       ${message}`);
}
function problem(message, fix) {
  problems.push({ message, fix });
  console.log(`  BLOCKER  ${message}`);
}
function warn(message, fix) {
  warnings.push({ message, fix });
  console.log(`  warning  ${message}`);
}

/** Reads .env without adding a dependency; process env wins. */
function loadEnv() {
  const values = {};
  const envPath = join(root, ".env");
  if (existsSync(envPath)) {
    for (const rawLine of readFileSync(envPath, "utf8").split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      values[key] = value;
    }
  }
  return { ...values, ...process.env };
}

function isPlaceholder(value) {
  return !value || /replace_me|your_|xxx|changeme/i.test(value);
}

console.log("\nCompass preflight\n");

// --- Node version -----------------------------------------------------------
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 20) {
  problem(
    `Node ${process.versions.node} is too old (Vite 8 needs Node 20.19+).`,
    "Install Node 20 LTS or newer: https://nodejs.org",
  );
} else {
  ok(`Node ${process.versions.node}`);
}

// --- Dependencies -----------------------------------------------------------
if (!existsSync(join(root, "node_modules"))) {
  problem("Dependencies are not installed.", "Run: npm ci");
} else {
  ok("Dependencies installed");
}

const env = loadEnv();

if (!existsSync(join(root, ".env"))) {
  warn(
    "No .env file found.",
    "Run: cp .env.example .env   then fill in your Clerk keys.",
  );
}

// --- Authentication ---------------------------------------------------------
if (isPlaceholder(env.VITE_CLERK_PUBLISHABLE_KEY)) {
  problem(
    "VITE_CLERK_PUBLISHABLE_KEY is missing or still a placeholder.",
    "Without it the app shows 'Compass authentication is not configured.' Get it from https://dashboard.clerk.com -> API keys.",
  );
} else if (!/^pk_(test|live)_/.test(env.VITE_CLERK_PUBLISHABLE_KEY)) {
  problem(
    "VITE_CLERK_PUBLISHABLE_KEY does not look like a Clerk key (expected pk_test_ or pk_live_).",
    "Copy the Publishable key, not the Secret key.",
  );
} else {
  ok("Clerk publishable key present");
}

// The API server needs the publishable key too; without it Clerk's middleware
// throws on every request and the whole API returns 500.
if (env.CLERK_SECRET_KEY && !isPlaceholder(env.CLERK_SECRET_KEY) && isPlaceholder(env.CLERK_PUBLISHABLE_KEY)) {
  warn(
    "CLERK_PUBLISHABLE_KEY is not set for the API server.",
    "Clerk's Express middleware needs it alongside CLERK_SECRET_KEY, or every API request fails. Use the same pk_ value as VITE_CLERK_PUBLISHABLE_KEY.",
  );
}

if (isPlaceholder(env.CLERK_SECRET_KEY)) {
  warn(
    "CLERK_SECRET_KEY is missing (needed by the API server to verify sign-ins).",
    "Set it before running: npm run server:dev",
  );
} else if (!/^sk_(test|live)_/.test(env.CLERK_SECRET_KEY)) {
  problem("CLERK_SECRET_KEY does not look like a Clerk secret key (expected sk_...).", "Check you did not paste the publishable key.");
} else {
  ok("Clerk secret key present");
}

// A secret leaking into the client bundle is a real security problem.
for (const key of Object.keys(env)) {
  if (key.startsWith("VITE_") && /SECRET|API_KEY|PASSWORD|DATABASE_URL/i.test(key) && env[key]) {
    problem(
      `${key} exposes a server secret to the client bundle.`,
      "Remove the VITE_ prefix. Anything VITE_ prefixed ships inside the APK.",
    );
  }
}

// --- Optional services ------------------------------------------------------
if (!env.DATABASE_URL) {
  notes.push("No DATABASE_URL: the API serves bundled preview listings and saved places are unavailable.");
}
// Discovery uses OpenStreetMap (Nominatim + Overpass), which need no API key.

// --- Android-specific -------------------------------------------------------
if (androidMode) {
  console.log("\nAndroid build requirements\n");

  // The APK cannot reach the developer's machine via localhost.
  const apiUrl = env.VITE_API_URL ?? "";
  if (!apiUrl) {
    problem(
      "VITE_API_URL is not set, so the APK has no API to call.",
      "Set it to a public HTTPS URL the phone can reach. Sign-in cannot work without it.",
    );
  } else if (/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(apiUrl)) {
    problem(
      `VITE_API_URL points at ${apiUrl}, which on a phone means the phone itself.`,
      "Use a public HTTPS URL (or your machine's LAN IP for local testing).",
    );
  } else if (apiUrl.startsWith("http://")) {
    warn(
      "VITE_API_URL uses http://. Android blocks cleartext traffic by default.",
      "Use https:// for the API.",
    );
  } else {
    ok(`VITE_API_URL = ${apiUrl}`);
  }

  // Capacitor 7 compiles against Java 21, so the JDK must be 21 or newer.
  const javaHome = env.JAVA_HOME;
  const javaBin = javaHome ? join(javaHome, "bin", "java") : "java";
  // `java -version` writes to stderr, so both streams are inspected.
  const javaRun = spawnSync(javaBin, ["-version"], { encoding: "utf8" });
  const javaVersion = `${javaRun.stderr ?? ""}${javaRun.stdout ?? ""}`;
  const match = javaVersion.match(/version "(\d+)/);
  const javaMajor = match ? Number(match[1]) : 0;
  if (!javaMajor) {
    problem(
      "No Java runtime found.",
      "Install JDK 21 (Temurin 21, or the JDK bundled with Android Studio) and set JAVA_HOME.",
    );
  } else if (javaMajor < 21) {
    problem(
      `Java ${javaMajor} found, but Capacitor 7 compiles against Java 21.`,
      "Install JDK 21 and point JAVA_HOME at it. Android Studio ships a suitable JDK under its jbr/ directory.",
    );
  } else {
    ok(`Java ${javaMajor}`);
  }

  // The Android SDK location.
  const localProps = join(root, "android", "local.properties");
  const sdkEnv = env.ANDROID_HOME || env.ANDROID_SDK_ROOT;
  if (!sdkEnv && !existsSync(localProps)) {
    problem(
      "Android SDK not found (no ANDROID_HOME and no android/local.properties).",
      "Install the SDK via Android Studio, then set ANDROID_HOME or create android/local.properties with sdk.dir=/path/to/Android/sdk",
    );
  } else {
    ok(`Android SDK ${sdkEnv ? `at ${sdkEnv}` : "configured via android/local.properties"}`);
  }
}

// --- Summary ----------------------------------------------------------------
if (notes.length) {
  console.log("\nOptional features not configured:");
  for (const note of notes) console.log(`  - ${note}`);
}

if (warnings.length) {
  console.log("\nWarnings:");
  for (const { message, fix } of warnings) console.log(`  - ${message}\n      ${fix}`);
}

if (problems.length) {
  console.log(`\n${problems.length} blocker(s) must be fixed:\n`);
  for (const { message, fix } of problems) console.log(`  - ${message}\n      ${fix}`);
  console.log("");
  process.exit(1);
}

console.log("\nAll checks passed.\n");
