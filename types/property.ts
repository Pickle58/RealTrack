export const propertyStatusValues = ["draft", "active", "sold", "off_market"] as const;

export type PropertyStatus = (typeof propertyStatusValues)[number];

/** Listing fields only: ownership stays on the rows in `services/`, never in a payload. */
export type Property = {
  id: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  bathrooms: number;
  priceCents: number;
  currency: string;
  status: PropertyStatus;
  createdAt: number;
  updatedAt: number;
};

export type PropertyImage = {
  id: string;
  src: string;
  altText: string;
  mimeType: string;
  sizeBytes: number;
};

export type PropertyDocument = Omit<PropertyImage, "altText">;

export type PropertyListItem = {
  property: Property;
  coverImage: PropertyImage | null;
};

export type PropertyDetail = {
  property: Property;
  images: PropertyImage[];
  documents: PropertyDocument[];
};

export type PropertySearchResult = {
  items: PropertyListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};
