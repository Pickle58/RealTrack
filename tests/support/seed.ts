import { randomUUID } from "node:crypto";
import type { TestWorker } from "./worker";
import type { PropertyStatus } from "@/types/property";

export type PropertySeed = {
  id?: string;
  ownerId?: string;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
  priceCents?: number;
  bedrooms?: number;
  bathrooms?: number;
  status?: PropertyStatus;
  createdAt?: number;
  latitude?: number | null;
  longitude?: number | null;
};

/** Inserts a listing straight into D1 so a test can start from a known row. */
export async function seedProperty(worker: TestWorker, seed: PropertySeed = {}): Promise<string> {
  const id = seed.id ?? `property-${randomUUID()}`;

  await worker.db
    .prepare(
      `INSERT INTO properties
        (id, owner_id, address_line_1, address_line_2, city, state_province, postal_code, country,
         latitude, longitude, bedrooms, bathrooms, price_cents, currency, status, created_at, updated_at)
       VALUES (?, ?, ?, NULL, ?, ?, ?, 'US', ?, ?, ?, ?, ?, 'USD', ?, ?, ?)`,
    )
    .bind(
      id,
      seed.ownerId ?? "user_agent_a",
      seed.addressLine1 ?? "100 Test Street",
      seed.city ?? "Testville",
      "TS",
      seed.postalCode ?? "00001",
      seed.latitude ?? null,
      seed.longitude ?? null,
      seed.bedrooms ?? 3,
      seed.bathrooms ?? 2,
      seed.priceCents ?? 450_000_00,
      seed.status ?? "active",
      seed.createdAt ?? Date.now(),
      seed.createdAt ?? Date.now(),
    )
    .run();

  return id;
}

export type MediaSeed = {
  id?: string;
  propertyId: string;
  mimeType?: string;
  sizeBytes?: number;
  altText?: string | null;
  isCover?: boolean;
  uploadedAt?: number;
};

/** Inserts a media row directly; the R2 object is only written when a test asks the service to. */
export async function seedMedia(worker: TestWorker, seed: MediaSeed): Promise<string> {
  const id = seed.id ?? `media-${randomUUID()}`;

  await worker.db
    .prepare(
      `INSERT INTO property_media
        (id, property_id, r2_key, mime_type, size_bytes, alt_text, is_cover, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      seed.propertyId,
      `properties/${seed.propertyId}/media/${id}`,
      seed.mimeType ?? "image/png",
      seed.sizeBytes ?? 128,
      seed.altText ?? null,
      seed.isCover === true ? 1 : 0,
      seed.uploadedAt ?? Date.now(),
    )
    .run();

  return id;
}

export async function countRows(worker: TestWorker, table: "properties" | "property_media"): Promise<number> {
  const row = await worker.db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).first<{ total: number }>();
  return row?.total ?? 0;
}
