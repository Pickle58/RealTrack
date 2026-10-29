export type AddressInput = {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
};

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  /** The provider's formatted address. Cached for reference; it never overwrites the agent's input. */
  normalizedAddress: string;
};

export interface Geocoder {
  geocode(address: AddressInput): Promise<GeocodeResult | null>;
}
