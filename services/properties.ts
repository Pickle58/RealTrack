import { and, asc, count, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { properties, propertyMedia, type PropertyRow } from "@/lib/db/schema";
import type {
  Property,
  PropertyDetail,
  PropertyImage,
  PropertyListItem,
  PropertySearchResult,
  PropertyStatus,
} from "@/types/property";
import {
  defaultPropertySearch,
  type PropertySearchInput,
} from "@/validations/property-search";
import type { PropertyInput } from "@/validations/property";

export const FEATURED_PROPERTY_LIMIT = 6;

/**
 * Owner of the seeded listings. Temporary until Clerk sessions exist (feature 10):
 * the dashboard and edit page read this owner's rows instead of the signed-in user's.
 */
export const TEMPORARY_OWNER_ID = "seed_agent_a";

export type ServiceViewer = { id: string; role: "viewer" | "agent" | "admin" } | null;

const LIKE_ESCAPE = "\\";

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `${LIKE_ESCAPE}${char}`);
}

function toProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    ownerId: row.ownerId,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    stateProvince: row.stateProvince,
    postalCode: row.postalCode,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    priceCents: row.priceCents,
    currency: row.currency,
    status: row.status as PropertyStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Anonymous viewers see active listings only. Signed-in agents and admins also see their own rows. */
function visibleTo(viewer: ServiceViewer): SQL {
  if (!viewer || viewer.role === "viewer") return eq(properties.status, "active");
  return or(eq(properties.status, "active"), eq(properties.ownerId, viewer.id)) as SQL;
}

async function loadImages(propertyIds: string[]): Promise<Map<string, PropertyImage[]>> {
  const byProperty = new Map<string, PropertyImage[]>();
  if (propertyIds.length === 0) return byProperty;

  const rows = await getDb()
    .select()
    .from(propertyMedia)
    .where(inArray(propertyMedia.propertyId, propertyIds))
    .orderBy(desc(propertyMedia.isCover), asc(propertyMedia.uploadedAt), asc(propertyMedia.id));

  for (const row of rows) {
    const list = byProperty.get(row.propertyId) ?? [];
    list.push({ id: row.id, src: `/media/${row.id}`, altText: row.altText ?? "" });
    byProperty.set(row.propertyId, list);
  }

  return byProperty;
}

async function toListItems(rows: PropertyRow[]): Promise<PropertyListItem[]> {
  const images = await loadImages(rows.map((row) => row.id));
  return rows.map((row) => ({
    property: toProperty(row),
    coverImage: images.get(row.id)?.[0] ?? null,
  }));
}

export async function search(
  search: PropertySearchInput,
  viewer: ServiceViewer,
): Promise<PropertySearchResult> {
  const conditions: SQL[] = [visibleTo(viewer)];

  if (search.q) {
    const pattern = `%${escapeLike(search.q)}%`;
    conditions.push(
      sql`(${properties.addressLine1} LIKE ${pattern} ESCAPE ${LIKE_ESCAPE}
        OR ${properties.addressLine2} LIKE ${pattern} ESCAPE ${LIKE_ESCAPE}
        OR ${properties.city} LIKE ${pattern} ESCAPE ${LIKE_ESCAPE}
        OR ${properties.postalCode} LIKE ${pattern} ESCAPE ${LIKE_ESCAPE})`,
    );
  }
  if (search.minPrice !== undefined) {
    conditions.push(sql`${properties.priceCents} >= ${search.minPrice * 100}`);
  }
  if (search.maxPrice !== undefined) {
    conditions.push(sql`${properties.priceCents} <= ${search.maxPrice * 100}`);
  }
  if (search.minBedrooms !== undefined) {
    conditions.push(sql`${properties.bedrooms} >= ${search.minBedrooms}`);
  }
  if (search.minBathrooms !== undefined) {
    conditions.push(sql`${properties.bathrooms} >= ${search.minBathrooms}`);
  }

  const where = and(...conditions);
  const db = getDb();

  const [totalRow] = await db.select({ total: count() }).from(properties).where(where);
  const total = totalRow?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / search.pageSize));
  const page = Math.min(search.page, pageCount);

  const order =
    search.sort === "price_asc"
      ? [asc(properties.priceCents), asc(properties.id)]
      : search.sort === "price_desc"
        ? [desc(properties.priceCents), asc(properties.id)]
        : [desc(properties.createdAt), asc(properties.id)];

  const rows = await db
    .select()
    .from(properties)
    .where(where)
    .orderBy(...order)
    .limit(search.pageSize)
    .offset((page - 1) * search.pageSize);

  return {
    items: await toListItems(rows),
    total,
    page,
    pageSize: search.pageSize,
    pageCount,
  };
}

export async function getById(id: string, viewer: ServiceViewer): Promise<PropertyDetail | null> {
  const [row] = await getDb()
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), visibleTo(viewer)))
    .limit(1);
  if (!row) return null;

  const images = await loadImages([row.id]);
  return { property: toProperty(row), images: images.get(row.id) ?? [] };
}

export async function listByOwner(ownerId: string): Promise<PropertyListItem[]> {
  const rows = await getDb()
    .select()
    .from(properties)
    .where(eq(properties.ownerId, ownerId))
    .orderBy(desc(properties.updatedAt), asc(properties.id));

  return toListItems(rows);
}

export async function getFeaturedProperties(
  limit = FEATURED_PROPERTY_LIMIT,
): Promise<PropertyListItem[]> {
  const result = await search({ ...defaultPropertySearch, pageSize: limit }, null);
  return result.items;
}

/** Owner-scoped lookup for the edit page: any status, but only the given owner's rows. */
export async function getOwnedProperty(
  id: string,
  ownerId: string,
): Promise<PropertyDetail | null> {
  const [row] = await getDb()
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.ownerId, ownerId)))
    .limit(1);
  if (!row) return null;

  const images = await loadImages([row.id]);
  return { property: toProperty(row), images: images.get(row.id) ?? [] };
}

function toRowValues(input: PropertyInput) {
  return {
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 || null,
    city: input.city,
    stateProvince: input.stateProvince,
    postalCode: input.postalCode,
    country: input.country,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    priceCents: input.price * 100,
    status: input.status,
  };
}

/** Inserts a new listing for the owner and returns its ID. Dollars become cents here. */
export async function create(input: PropertyInput, ownerId: string): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  await getDb()
    .insert(properties)
    .values({ id, ownerId, ...toRowValues(input), createdAt: now, updatedAt: now });
  return id;
}

/** Updates a listing only when the owner matches. Returns false when no owned row was found. */
export async function update(id: string, input: PropertyInput, ownerId: string): Promise<boolean> {
  const updated = await getDb()
    .update(properties)
    .set({ ...toRowValues(input), updatedAt: Date.now() })
    .where(and(eq(properties.id, id), eq(properties.ownerId, ownerId)))
    .returning({ id: properties.id });
  return updated.length > 0;
}

/** Deletes a listing only when the owner matches. Media rows cascade. */
export async function remove(id: string, ownerId: string): Promise<boolean> {
  const deleted = await getDb()
    .delete(properties)
    .where(and(eq(properties.id, id), eq(properties.ownerId, ownerId)))
    .returning({ id: properties.id });
  return deleted.length > 0;
}
