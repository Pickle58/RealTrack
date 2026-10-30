import { and, asc, count, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { properties, propertyMedia, type PropertyRow } from "@/lib/db/schema";
import { emitPropertyEvent } from "@/lib/events";
import type { AddressInput } from "@/lib/geocoder";
import { deletePrefix } from "@/lib/r2";
import {
  cacheGetJson,
  cachePutJson,
  getListVersion,
  propertyDetailKey,
  propertyListKey,
  sha256Hex,
} from "@/lib/kv";
import { geocodeAddress } from "@/services/geocoding";
import type {
  Property,
  PropertyDetail,
  PropertyDocument,
  PropertyImage,
  PropertyListItem,
  PropertySearchResult,
  PropertyStatus,
} from "@/types/property";
import {
  defaultPropertySearch,
  type PropertySearchInput,
} from "@/validations/property-search";
import { isImageMedia } from "@/validations/media";
import type { PropertyInput } from "@/validations/property";

export const FEATURED_PROPERTY_LIMIT = 6;
export const LIST_CACHE_TTL_SECONDS = 60;
export const DETAIL_CACHE_TTL_SECONDS = 300;

/** How a write's coordinates were obtained; `rate_limited` is reported back to the caller. */
export type GeocodeStatus = "verified" | "unverified" | "rate_limited";

const LOG_CACHE = process.env.NODE_ENV !== "production";

/** `null` as an owner scope means every owner's rows (admins only). */
export type OwnerScope = string | null;

export type ServiceViewer = { id: string; role: "viewer" | "agent" | "admin" } | null;

const LIKE_ESCAPE = "\\";

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `${LIKE_ESCAPE}${char}`);
}

function toProperty(row: PropertyRow): Property {
  return {
    id: row.id,
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
    septic: row.septic,
    water: row.water,
    priceCents: row.priceCents,
    currency: row.currency,
    status: row.status as PropertyStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Anonymous viewers and read-only accounts see active listings only. Agents also see their own
 * rows on any status; admins see every row, which is what makes a non-active preview possible.
 * `undefined` means "no filter" and is what `and()` drops for admins.
 */
function visibleTo(viewer: ServiceViewer): SQL | undefined {
  if (!viewer || viewer.role === "viewer") return eq(properties.status, "active");
  if (viewer.role === "admin") return undefined;
  return or(eq(properties.status, "active"), eq(properties.ownerId, viewer.id)) as SQL;
}

/** Only the anonymous view is cacheable: its result set can never contain a non-active row. */
function isPublicViewer(viewer: ServiceViewer): boolean {
  return viewer === null;
}

function logCache(outcome: "hit" | "miss", key: string): void {
  if (LOG_CACHE) console.log(`[services/properties] cache ${outcome} ${key}`);
}

function stableJson(values: Record<string, string | number | null>): string {
  const keys = Object.keys(values).sort();
  return JSON.stringify(Object.fromEntries(keys.map((key) => [key, values[key]])));
}

async function listCacheKey(search: PropertySearchInput): Promise<string> {
  const queryHash = await sha256Hex(
    stableJson({
      q: search.q.toLowerCase(),
      minPrice: search.minPrice ?? null,
      maxPrice: search.maxPrice ?? null,
      minBedrooms: search.minBedrooms ?? null,
      minBathrooms: search.minBathrooms ?? null,
      sort: search.sort,
      page: search.page,
      pageSize: search.pageSize,
    }),
  );
  return propertyListKey(await getListVersion(), queryHash);
}

function isCachedSearch(value: PropertySearchResult | null): value is PropertySearchResult {
  return (
    value !== null &&
    Array.isArray(value.items) &&
    typeof value.total === "number" &&
    typeof value.page === "number" &&
    typeof value.pageCount === "number"
  );
}

/** A cached detail is only usable while it still describes an active listing. */
function isCachedDetail(value: PropertyDetail | null, id: string): value is PropertyDetail {
  return (
    value !== null &&
    value.property?.id === id &&
    value.property.status === "active" &&
    Array.isArray(value.images) &&
    Array.isArray(value.documents)
  );
}

type PropertyMedia = { images: PropertyImage[]; documents: PropertyDocument[] };

function emptyMedia(): PropertyMedia {
  return { images: [], documents: [] };
}

/** Cover-first ordering means `images[0]` is the listing's cover (or its oldest photo). */
async function loadMedia(propertyIds: string[]): Promise<Map<string, PropertyMedia>> {
  const byProperty = new Map<string, PropertyMedia>();
  if (propertyIds.length === 0) return byProperty;

  const rows = await getDb()
    .select()
    .from(propertyMedia)
    .where(inArray(propertyMedia.propertyId, propertyIds))
    .orderBy(desc(propertyMedia.isCover), asc(propertyMedia.uploadedAt), asc(propertyMedia.id));

  for (const row of rows) {
    const media = byProperty.get(row.propertyId) ?? emptyMedia();
    if (isImageMedia(row.mimeType)) {
      media.images.push({
        id: row.id,
        src: `/media/${row.id}`,
        altText: row.altText ?? "",
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
      });
    } else {
      media.documents.push({
        id: row.id,
        src: `/media/${row.id}`,
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
      });
    }
    byProperty.set(row.propertyId, media);
  }

  return byProperty;
}

async function toListItems(rows: PropertyRow[]): Promise<PropertyListItem[]> {
  const media = await loadMedia(rows.map((row) => row.id));
  return rows.map((row) => ({
    property: toProperty(row),
    coverImage: media.get(row.id)?.images[0] ?? null,
  }));
}

/** Public results are served from KV for 60 s; owner, admin and draft views always read D1. */
export async function search(
  search: PropertySearchInput,
  viewer: ServiceViewer,
): Promise<PropertySearchResult> {
  if (!isPublicViewer(viewer)) return runSearch(search, viewer);

  const key = await listCacheKey(search);
  const cached = await cacheGetJson<PropertySearchResult>(key);
  if (isCachedSearch(cached)) {
    logCache("hit", key);
    return cached;
  }
  logCache("miss", key);

  const result = await runSearch(search, viewer);
  await cachePutJson(key, result, LIST_CACHE_TTL_SECONDS);
  return result;
}

async function runSearch(
  search: PropertySearchInput,
  viewer: ServiceViewer,
): Promise<PropertySearchResult> {
  const visible = visibleTo(viewer);
  const conditions: SQL[] = visible ? [visible] : [];

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

/** Public details are cached for 300 s; anything owner-scoped or non-active bypasses KV. */
export async function getById(id: string, viewer: ServiceViewer): Promise<PropertyDetail | null> {
  if (!isPublicViewer(viewer)) return loadDetail(id, viewer);

  const key = propertyDetailKey(id);
  const cached = await cacheGetJson<PropertyDetail>(key);
  if (isCachedDetail(cached, id)) {
    logCache("hit", key);
    return cached;
  }
  logCache("miss", key);

  const detail = await loadDetail(id, viewer);
  if (detail && detail.property.status === "active") {
    await cachePutJson(key, detail, DETAIL_CACHE_TTL_SECONDS);
  }
  return detail;
}

async function loadDetail(id: string, viewer: ServiceViewer): Promise<PropertyDetail | null> {
  const [row] = await getDb()
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), visibleTo(viewer)))
    .limit(1);
  if (!row) return null;

  const media = await loadMedia([row.id]);
  return { property: toProperty(row), ...(media.get(row.id) ?? emptyMedia()) };
}

export async function listByOwner(ownerId: OwnerScope): Promise<PropertyListItem[]> {
  const rows = await getDb()
    .select()
    .from(properties)
    .where(ownerId === null ? undefined : eq(properties.ownerId, ownerId))
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
  ownerId: OwnerScope,
): Promise<PropertyDetail | null> {
  const row = await getOwnedRow(id, ownerId);
  if (!row) return null;

  const media = await loadMedia([row.id]);
  return { property: toProperty(row), ...(media.get(row.id) ?? emptyMedia()) };
}

function ownerFilter(ownerId: OwnerScope): SQL | undefined {
  return ownerId === null ? undefined : eq(properties.ownerId, ownerId);
}

function addressOf(input: PropertyInput): AddressInput {
  return {
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 || null,
    city: input.city,
    stateProvince: input.stateProvince,
    postalCode: input.postalCode,
    country: input.country,
  };
}

function addressOfRow(row: PropertyRow): AddressInput {
  return {
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    stateProvince: row.stateProvince,
    postalCode: row.postalCode,
    country: row.country,
  };
}

function didAddressChange(row: PropertyRow, input: PropertyInput): boolean {
  const current = addressOfRow(row);
  const next = addressOf(input);
  return (
    current.addressLine1 !== next.addressLine1 ||
    current.addressLine2 !== next.addressLine2 ||
    current.city !== next.city ||
    current.stateProvince !== next.stateProvince ||
    current.postalCode !== next.postalCode ||
    current.country !== next.country
  );
}

/** Null coordinates mean "not verified": the property still saves and the UI says so. */
async function coordinatesFor(
  address: AddressInput,
  userId: string,
): Promise<{ latitude: number | null; longitude: number | null; geocode: GeocodeStatus }> {
  const { location, rateLimited } = await geocodeAddress(address, userId);
  return {
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    geocode: location ? "verified" : rateLimited ? "rate_limited" : "unverified",
  };
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
    septic: input.septic,
    water: input.water,
    priceCents: input.price * 100,
    status: input.status,
  };
}

export type CreateResult = { id: string; geocode: GeocodeStatus };

/** Inserts a new listing for the owner. Dollars become cents here, and `geocode` reports how the coordinates were obtained. */
export async function create(input: PropertyInput, ownerId: string): Promise<CreateResult> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const { geocode, ...coordinates } = await coordinatesFor(addressOf(input), ownerId);
  await getDb()
    .insert(properties)
    .values({ id, ownerId, ...toRowValues(input), ...coordinates, createdAt: now, updatedAt: now });
  await emitPropertyEvent("property.created", { propertyId: id, ownerId });
  return { id, geocode };
}

/**
 * Updates a listing only when the owner matches; `updated` is false when no owned row was found.
 * The geocoder runs only when an address field changed, and `actorId` keys its rate limit.
 */
export async function update(
  id: string,
  input: PropertyInput,
  ownerId: OwnerScope,
  actorId: string,
): Promise<{ updated: boolean; geocode: GeocodeStatus }> {
  const existing = await getOwnedRow(id, ownerId);
  if (!existing) return { updated: false, geocode: "unverified" };

  const addressChanged = didAddressChange(existing, input);
  const located = addressChanged
    ? await coordinatesFor(addressOf(input), actorId)
    : {
        latitude: existing.latitude,
        longitude: existing.longitude,
        geocode: existing.latitude === null ? ("unverified" as const) : ("verified" as const),
      };
  const { geocode, ...coordinates } = located;

  const updated = await getDb()
    .update(properties)
    .set({ ...toRowValues(input), ...coordinates, updatedAt: Date.now() })
    .where(and(eq(properties.id, id), ownerFilter(ownerId)))
    .returning({ id: properties.id });
  if (updated.length === 0) return { updated: false, geocode };

  await emitPropertyEvent("property.updated", {
    propertyId: id,
    ownerId: existing.ownerId,
    addressChanged,
  });
  return { updated: true, geocode };
}

async function getOwnedRow(id: string, ownerId: OwnerScope): Promise<PropertyRow | null> {
  const [row] = await getDb()
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), ownerFilter(ownerId)))
    .limit(1);
  return row ?? null;
}

/**
 * Deletes a listing only when the owner matches. Media rows cascade in D1, and the R2
 * objects are removed first; a storage failure is logged and the database delete still runs.
 */
export async function remove(id: string, ownerId: OwnerScope): Promise<boolean> {
  const existing = await getOwnedRow(id, ownerId);
  if (!existing) return false;

  try {
    await deletePrefix(`properties/${id}/media/`);
  } catch (error) {
    console.error("[services/properties/remove/r2]", error);
  }

  const deleted = await getDb()
    .delete(properties)
    .where(eq(properties.id, id))
    .returning({ id: properties.id });
  if (deleted.length === 0) return false;

  await emitPropertyEvent("property.deleted", { propertyId: id, ownerId: existing.ownerId });
  return true;
}
