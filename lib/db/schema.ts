import { sql } from "drizzle-orm";
import { check, index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { propertyStatusValues, septicValues, waterValues } from "@/types/property";

const NOW_MS = sql`(unixepoch() * 1000)`;

export const properties = sqliteTable(
  "properties",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").notNull(),
    stateProvince: text("state_province").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("US"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    bedrooms: integer("bedrooms").notNull(),
    bathrooms: real("bathrooms").notNull(),
    septic: text("septic", { enum: septicValues }),
    water: text("water", { enum: waterValues }),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    status: text("status", { enum: propertyStatusValues }).notNull().default("draft"),
    createdAt: integer("created_at").notNull().default(NOW_MS),
    updatedAt: integer("updated_at").notNull().default(NOW_MS),
  },
  (t) => [
    index("properties_status_idx").on(t.status),
    index("properties_owner_id_idx").on(t.ownerId),
    index("properties_city_idx").on(t.city),
    index("properties_price_cents_idx").on(t.priceCents),
    index("properties_bedrooms_idx").on(t.bedrooms),
    check("properties_bedrooms_non_negative", sql`${t.bedrooms} >= 0`),
    check("properties_bathrooms_non_negative", sql`${t.bathrooms} >= 0`),
    check("properties_price_cents_non_negative", sql`${t.priceCents} >= 0`),
  ],
);

export const propertyMedia = sqliteTable(
  "property_media",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    r2Key: text("r2_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    altText: text("alt_text"),
    isCover: integer("is_cover", { mode: "boolean" }).notNull().default(false),
    uploadedAt: integer("uploaded_at").notNull().default(NOW_MS),
  },
  (t) => [
    index("property_media_property_id_idx").on(t.propertyId),
    uniqueIndex("property_media_r2_key_unique").on(t.r2Key),
    uniqueIndex("property_media_cover_unique").on(t.propertyId).where(sql`${t.isCover} = 1`),
  ],
);

export type PropertyRow = typeof properties.$inferSelect;
export type NewPropertyRow = typeof properties.$inferInsert;
export type PropertyMediaRow = typeof propertyMedia.$inferSelect;
export type NewPropertyMediaRow = typeof propertyMedia.$inferInsert;
