import type { Property, PropertyImage } from "@/types/property";

export type MockProperty = Property & { images: PropertyImage[] };

type MockSeed = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  status: Property["status"];
  latitude?: number;
  longitude?: number;
  images: number;
  listedDaysAgo: number;
};

const PLACEHOLDER_SOURCES = [
  "/placeholders/property-1.svg",
  "/placeholders/property-2.svg",
  "/placeholders/property-3.svg",
];

const OWNER_ONE = "user_2fA1kQm3nB7pR5tzW9vY4sE1c";
const OWNER_TWO = "user_2fB7pT4wLm9dJ2nQ8rX5vC6yZ0";

const REFERENCE_NOW = Date.parse("2026-10-27T12:00:00.000Z");
const DAY_MS = 86_400_000;

const seeds: readonly MockSeed[] = [
  {
    addressLine1: "4821 N Hermitage Ave",
    city: "Chicago",
    stateProvince: "IL",
    postalCode: "60640",
    bedrooms: 4,
    bathrooms: 3.5,
    price: 1_295_000,
    status: "active",
    latitude: 41.9691,
    longitude: -87.6721,
    images: 3,
    listedDaysAgo: 2,
  },
  {
    addressLine1: "1804 S Congress Ave",
    city: "Austin",
    stateProvince: "TX",
    postalCode: "78704",
    bedrooms: 3,
    bathrooms: 2,
    price: 749_900,
    status: "active",
    latitude: 30.2452,
    longitude: -97.7565,
    images: 3,
    listedDaysAgo: 4,
  },
  {
    addressLine1: "2211 NE Alberta St",
    city: "Portland",
    stateProvince: "OR",
    postalCode: "97211",
    bedrooms: 4,
    bathrooms: 2.5,
    price: 689_000,
    status: "draft",
    latitude: 45.559,
    longitude: -122.6435,
    images: 2,
    listedDaysAgo: 1,
  },
  {
    addressLine1: "1150 S Logan St",
    addressLine2: "Unit 4",
    city: "Denver",
    stateProvince: "CO",
    postalCode: "80210",
    bedrooms: 5,
    bathrooms: 3,
    price: 1_150_000,
    status: "active",
    latitude: 39.6766,
    longitude: -104.9831,
    images: 3,
    listedDaysAgo: 6,
  },
  {
    addressLine1: "3320 W Dravus St",
    city: "Seattle",
    stateProvince: "WA",
    postalCode: "98199",
    bedrooms: 3,
    bathrooms: 2,
    price: 975_000,
    status: "active",
    latitude: 47.6533,
    longitude: -122.3987,
    images: 2,
    listedDaysAgo: 8,
  },
  {
    addressLine1: "907 Acklen Ave",
    city: "Nashville",
    stateProvince: "TN",
    postalCode: "37203",
    bedrooms: 3,
    bathrooms: 2.5,
    price: 649_000,
    status: "active",
    latitude: 36.1366,
    longitude: -86.8037,
    images: 3,
    listedDaysAgo: 9,
  },
  {
    addressLine1: "4042 E Palm Ln",
    city: "Phoenix",
    stateProvince: "AZ",
    postalCode: "85008",
    bedrooms: 4,
    bathrooms: 2,
    price: 465_000,
    status: "sold",
    latitude: 33.4629,
    longitude: -111.99,
    images: 2,
    listedDaysAgo: 10,
  },
  {
    addressLine1: "88 Mount Vernon St",
    addressLine2: "Floor 2",
    city: "Boston",
    stateProvince: "MA",
    postalCode: "02108",
    bedrooms: 3,
    bathrooms: 2.5,
    price: 1_890_000,
    status: "active",
    latitude: 42.3573,
    longitude: -71.07,
    images: 3,
    listedDaysAgo: 11,
  },
  {
    addressLine1: "2714 E Lake St",
    city: "Minneapolis",
    stateProvince: "MN",
    postalCode: "55406",
    bedrooms: 3,
    bathrooms: 1.5,
    price: 412_500,
    status: "active",
    latitude: 44.9486,
    longitude: -93.2326,
    images: 2,
    listedDaysAgo: 12,
  },
  {
    addressLine1: "1520 Orange Ave",
    city: "San Diego",
    stateProvince: "CA",
    postalCode: "92103",
    bedrooms: 6,
    bathrooms: 4,
    price: 2_450_000,
    status: "active",
    latitude: 32.7447,
    longitude: -117.1613,
    images: 3,
    listedDaysAgo: 14,
  },
  {
    addressLine1: "615 Gaskill St SE",
    city: "Atlanta",
    stateProvince: "GA",
    postalCode: "30312",
    bedrooms: 3,
    bathrooms: 2,
    price: 735_000,
    status: "off_market",
    latitude: 33.7368,
    longitude: -84.3618,
    images: 2,
    listedDaysAgo: 15,
  },
  {
    addressLine1: "44 E Whittier St",
    city: "Columbus",
    stateProvince: "OH",
    postalCode: "43206",
    bedrooms: 2,
    bathrooms: 1,
    price: 329_000,
    status: "active",
    latitude: 39.9412,
    longitude: -82.99,
    images: 2,
    listedDaysAgo: 16,
  },
  {
    addressLine1: "1904 W State St",
    city: "Boise",
    stateProvince: "ID",
    postalCode: "83702",
    bedrooms: 4,
    bathrooms: 2.5,
    price: 518_000,
    status: "active",
    images: 2,
    listedDaysAgo: 18,
  },
  {
    addressLine1: "900 Myrtle Ave",
    city: "Charlotte",
    stateProvince: "NC",
    postalCode: "28205",
    bedrooms: 3,
    bathrooms: 2,
    price: 1_025_000,
    status: "active",
    latitude: 35.2306,
    longitude: -80.808,
    images: 3,
    listedDaysAgo: 20,
  },
  {
    addressLine1: "205 N 1st Ave",
    city: "Tucson",
    stateProvince: "AZ",
    postalCode: "85701",
    bedrooms: 2,
    bathrooms: 1,
    price: 289_900,
    status: "active",
    images: 0,
    listedDaysAgo: 22,
  },
  {
    addressLine1: "1450 S 1300 E",
    city: "Salt Lake City",
    stateProvince: "UT",
    postalCode: "84105",
    bedrooms: 4,
    bathrooms: 3,
    price: 815_000,
    status: "active",
    latitude: 40.742,
    longitude: -111.8545,
    images: 3,
    listedDaysAgo: 24,
  },
  {
    addressLine1: "76 Benefit St",
    city: "Providence",
    stateProvince: "RI",
    postalCode: "02904",
    bedrooms: 3,
    bathrooms: 2,
    price: 634_000,
    status: "active",
    latitude: 41.834,
    longitude: -71.4065,
    images: 2,
    listedDaysAgo: 26,
  },
  {
    addressLine1: "210 Battery St",
    city: "Burlington",
    stateProvince: "VT",
    postalCode: "05401",
    bedrooms: 4,
    bathrooms: 2,
    price: 598_000,
    status: "active",
    latitude: 44.4759,
    longitude: -73.2121,
    images: 3,
    listedDaysAgo: 28,
  },
];

function placeholderSource(offset: number): string {
  return PLACEHOLDER_SOURCES[offset % PLACEHOLDER_SOURCES.length] ?? "/placeholders/property-1.svg";
}

function toMockProperty(seed: MockSeed, index: number): MockProperty {
  const id = `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
  const createdAt = REFERENCE_NOW - seed.listedDaysAgo * DAY_MS;

  const images: PropertyImage[] = Array.from({ length: seed.images }, (_unused, imageIndex) => ({
    id: `${id}-photo-${imageIndex + 1}`,
    src: placeholderSource(index + imageIndex),
    altText: `Photo of ${seed.addressLine1}`,
  }));

  return {
    id,
    ownerId: index % 2 === 0 ? OWNER_ONE : OWNER_TWO,
    addressLine1: seed.addressLine1,
    addressLine2: seed.addressLine2 ?? null,
    city: seed.city,
    stateProvince: seed.stateProvince,
    postalCode: seed.postalCode,
    country: "US",
    latitude: seed.latitude ?? null,
    longitude: seed.longitude ?? null,
    bedrooms: seed.bedrooms,
    bathrooms: seed.bathrooms,
    priceCents: seed.price * 100,
    currency: "USD",
    status: seed.status,
    createdAt,
    updatedAt: createdAt + DAY_MS,
    images,
  };
}

export const mockProperties: readonly MockProperty[] = seeds.map(toMockProperty);
