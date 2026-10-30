import { getEnv } from "@/lib/cloudflare";
import type { AddressInput, GeocodeResult, Geocoder } from "./types";

const GEOCODE_URL = "https://api.geocod.io/v2/geocode";
const REQUEST_TIMEOUT_MS = 4000;

/** Geocod.io accepts these country values only; an unmapped country is not geocoded. */
const COUNTRY_PARAMETERS: Record<string, string> = {
  US: "USA",
  CA: "Canada",
  MX: "Mexico",
  GB: "GB",
};

type GeocodResponse = {
  results?: Array<{
    formatted_address?: unknown;
    location?: { lat?: unknown; lng?: unknown };
  }>;
};

function toCoordinate(value: unknown, min: number, max: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

export const geocod: Geocoder = {
  supports(address: AddressInput): boolean {
    return COUNTRY_PARAMETERS[address.country.toUpperCase()] !== undefined;
  },

  async geocode(address: AddressInput): Promise<GeocodeResult | null> {
    const apiKey = getEnv().GEOCODER_API_KEY;
    if (!apiKey) {
      console.error("[geocoder/geocod] GEOCODER_API_KEY is not configured");
      return null;
    }

    const country = COUNTRY_PARAMETERS[address.country.toUpperCase()];
    if (!country) {
      console.warn("[geocoder/geocod] unsupported country; skipping the lookup");
      return null;
    }

    const params = new URLSearchParams({
      street: address.addressLine1,
      city: address.city,
      state_province: address.stateProvince,
      postal_code: address.postalCode,
      country,
      limit: "1",
    });
    if (address.addressLine2) params.set("street2", address.addressLine2);

    let payload: GeocodResponse;
    try {
      const response = await fetch(`${GEOCODE_URL}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        console.error(`[geocoder/geocod] provider responded ${response.status}`);
        return null;
      }
      payload = (await response.json()) as GeocodResponse;
    } catch (error) {
      console.error("[geocoder/geocod] request failed", error instanceof Error ? error.name : "unknown error");
      return null;
    }

    const [match] = payload.results ?? [];
    const latitude = toCoordinate(match?.location?.lat, -90, 90);
    const longitude = toCoordinate(match?.location?.lng, -180, 180);
    if (latitude === null || longitude === null) return null;

    const normalizedAddress = typeof match?.formatted_address === "string" ? match.formatted_address : "";
    return { latitude, longitude, normalizedAddress };
  },
};
