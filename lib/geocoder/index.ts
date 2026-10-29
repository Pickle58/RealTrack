import { getEnv } from "@/lib/cloudflare";
import { geocod } from "./geocod";
import type { Geocoder } from "./types";

export type { AddressInput, GeocodeResult, Geocoder } from "./types";

const PROVIDERS: Record<string, Geocoder> = { geocod };

/** The vendor is chosen here and nowhere else; an unknown name fails the lookup, not the save. */
export function getGeocoder(): Geocoder {
  const name = getEnv().GEOCODER_PROVIDER || "geocod";
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`Unknown geocoder provider: ${name}`);
  return provider;
}
