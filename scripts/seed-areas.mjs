#!/usr/bin/env node
/**
 * Populates the Compass place cache for chosen areas.
 *
 * Nearby discovery reads from PostgreSQL and only tops up from Overpass when an
 * area is uncached or stale. Overpass frequently refuses traffic from shared
 * hosting, so areas can stay thin if the deployed API is the only thing ever
 * asking. This script fills them in from a machine Overpass will talk to.
 *
 * It writes to the same database the API uses, so run it with that
 * DATABASE_URL. Nothing here is required at runtime.
 *
 *   DATABASE_URL="postgres://..." node scripts/seed-areas.mjs nairobi
 *   DATABASE_URL="postgres://..." node scripts/seed-areas.mjs --lat -1.2864 --lon 36.8172
 *   DATABASE_URL="postgres://..." node scripts/seed-areas.mjs --list
 *
 * Safe to re-run: rows are upserted and coverage is refreshed in place.
 */

import { Pool } from "pg";

const OVERPASS_URLS = [
  process.env.OVERPASS_API_URL,
  "https://overpass-api.de/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
].filter(Boolean);

const USER_AGENT =
  process.env.OSM_USER_AGENT ??
  "CompassApp/0.0.6 (local business discovery; +https://github.com/adangalma30-cloud/compass)";

/**
 * Preset areas. Each is a city centre plus the radius to sweep. Large cities
 * are covered by several overlapping points, because one Overpass query over a
 * wide radius is slow and often times out.
 */
const PRESETS = {
  nairobi: {
    label: "Nairobi, Kenya",
    points: [
      { lat: -1.2864, lon: 36.8172, radius: 2500, name: "CBD" },
      { lat: -1.2673, lon: 36.8065, radius: 2500, name: "Westlands" },
      { lat: -1.2996, lon: 36.7820, radius: 2500, name: "Kilimani" },
      { lat: -1.3193, lon: 36.7073, radius: 2500, name: "Karen" },
      { lat: -1.2210, lon: 36.8880, radius: 2500, name: "Roysambu" },
      { lat: -1.3230, lon: 36.8340, radius: 2500, name: "South B/C" },
    ],
  },
  mombasa: {
    label: "Mombasa, Kenya",
    points: [
      { lat: -4.0435, lon: 39.6682, radius: 2500, name: "Island" },
      { lat: -4.0300, lon: 39.7200, radius: 2500, name: "Nyali" },
    ],
  },
  kisumu: {
    label: "Kisumu, Kenya",
    points: [{ lat: -0.0917, lon: 34.7680, radius: 3000, name: "Centre" }],
  },
  nakuru: {
    label: "Nakuru, Kenya",
    points: [{ lat: -0.3031, lon: 36.0800, radius: 3000, name: "Centre" }],
  },
};

const FILTERS = [
  '["name"]["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|bakery|pharmacy|bank|hospital|clinic|doctors|fuel|marketplace|cinema|library|nightclub)$"]',
  '["name"]["shop"]',
  '["name"]["tourism"~"^(hotel|guest_house|hostel|museum|gallery|attraction)$"]',
];

// ---------------------------------------------------------------------------
// Tag interpretation. Mirrors server/places.ts so seeded rows are identical to
// rows the API caches itself.
// ---------------------------------------------------------------------------

function categoryFromTags(tags) {
  const amenity = tags.amenity ?? "";
  const shop = tags.shop ?? "";
  const tourism = tags.tourism ?? "";
  const leisure = tags.leisure ?? "";
  if (["restaurant", "fast_food", "food_court"].includes(amenity)) return "Restaurant";
  if (["cafe", "ice_cream"].includes(amenity)) return "Café";
  if (["bar", "pub", "biergarten", "nightclub"].includes(amenity)) return "Bar";
  if (["bank", "atm", "bureau_de_change"].includes(amenity)) return "Finance";
  if (["pharmacy", "hospital", "clinic", "doctors"].includes(amenity)) return "Health";
  if (["fuel", "charging_station"].includes(amenity)) return "Fuel";
  if (["hotel", "guest_house", "hostel"].includes(tourism)) return "Hotel";
  if (["museum", "gallery", "attraction"].includes(tourism)) return "Culture";
  if (["fitness_centre", "sports_centre"].includes(leisure)) return "Fitness";
  if (shop) return "Retail";
  if (amenity) return "Local business";
  return "Local business";
}

function addressFromTags(tags) {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:suburb"],
    tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"],
    tags["addr:postcode"],
  ].filter((part) => part && part.trim());
  return parts.length ? parts.join(", ") : null;
}

function websiteFromTags(tags) {
  const raw = tags.website ?? tags["contact:website"] ?? tags.url;
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function hoursFromTags(tags) {
  const raw = tags.opening_hours;
  if (!raw) return null;
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

function tagChips(tags) {
  const values = [tags.cuisine, tags.shop, tags.amenity, tags.tourism, tags.leisure, tags.brand]
    .filter(Boolean)
    .flatMap((value) => value.split(";"))
    .map((value) => value.replaceAll("_", " ").trim())
    .filter(Boolean);
  return Array.from(new Set(values)).slice(0, 3);
}

function elementToBusiness(element) {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  if (!name) return null;
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (lat === undefined || lon === undefined) return null;
  const category = categoryFromTags(tags);
  const city = tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"] ?? tags["addr:suburb"] ?? "Nearby";
  return {
    id: `osm-${element.type}-${element.id}`,
    externalId: `${element.type}/${element.id}`,
    name,
    description: city !== "Nearby" ? `${category} in ${city}, from OpenStreetMap.` : `${category}, from OpenStreetMap.`,
    rating: 0,
    reviews: 0,
    city,
    category,
    tags: tagChips(tags),
    icon: "Compass",
    featured: false,
    address: addressFromTags(tags),
    phone: tags.phone ?? tags["contact:phone"] ?? tags["contact:mobile"] ?? null,
    website: websiteFromTags(tags),
    hours: hoursFromTags(tags),
    latitude: lat,
    longitude: lon,
    source: "openstreetmap",
  };
}

// ---------------------------------------------------------------------------

async function fetchArea(lat, lon, radius) {
  const around = `(around:${radius},${lat},${lon})`;
  const query = `[out:json][timeout:60];(${FILTERS.map((f) => `nwr${around}${f};`).join("")});out center tags 800;`;

  let lastError;
  for (const endpoint of OVERPASS_URLS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90_000);
      const response = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ data: query }).toString(),
      }).finally(() => clearTimeout(timer));

      if (!response.ok) {
        lastError = new Error(`${endpoint} returned ${response.status}`);
        continue;
      }
      const payload = await response.json();
      return { elements: payload.elements ?? [], endpoint };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("all Overpass mirrors failed");
}

async function upsert(pool, business) {
  await pool.query(
    `INSERT INTO compass_businesses (
       id, name, description, rating, review_count, city, category, tags, icon,
       image_url, featured, ai_summary, address, phone, website, opening_hours,
       latitude, longitude, gallery, source, external_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       city = EXCLUDED.city,
       category = EXCLUDED.category,
       tags = EXCLUDED.tags,
       address = EXCLUDED.address,
       phone = EXCLUDED.phone,
       website = EXCLUDED.website,
       opening_hours = EXCLUDED.opening_hours,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       source = EXCLUDED.source,
       updated_at = NOW()`,
    [
      business.id, business.name, business.description, business.rating, business.reviews,
      business.city, business.category, business.tags, business.icon, null, false, null,
      business.address, business.phone, business.website,
      business.hours ? JSON.stringify(business.hours) : null,
      business.latitude, business.longitude, [], business.source, business.externalId,
    ],
  );
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    console.log("Available presets:\n");
    for (const [key, preset] of Object.entries(PRESETS)) {
      console.log(`  ${key.padEnd(10)} ${preset.label} (${preset.points.length} area${preset.points.length === 1 ? "" : "s"})`);
    }
    console.log("\nOr: --lat <latitude> --lon <longitude> [--radius 2500]");
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required. Use the External Database URL from Render.");
    process.exit(1);
  }

  let points = [];
  const latIndex = args.indexOf("--lat");
  const lonIndex = args.indexOf("--lon");
  if (latIndex !== -1 && lonIndex !== -1) {
    const radiusIndex = args.indexOf("--radius");
    points = [{
      lat: Number(args[latIndex + 1]),
      lon: Number(args[lonIndex + 1]),
      radius: radiusIndex !== -1 ? Number(args[radiusIndex + 1]) : 2500,
      name: "custom",
    }];
  } else {
    const names = args.filter((arg) => !arg.startsWith("--"));
    const chosen = names.length ? names : ["nairobi"];
    for (const name of chosen) {
      const preset = PRESETS[name.toLowerCase()];
      if (!preset) {
        console.error(`Unknown preset "${name}". Run with --list to see the options.`);
        process.exit(1);
      }
      points.push(...preset.points.map((point) => ({ ...point, name: `${preset.label} - ${point.name}` })));
    }
  }

  // Managed hosts such as Render require TLS for external connections, while a
  // local PostgreSQL almost never offers it. Detect rather than assume, so the
  // script works in both places without a flag.
  const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 3,
  });

  let totalSaved = 0;
  try {
    for (const [index, point] of points.entries()) {
      process.stdout.write(`[${index + 1}/${points.length}] ${point.name} (${point.lat}, ${point.lon}) r=${point.radius}m ... `);
      try {
        const { elements } = await fetchArea(point.lat, point.lon, point.radius);
        const businesses = elements.map(elementToBusiness).filter(Boolean);

        // De-duplicate: OSM often maps one business as both a node and a way.
        const seen = new Set();
        const unique = businesses.filter((business) => {
          const key = `${business.name.toLowerCase()}|${business.category}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        for (const business of unique) {
          try {
            await upsert(pool, business);
          } catch (error) {
            process.stderr.write(`\n    could not save ${business.id}: ${error.message}\n`);
          }
        }

        await pool.query(
          `INSERT INTO compass_coverage (cell, latitude, longitude, radius, place_count, refreshed_at)
           VALUES ($1,$2,$3,$4,$5,NOW())
           ON CONFLICT (cell) DO UPDATE SET
             radius = GREATEST(compass_coverage.radius, EXCLUDED.radius),
             place_count = EXCLUDED.place_count,
             refreshed_at = NOW()`,
          [`${point.lat.toFixed(2)},${point.lon.toFixed(2)}`, point.lat, point.lon, point.radius, unique.length],
        );

        totalSaved += unique.length;
        console.log(`${unique.length} places`);
      } catch (error) {
        console.log(`FAILED (${error.message})`);
      }

      // Be a good citizen towards donated infrastructure.
      if (index < points.length - 1) await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    const totals = await pool.query(
      "SELECT source, COUNT(*)::int AS count FROM compass_businesses GROUP BY source ORDER BY source",
    );
    console.log(`\nSaved ${totalSaved} places this run.`);
    console.log("Database now holds:");
    for (const row of totals.rows) console.log(`  ${row.source}: ${row.count}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
