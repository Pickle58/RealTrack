import { getGeocoder, type AddressInput, type GeocodeResult } from "@/lib/geocoder";
import { cacheGetJson, cachePutJson, consumeRateLimit, sha256Hex } from "@/lib/kv";

export const GEOCODE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
export const GEOCODE_RATE_LIMIT_MAX = 60;
export const GEOCODE_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export type GeocodeOutcome = {
  location: GeocodeResult | null;
  /** True when KV served the lookup, i.e. the provider was not called. */
  cached: boolean;
  /** True when this user's hourly provider budget was already spent, so the provider was not called. */
  rateLimited: boolean;
};

/** Trim, lowercase and collapse whitespace so formatting differences share one cache entry. */
export function normalizeAddress(address: AddressInput): string {
  return [
    address.addressLine1,
    address.addressLine2 ?? "",
    address.city,
    address.stateProvince,
    address.postalCode,
    address.country,
  ]
    .map((part) => part.trim().replace(/\s+/g, " ").toLowerCase())
    .join(",");
}

/**
 * Cache first, provider second. Never throws: a failed lookup returns null and the caller
 * still saves the property, with null coordinates and "Location not verified" on the detail page.
 */
export async function geocodeAddress(address: AddressInput, userId: string): Promise<GeocodeOutcome> {
  try {
    const key = `geocode:${await sha256Hex(normalizeAddress(address))}`;

    const cached = await cacheGetJson<GeocodeResult>(key);
    if (cached && typeof cached.latitude === "number" && typeof cached.longitude === "number") {
      return { location: cached, cached: true, rateLimited: false };
    }

    const allowed = await consumeRateLimit(
      "geocode",
      userId,
      GEOCODE_RATE_LIMIT_MAX,
      GEOCODE_RATE_LIMIT_WINDOW_SECONDS,
    );
    if (!allowed) {
      console.warn(`[services/geocoding] geocode rate limit reached for user ${userId}`);
      return { location: null, cached: false, rateLimited: true };
    }

    const location = await getGeocoder().geocode(address);
    if (!location) return { location: null, cached: false, rateLimited: false };

    await cachePutJson(key, location, GEOCODE_CACHE_TTL_SECONDS);
    return { location, cached: false, rateLimited: false };
  } catch (error) {
    console.error("[services/geocoding/geocodeAddress]", error);
    return { location: null, cached: false, rateLimited: false };
  }
}
