import { and, asc, count, desc, eq, like } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { properties, propertyMedia, type PropertyMediaRow } from "@/lib/db/schema";
import { emitPropertyEvent } from "@/lib/events";
import * as r2 from "@/lib/r2";
import type { Role } from "@/lib/auth/roles";
import type { MediaItem } from "@/types/media";
import {
  MAX_MEDIA_BYTES,
  MAX_MEDIA_PER_PROPERTY,
  isAllowedMediaType,
  isImageMedia,
} from "@/validations/media";

/** Upload budget per acting user: 60 files an hour, which is three full properties. */
export const MEDIA_UPLOAD_RATE_LIMIT_SCOPE = "media-upload";
export const MEDIA_UPLOAD_RATE_LIMIT_MAX = 60;
export const MEDIA_UPLOAD_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

/** `null` as an owner scope means every owner's rows (admins only). */
export type MediaOwnerScope = string | null;

/** The caller for the read path: signed out, a viewer/agent account, or an admin. */
export type MediaViewer = { id: string; role: Role } | null;

/** What `/media/[id]` needs to answer a request: the object and whether it is publicly cacheable. */
export type ServedMedia = { r2Key: string; isPublic: boolean };

export type MediaErrorCode =
  | "not_found"
  | "empty_file"
  | "unsupported_type"
  | "too_large"
  | "limit_reached"
  | "storage_failed"
  | "not_an_image";

export class MediaError extends Error {
  constructor(public readonly code: MediaErrorCode) {
    super(code);
  }
}

function ownerFilter(ownerId: MediaOwnerScope) {
  return ownerId === null ? undefined : eq(properties.ownerId, ownerId);
}

function toMediaItem(row: PropertyMediaRow): MediaItem {
  return {
    id: row.id,
    propertyId: row.propertyId,
    src: `/media/${row.id}`,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    altText: row.altText,
    isCover: row.isCover,
    uploadedAt: row.uploadedAt,
  };
}

/** Returns the property's owner so the event carries the real owner, even when an admin acts. */
async function findOwnedProperty(
  propertyId: string,
  ownerId: MediaOwnerScope,
): Promise<string | null> {
  const [row] = await getDb()
    .select({ ownerId: properties.ownerId })
    .from(properties)
    .where(and(eq(properties.id, propertyId), ownerFilter(ownerId)))
    .limit(1);
  return row?.ownerId ?? null;
}

type OwnedMedia = { media: PropertyMediaRow; ownerId: string };

async function findOwnedMedia(mediaId: string, ownerId: MediaOwnerScope): Promise<OwnedMedia | null> {
  const [row] = await getDb()
    .select({ media: propertyMedia, ownerId: properties.ownerId })
    .from(propertyMedia)
    .innerJoin(properties, eq(propertyMedia.propertyId, properties.id))
    .where(and(eq(propertyMedia.id, mediaId), ownerFilter(ownerId)))
    .limit(1);
  return row ?? null;
}

/**
 * Resolves the object a `/media/:id` request may serve. An active parent is public and needs no
 * session, so `resolveViewer` runs only for a non-active one; then the owner and admins get it.
 * Unknown and not-owned ids are both `null`, and the R2 key never leaves the server.
 */
export async function getForServing(
  mediaId: string,
  resolveViewer: () => Promise<MediaViewer>,
): Promise<ServedMedia | null> {
  const [row] = await getDb()
    .select({ r2Key: propertyMedia.r2Key, status: properties.status, ownerId: properties.ownerId })
    .from(propertyMedia)
    .innerJoin(properties, eq(propertyMedia.propertyId, properties.id))
    .where(eq(propertyMedia.id, mediaId))
    .limit(1);

  if (!row) return null;
  if (row.status === "active") return { r2Key: row.r2Key, isPublic: true };

  const viewer = await resolveViewer();
  if (!viewer) return null;
  if (viewer.role !== "admin" && viewer.id !== row.ownerId) return null;

  return { r2Key: row.r2Key, isPublic: false };
}

/** Owner-scoped list for the edit page: cover first, then upload order. */
export async function list(propertyId: string, ownerId: MediaOwnerScope): Promise<MediaItem[]> {
  if ((await findOwnedProperty(propertyId, ownerId)) === null) return [];

  const rows = await getDb()
    .select()
    .from(propertyMedia)
    .where(eq(propertyMedia.propertyId, propertyId))
    .orderBy(desc(propertyMedia.isCover), asc(propertyMedia.uploadedAt), asc(propertyMedia.id));

  return rows.map(toMediaItem);
}

/**
 * Stores the object before the row, and removes the object again if the insert fails,
 * so R2 never keeps a file the database does not know about.
 */
export async function upload(propertyId: string, ownerId: MediaOwnerScope, file: File): Promise<MediaItem> {
  const propertyOwnerId = await findOwnedProperty(propertyId, ownerId);
  if (propertyOwnerId === null) throw new MediaError("not_found");
  if (file.size === 0) throw new MediaError("empty_file");
  if (file.size > MAX_MEDIA_BYTES) throw new MediaError("too_large");
  if (!isAllowedMediaType(file.type)) throw new MediaError("unsupported_type");

  const [counted] = await getDb()
    .select({ total: count() })
    .from(propertyMedia)
    .where(eq(propertyMedia.propertyId, propertyId));
  const used = counted?.total ?? 0;
  if (used >= MAX_MEDIA_PER_PROPERTY) throw new MediaError("limit_reached");

  const [currentCover] = await getDb()
    .select({ id: propertyMedia.id })
    .from(propertyMedia)
    .where(and(eq(propertyMedia.propertyId, propertyId), eq(propertyMedia.isCover, true)))
    .limit(1);
  // A cover is always a photo: the first uploaded image takes it, documents never do.
  const isCover = currentCover === undefined && isImageMedia(file.type);

  const id = crypto.randomUUID();
  const key = `properties/${propertyId}/media/${id}`;

  await r2.putMedia(key, await file.arrayBuffer(), file.type);

  const values = {
    id,
    propertyId,
    r2Key: key,
    mimeType: file.type,
    sizeBytes: file.size,
    isCover,
    uploadedAt: Date.now(),
  };

  try {
    // A concurrent upload of the property's first photo can take the cover and trip the
    // one-cover index, so a rejected cover insert is retried as a plain non-cover upload.
    let [row] = await getDb()
      .insert(propertyMedia)
      .values(values)
      .onConflictDoNothing()
      .returning();

    if (!row && isCover) {
      [row] = await getDb()
        .insert(propertyMedia)
        .values({ ...values, isCover: false })
        .returning();
    }

    if (!row) throw new Error("insert returned no row");
    await emitPropertyEvent("property.updated", { propertyId, ownerId: propertyOwnerId });
    return toMediaItem(row);
  } catch (error) {
    console.error("[services/media/upload]", error);
    try {
      await r2.deleteMedia(key);
    } catch (cleanupError) {
      console.error("[services/media/upload/cleanup]", cleanupError);
    }
    throw new MediaError("storage_failed");
  }
}

export async function updateAlt(mediaId: string, ownerId: MediaOwnerScope, altText: string): Promise<MediaItem> {
  const existing = await findOwnedMedia(mediaId, ownerId);
  if (!existing) throw new MediaError("not_found");

  const [row] = await getDb()
    .update(propertyMedia)
    .set({ altText: altText.length > 0 ? altText : null })
    .where(eq(propertyMedia.id, mediaId))
    .returning();

  if (!row) throw new MediaError("not_found");
  await emitPropertyEvent("property.updated", {
    propertyId: existing.media.propertyId,
    ownerId: existing.ownerId,
  });
  return toMediaItem(row);
}

/** Clears the old cover first: the schema allows only one `is_cover = 1` row per property. */
export async function setCover(mediaId: string, ownerId: MediaOwnerScope): Promise<string> {
  const existing = await findOwnedMedia(mediaId, ownerId);
  if (!existing) throw new MediaError("not_found");
  if (!isImageMedia(existing.media.mimeType)) throw new MediaError("not_an_image");
  if (existing.media.isCover) return existing.media.propertyId;

  const db = getDb();
  await db.batch([
    db
      .update(propertyMedia)
      .set({ isCover: false })
      .where(
        and(
          eq(propertyMedia.propertyId, existing.media.propertyId),
          eq(propertyMedia.isCover, true),
        ),
      ),
    db.update(propertyMedia).set({ isCover: true }).where(eq(propertyMedia.id, mediaId)),
  ] as const);

  await emitPropertyEvent("property.updated", {
    propertyId: existing.media.propertyId,
    ownerId: existing.ownerId,
  });
  return existing.media.propertyId;
}

/** Removes the row, promotes the next upload when the cover went, then removes the object. */
export async function remove(mediaId: string, ownerId: MediaOwnerScope): Promise<string> {
  const existing = await findOwnedMedia(mediaId, ownerId);
  if (!existing) throw new MediaError("not_found");

  const { propertyId } = existing.media;
  await getDb().delete(propertyMedia).where(eq(propertyMedia.id, mediaId));

  if (existing.media.isCover) {
    const [next] = await getDb()
      .select({ id: propertyMedia.id })
      .from(propertyMedia)
      .where(and(eq(propertyMedia.propertyId, propertyId), like(propertyMedia.mimeType, "image/%")))
      .orderBy(asc(propertyMedia.uploadedAt), asc(propertyMedia.id))
      .limit(1);

    if (next) {
      await getDb().update(propertyMedia).set({ isCover: true }).where(eq(propertyMedia.id, next.id));
    }
  }

  try {
    await r2.deleteMedia(existing.media.r2Key);
  } catch (error) {
    console.error("[services/media/remove]", error);
  }

  await emitPropertyEvent("property.updated", { propertyId, ownerId: existing.ownerId });
  return propertyId;
}
