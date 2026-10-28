export const propertyStatusValues = ["draft", "active", "sold", "off_market"] as const;

export type PropertyStatus = (typeof propertyStatusValues)[number];

export type Property = {
  id: string;
  ownerId: string;
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
};

export type PropertyListItem = {
  property: Property;
  coverImage: PropertyImage | null;
};

export type PropertyDetail = {
  property: Property;
  images: PropertyImage[];
};

export type PropertySearchResult = {
  items: PropertyListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};
