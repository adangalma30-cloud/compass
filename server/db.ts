import type { PoolClient } from "pg";
import { Pool } from "pg";
import previewBusinesses from "../src/data/businesses";
import type { Business } from "../src/types/business";

export type ApiBusiness = Omit<Business, "id"> & {
  id: string;
  latitude?: number;
  longitude?: number;
  source: "preview" | "google_places";
  externalId?: string;
};

type BusinessRow = {
  id: string;
  name: string;
  description: string;
  rating: number | string;
  review_count: number;
  city: string;
  category: string;
  tags: string[] | null;
  icon: string | null;
  image_url: string | null;
  featured: boolean;
  ai_summary: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: Business["hours"] | null;
  latitude: number | null;
  longitude: number | null;
  gallery: string[] | null;
  source: "preview" | "google_places";
  external_id: string | null;
};

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    })
  : null;

export const databaseConfigured = Boolean(pool);

const schema = `
  CREATE TABLE IF NOT EXISTS compass_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    profile_image TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS compass_businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    rating NUMERIC(2, 1) NOT NULL DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    city TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    icon TEXT,
    image_url TEXT,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    ai_summary TEXT,
    address TEXT,
    phone TEXT,
    website TEXT,
    opening_hours JSONB,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    gallery TEXT[] NOT NULL DEFAULT '{}',
    source TEXT NOT NULL DEFAULT 'preview',
    external_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS compass_favorites (
    user_id TEXT NOT NULL REFERENCES compass_users(id) ON DELETE CASCADE,
    business_id TEXT NOT NULL REFERENCES compass_businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, business_id)
  );

  CREATE INDEX IF NOT EXISTS compass_businesses_category_idx
    ON compass_businesses(category);
  CREATE INDEX IF NOT EXISTS compass_businesses_city_idx
    ON compass_businesses(city);
`;

function previewToApiBusiness(business: Business): ApiBusiness {
  return {
    ...business,
    id: String(business.id),
    source: "preview",
  };
}

function rowToBusiness(row: BusinessRow): ApiBusiness {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    rating: Number(row.rating),
    reviews: row.review_count,
    city: row.city,
    category: row.category,
    tags: row.tags ?? [],
    icon: row.icon ?? "Compass",
    photo: row.image_url ?? undefined,
    featured: row.featured,
    aiSummary: row.ai_summary ?? undefined,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    hours: row.opening_hours ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    gallery: row.gallery ?? [],
    source: row.source,
    externalId: row.external_id ?? undefined,
  };
}

function applyBusinessFilters(
  businesses: ApiBusiness[],
  params: {
    query?: string;
    category?: string;
    city?: string;
    featured?: boolean;
    limit?: number;
  },
) {
  const query = params.query?.trim().toLowerCase();
  return businesses
    .filter((business) => {
      const searchable = [
        business.name,
        business.description,
        business.city,
        business.category,
        ...business.tags,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (!params.category || params.category === "All" || business.category === params.category) &&
        (!params.city || params.city === "All cities" || business.city === params.city) &&
        (!params.featured || Boolean(business.featured))
      );
    })
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.rating - a.rating)
    .slice(0, params.limit ?? 50);
}

export async function initDatabase() {
  if (!pool) return false;
  const client = await pool.connect();
  try {
    await client.query(schema);
    if (process.env.NODE_ENV !== "production" && process.env.COMPASS_SEED_PREVIEW_DATA !== "false") {
      for (const business of previewBusinesses) {
        await seedPreviewBusiness(client, business);
      }
    }
    return true;
  } finally {
    client.release();
  }
}

async function seedPreviewBusiness(client: PoolClient, business: Business) {
  await client.query(
    `INSERT INTO compass_businesses (
       id, name, description, rating, review_count, city, category, tags, icon,
       image_url, featured, ai_summary, address, phone, website, opening_hours, source
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'preview')
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       rating = EXCLUDED.rating,
       review_count = EXCLUDED.review_count,
       city = EXCLUDED.city,
       category = EXCLUDED.category,
       tags = EXCLUDED.tags,
       icon = EXCLUDED.icon,
       image_url = EXCLUDED.image_url,
       featured = EXCLUDED.featured,
       ai_summary = EXCLUDED.ai_summary,
       address = EXCLUDED.address,
       phone = EXCLUDED.phone,
       website = EXCLUDED.website,
       opening_hours = EXCLUDED.opening_hours,
       updated_at = NOW()`,
    [
      String(business.id),
      business.name,
      business.description,
      business.rating,
      business.reviews,
      business.city,
      business.category,
      business.tags,
      business.icon,
      business.photo,
      business.featured ?? false,
      business.aiSummary,
      business.address,
      business.phone,
      business.website,
      JSON.stringify(business.hours ?? []),
    ],
  );
}

export async function listBusinesses(params: {
  query?: string;
  category?: string;
  city?: string;
  featured?: boolean;
  limit?: number;
}) {
  if (!pool) {
    return applyBusinessFilters(
      previewBusinesses.map(previewToApiBusiness),
      params,
    );
  }

  const values: unknown[] = [];
  const where: string[] = [];
  if (params.query?.trim()) {
    values.push(`%${params.query.trim().toLowerCase()}%`);
    where.push(
      `(LOWER(name) LIKE $${values.length} OR LOWER(description) LIKE $${values.length} OR LOWER(city) LIKE $${values.length} OR LOWER(category) LIKE $${values.length} OR EXISTS (SELECT 1 FROM unnest(tags) tag WHERE LOWER(tag) LIKE $${values.length}))`,
    );
  }
  if (params.category && params.category !== "All") {
    values.push(params.category);
    where.push(`category = $${values.length}`);
  }
  if (params.city && params.city !== "All cities") {
    values.push(params.city);
    where.push(`city = $${values.length}`);
  }
  if (params.featured) where.push("featured = TRUE");
  values.push(Math.min(Math.max(params.limit ?? 50, 1), 100));
  const result = await pool.query<BusinessRow>(
    `SELECT id, name, description, rating, review_count, city, category, tags, icon,
            image_url, featured, ai_summary, address, phone, website, opening_hours,
            latitude, longitude, gallery, source, external_id
       FROM compass_businesses
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY featured DESC, rating DESC, review_count DESC
       LIMIT $${values.length}`,
    values,
  );
  return result.rows.map(rowToBusiness);
}

export async function getBusiness(id: string) {
  if (!pool) {
    return previewBusinesses.map(previewToApiBusiness).find((business) => business.id === id);
  }
  const result = await pool.query<BusinessRow>(
    `SELECT id, name, description, rating, review_count, city, category, tags, icon,
            image_url, featured, ai_summary, address, phone, website, opening_hours,
            latitude, longitude, gallery, source, external_id
       FROM compass_businesses WHERE id = $1`,
    [id],
  );
  return result.rows[0] ? rowToBusiness(result.rows[0]) : undefined;
}

export async function upsertBusiness(business: ApiBusiness) {
  if (!pool) return business;
  const result = await pool.query<BusinessRow>(
    `INSERT INTO compass_businesses (
       id, name, description, rating, review_count, city, category, tags, icon,
       image_url, featured, ai_summary, address, phone, website, opening_hours,
       latitude, longitude, gallery, source, external_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       rating = EXCLUDED.rating,
       review_count = EXCLUDED.review_count,
       city = EXCLUDED.city,
       category = EXCLUDED.category,
       tags = EXCLUDED.tags,
       icon = EXCLUDED.icon,
       image_url = EXCLUDED.image_url,
       featured = EXCLUDED.featured,
       ai_summary = EXCLUDED.ai_summary,
       address = EXCLUDED.address,
       phone = EXCLUDED.phone,
       website = EXCLUDED.website,
       opening_hours = EXCLUDED.opening_hours,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       gallery = EXCLUDED.gallery,
       source = EXCLUDED.source,
       external_id = EXCLUDED.external_id,
       updated_at = NOW()
     RETURNING id, name, description, rating, review_count, city, category, tags, icon,
               image_url, featured, ai_summary, address, phone, website, opening_hours,
               latitude, longitude, gallery, source, external_id`,
    [
      business.id,
      business.name,
      business.description,
      business.rating,
      business.reviews,
      business.city,
      business.category,
      business.tags,
      business.icon,
      business.photo,
      business.featured ?? false,
      business.aiSummary,
      business.address,
      business.phone,
      business.website,
      JSON.stringify(business.hours ?? []),
      business.latitude,
      business.longitude,
      business.gallery ?? [],
      business.source,
      business.externalId,
    ],
  );
  return rowToBusiness(result.rows[0]);
}

export async function upsertUser(user: {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  emailVerified: boolean;
}) {
  if (!pool) return user;
  const result = await pool.query(
    `INSERT INTO compass_users (id, name, email, profile_image, email_verified)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       email = EXCLUDED.email,
       profile_image = EXCLUDED.profile_image,
       email_verified = EXCLUDED.email_verified,
       updated_at = NOW()
     RETURNING id, name, email, profile_image AS "profileImage",
               email_verified AS "emailVerified", created_at AS "createdAt",
               updated_at AS "updatedAt"`,
    [user.id, user.name, user.email, user.profileImage, user.emailVerified],
  );
  return result.rows[0];
}

export async function getFavorites(userId: string) {
  if (!pool) return [];
  const result = await pool.query<{ business_id: string }>(
    `SELECT business_id FROM compass_favorites
     WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows.map((row) => row.business_id);
}

export async function addFavorite(userId: string, businessId: string) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO compass_favorites (user_id, business_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, business_id) DO NOTHING`,
    [userId, businessId],
  );
}

export async function removeFavorite(userId: string, businessId: string) {
  if (!pool) return;
  await pool.query(
    `DELETE FROM compass_favorites WHERE user_id = $1 AND business_id = $2`,
    [userId, businessId],
  );
}