import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { canWriteListings } from "@/lib/auth/roles";
import { defaultPropertySearch, type PropertySearchInput } from "@/validations/property-search";
import type { PropertyInput } from "@/validations/property";
import { geocodeAddress } from "@/services/geocoding";
import * as properties from "@/services/properties";
import { seedProperty } from "./support/seed";
import { resetTestWorker, startTestWorker, type TestWorker } from "./support/worker";

vi.mock("@/services/geocoding", () => ({ geocodeAddress: vi.fn() }));

const geocode = vi.mocked(geocodeAddress);

const AGENT_A = { id: "user_agent_a", role: "agent" } as const;
const AGENT_B = { id: "user_agent_b", role: "agent" } as const;
const VIEWER = { id: "user_viewer", role: "viewer" } as const;
const ADMIN = { id: "user_admin", role: "admin" } as const;

/** Mirrors `ownerScope` in `lib/auth/guards.ts`: admins act on every owner's rows. */
function scopeOf(user: { id: string; role: "viewer" | "agent" | "admin" }): string | null {
  return user.role === "admin" ? null : user.id;
}

function input(overrides: Partial<PropertyInput> = {}): PropertyInput {
  return {
    addressLine1: "1 Main St",
    addressLine2: "",
    city: "Springfield",
    stateProvince: "IL",
    postalCode: "62701",
    country: "US",
    bedrooms: 3,
    bathrooms: 2,
    lotSize: null,
    lotSizeUnit: null,
    electric: null,
    septic: "city",
    water: "well",
    price: 350_000,
    status: "active",
    ...overrides,
  };
}

function search(overrides: Partial<PropertySearchInput> = {}): PropertySearchInput {
  return { ...defaultPropertySearch, ...overrides };
}

/** The address `seedProperty` writes by default, so an update can leave it untouched. */
function seededAddress(overrides: Partial<PropertyInput> = {}): PropertyInput {
  return input({
    addressLine1: "100 Test Street",
    city: "Testville",
    stateProvince: "TS",
    postalCode: "00001",
    ...overrides,
  });
}

let worker: TestWorker;

beforeAll(async () => {
  worker = await startTestWorker();
});

afterAll(async () => {
  await worker.dispose();
});

beforeEach(async () => {
  await resetTestWorker(worker);
  geocode.mockReset();
  geocode.mockResolvedValue({
    location: { latitude: 39.7817, longitude: -89.6501, normalizedAddress: "1 Main St, Springfield, IL" },
    cached: false,
    rateLimited: false,
  });
});

describe("visibility rules", () => {
  beforeEach(async () => {
    await seedProperty(worker, { id: "active-a", ownerId: AGENT_A.id, status: "active" });
    await seedProperty(worker, { id: "draft-a", ownerId: AGENT_A.id, status: "draft" });
    await seedProperty(worker, { id: "draft-b", ownerId: AGENT_B.id, status: "draft" });
    await seedProperty(worker, { id: "sold-b", ownerId: AGENT_B.id, status: "sold" });
  });

  it("shows anonymous and viewer accounts active listings only", async () => {
    for (const viewer of [null, VIEWER]) {
      const result = await properties.search(search(), viewer);
      expect(result.items.map((item) => item.property.id)).toEqual(["active-a"]);
      expect(result.total).toBe(1);
    }
  });

  it("lets an agent see their own rows on any status, plus every active listing", async () => {
    const forAgentA = await properties.search(search(), AGENT_A);
    expect(forAgentA.items.map((item) => item.property.id).sort()).toEqual(["active-a", "draft-a"]);

    const forAgentB = await properties.search(search(), AGENT_B);
    expect(forAgentB.items.map((item) => item.property.id).sort()).toEqual(["active-a", "draft-b", "sold-b"]);
  });

  it("lets an admin read every owner's rows on every status", async () => {
    const result = await properties.search(search(), ADMIN);
    expect(result.items.map((item) => item.property.id).sort()).toEqual([
      "active-a",
      "draft-a",
      "draft-b",
      "sold-b",
    ]);
  });

  it("returns a detail to its owner and to admins, and 404s it for everyone else", async () => {
    expect((await properties.getById("draft-a", AGENT_A))?.property.id).toBe("draft-a");
    expect((await properties.getById("draft-a", ADMIN))?.property.id).toBe("draft-a");

    expect(await properties.getById("draft-a", null)).toBeNull();
    expect(await properties.getById("draft-a", VIEWER)).toBeNull();
    expect(await properties.getById("draft-a", AGENT_B)).toBeNull();
    expect(await properties.getById("missing-id", ADMIN)).toBeNull();
  });

  it("never writes a non-active detail into the anonymous cache", async () => {
    await properties.getById("draft-a", AGENT_A);

    expect(await properties.getById("draft-a", null)).toBeNull();
    expect((await worker.kv.list({ prefix: "properties:draft-a" })).keys).toEqual([]);
  });

  it("keeps non-active rows out of the featured list", async () => {
    const featured = await properties.getFeaturedProperties();
    expect(featured.map((item) => item.property.id)).toEqual(["active-a"]);
  });
});

describe("search filters", () => {
  beforeEach(async () => {
    await seedProperty(worker, {
      id: "oak-1",
      addressLine1: "100 Oak Street",
      city: "Miami",
      priceCents: 30_000_000,
      bedrooms: 2,
      bathrooms: 1,
      createdAt: 1_000,
    });
    await seedProperty(worker, {
      id: "oak-2",
      addressLine1: "200 Pine Street",
      city: "Miami",
      postalCode: "90210",
      priceCents: 70_000_000,
      bedrooms: 4,
      bathrooms: 2.5,
      createdAt: 2_000,
    });
    await seedProperty(worker, {
      id: "percent",
      addressLine1: "100% Real Avenue",
      city: "Tampa",
      priceCents: 50_000_000,
      bedrooms: 3,
      bathrooms: 2,
      createdAt: 3_000,
    });
  });

  it("matches the text search over address, city and postal code", async () => {
    expect((await properties.search(search({ q: "oak" }), null)).items.map((i) => i.property.id)).toEqual([
      "oak-1",
    ]);
    expect((await properties.search(search({ q: "miami" }), null)).total).toBe(2);
    expect((await properties.search(search({ q: "90210" }), null)).items.map((i) => i.property.id)).toEqual([
      "oak-2",
    ]);
  });

  it("treats LIKE wildcards in the search text as literal characters", async () => {
    const result = await properties.search(search({ q: "%" }), null);
    expect(result.items.map((item) => item.property.id)).toEqual(["percent"]);
  });

  it("applies the price, bedroom and bathroom minimums", async () => {
    expect(
      (await properties.search(search({ minPrice: 400_000 }), null)).items.map((i) => i.property.id).sort(),
    ).toEqual(["oak-2", "percent"]);
    expect(
      (await properties.search(search({ maxPrice: 400_000 }), null)).items.map((i) => i.property.id),
    ).toEqual(["oak-1"]);
    expect(
      (await properties.search(search({ minBedrooms: 3 }), null)).items.map((i) => i.property.id).sort(),
    ).toEqual(["oak-2", "percent"]);
    expect(
      (await properties.search(search({ minBathrooms: 2.5 }), null)).items.map((i) => i.property.id),
    ).toEqual(["oak-2"]);
  });

  it("sorts by price or by newest first", async () => {
    expect(
      (await properties.search(search({ sort: "price_asc" }), null)).items.map((i) => i.property.id),
    ).toEqual(["oak-1", "percent", "oak-2"]);
    expect(
      (await properties.search(search({ sort: "price_desc" }), null)).items.map((i) => i.property.id),
    ).toEqual(["oak-2", "percent", "oak-1"]);
    expect((await properties.search(search({ sort: "newest" }), null)).items.map((i) => i.property.id)).toEqual([
      "percent",
      "oak-2",
      "oak-1",
    ]);
  });

  it("paginates and clamps a page past the end", async () => {
    const first = await properties.search(search({ pageSize: 2, page: 1 }), null);
    expect(first).toMatchObject({ total: 3, page: 1, pageCount: 2, pageSize: 2 });
    expect(first.items).toHaveLength(2);

    const clamped = await properties.search(search({ pageSize: 2, page: 99 }), null);
    expect(clamped.page).toBe(2);
    expect(clamped.items.map((item) => item.property.id)).toEqual(["oak-1"]);
  });

  it("never includes ownership in a listing payload", async () => {
    const [item] = (await properties.search(search(), null)).items;
    expect(item?.property).not.toHaveProperty("ownerId");
  });
});

describe("list cache query hashing", () => {
  beforeEach(async () => {
    await seedProperty(worker, { id: "oak", addressLine1: "100 Oak Street", city: "Miami" });
  });

  it("keys the public list on a hash of the normalized filters, never the raw text", async () => {
    await properties.search(search({ q: "Oak" }), null);
    await properties.search(search({ q: "oak" }), null);

    const keys = (await worker.kv.list({ prefix: "properties:list:" })).keys;
    expect(keys).toHaveLength(1);
    expect(keys[0]?.name).toMatch(/^properties:list:0:[0-9a-f]{32}$/);
    expect(keys[0]?.name).not.toContain("oak");
  });

  it("ignores the order the filter fields were written in", async () => {
    const forward: PropertySearchInput = { ...defaultPropertySearch, q: "oak" };
    const reversed: PropertySearchInput = {
      pageSize: forward.pageSize,
      page: forward.page,
      sort: forward.sort,
      minBathrooms: forward.minBathrooms,
      minBedrooms: forward.minBedrooms,
      maxPrice: forward.maxPrice,
      minPrice: forward.minPrice,
      q: "oak",
    };

    await properties.search(forward, null);
    await properties.search(reversed, null);

    expect((await worker.kv.list({ prefix: "properties:list:" })).keys).toHaveLength(1);
  });

  it("keeps different filters on different keys", async () => {
    await properties.search(search({ q: "oak" }), null);
    await properties.search(search({ q: "oak", page: 2 }), null);
    await properties.search(search({ q: "oak", sort: "price_asc" }), null);

    expect((await worker.kv.list({ prefix: "properties:list:" })).keys).toHaveLength(3);
  });

  it("never caches an owner-scoped search", async () => {
    await properties.search(search({ q: "oak" }), AGENT_A);

    expect((await worker.kv.list({ prefix: "properties:list:" })).keys).toEqual([]);
  });
});

describe("create", () => {
  it("stores dollars as cents and the geocoded coordinates", async () => {
    const created = await properties.create(input({ price: 350_000 }), AGENT_A.id);

    expect(created.geocode).toBe("verified");
    const stored = await properties.getOwnedProperty(created.id, AGENT_A.id);
    expect(stored?.property).toMatchObject({
      priceCents: 350_000_00,
      latitude: 39.7817,
      longitude: -89.6501,
      septic: "city",
      water: "well",
      status: "active",
    });
  });

  it("still saves the property when the location cannot be verified", async () => {
    geocode.mockResolvedValue({ location: null, cached: false, rateLimited: false });

    const created = await properties.create(input({ city: "Springfield" }), AGENT_A.id);

    expect(created.geocode).toBe("unverified");
    const stored = await properties.getOwnedProperty(created.id, AGENT_A.id);
    expect(stored?.property).toMatchObject({ latitude: null, longitude: null });
  });

  it("reports a spent geocode budget without failing the save", async () => {
    geocode.mockResolvedValue({ location: null, cached: false, rateLimited: true });

    const created = await properties.create(input(), AGENT_A.id);

    expect(created.geocode).toBe("rate_limited");
    expect(await properties.getOwnedProperty(created.id, AGENT_A.id)).not.toBeNull();
  });

  it("stores a vacant-land listing without bedrooms, baths or utilities", async () => {
    const created = await properties.create(
      input({
        bedrooms: null,
        bathrooms: null,
        lotSize: 12.5,
        lotSizeUnit: "acres",
        electric: "available",
      }),
      AGENT_A.id,
    );

    const stored = await properties.getOwnedProperty(created.id, AGENT_A.id);
    expect(stored?.property).toMatchObject({
      bedrooms: null,
      bathrooms: null,
      lotSize: 12.5,
      lotSizeUnit: "acres",
      electric: "available",
    });
    expect((await properties.search(search(), null)).items[0]?.property.id).toBe(created.id);
    expect((await properties.search(search({ minBedrooms: 1 }), null)).items).toEqual([]);
  });

  it("drops a lot size unit that comes without a size", async () => {
    const created = await properties.create(input({ lotSize: null, lotSizeUnit: "acres" }), AGENT_A.id);

    const stored = await properties.getOwnedProperty(created.id, AGENT_A.id);
    expect(stored?.property).toMatchObject({ lotSize: null, lotSizeUnit: null });
  });

  it("keeps a new draft out of the public list", async () => {
    const created = await properties.create(input({ status: "draft" }), AGENT_A.id);

    expect((await properties.search(search(), null)).items).toEqual([]);
    expect((await properties.search(search(), AGENT_A)).items.map((item) => item.property.id)).toEqual([
      created.id,
    ]);
  });
});

describe("update ownership (IDOR)", () => {
  let propertyId: string;

  beforeEach(async () => {
    propertyId = await seedProperty(worker, {
      id: "owned-by-a",
      ownerId: AGENT_A.id,
      priceCents: 10_000_000,
      createdAt: 1_000,
    });
  });

  it("lets the owner update their own listing", async () => {
    const result = await properties.update(propertyId, input({ price: 200_000 }), scopeOf(AGENT_A), AGENT_A.id);

    expect(result.updated).toBe(true);
    const stored = await properties.getOwnedProperty(propertyId, AGENT_A.id);
    expect(stored?.property.priceCents).toBe(200_000_00);
    expect(stored?.property.updatedAt).toBeGreaterThan(1_000);
  });

  it("refuses a viewer writing through their own scope", async () => {
    expect(canWriteListings(VIEWER.role)).toBe(false);

    const result = await properties.update(propertyId, input({ price: 1 }), scopeOf(VIEWER), VIEWER.id);

    expect(result.updated).toBe(false);
    expect((await properties.getOwnedProperty(propertyId, null))?.property.priceCents).toBe(100_000_00);
  });

  it("refuses another agent's property and leaves the row untouched", async () => {
    const result = await properties.update(propertyId, input({ price: 1 }), scopeOf(AGENT_B), AGENT_B.id);

    expect(result.updated).toBe(false);
    expect((await properties.getOwnedProperty(propertyId, AGENT_A.id))?.property.priceCents).toBe(100_000_00);
  });

  it("lets an admin update any owner's listing", async () => {
    const result = await properties.update(propertyId, input({ price: 123_456 }), scopeOf(ADMIN), ADMIN.id);

    expect(result.updated).toBe(true);
    expect((await properties.getOwnedProperty(propertyId, AGENT_A.id))?.property.priceCents).toBe(123_456_00);
  });

  it("re-geocodes only when an address field changed", async () => {
    await seedProperty(worker, {
      id: "located",
      ownerId: AGENT_A.id,
      latitude: 1.5,
      longitude: -2.5,
      createdAt: 1_000,
    });

    const priceOnly = await properties.update(
      "located",
      seededAddress({ price: 999 }),
      scopeOf(AGENT_A),
      AGENT_A.id,
    );
    expect(priceOnly.geocode).toBe("verified");
    expect(geocode).not.toHaveBeenCalled();
    expect(await properties.getOwnedProperty("located", AGENT_A.id)).toMatchObject({
      property: { latitude: 1.5, longitude: -2.5, priceCents: 999_00 },
    });

    await properties.update(
      "located",
      seededAddress({ city: "Chicago", price: 999 }),
      scopeOf(AGENT_A),
      AGENT_A.id,
    );
    expect(geocode).toHaveBeenCalledTimes(1);
    expect(geocode.mock.calls[0]?.[0]).toMatchObject({ city: "Chicago" });
    expect(await properties.getOwnedProperty("located", AGENT_A.id)).toMatchObject({
      property: { latitude: 39.7817, longitude: -89.6501 },
    });
  });
});

describe("remove ownership (IDOR)", () => {
  let propertyId: string;

  beforeEach(async () => {
    propertyId = await seedProperty(worker, { id: "owned-by-a", ownerId: AGENT_A.id });
  });

  it("lets the owner delete their own listing", async () => {
    expect(await properties.remove(propertyId, scopeOf(AGENT_A))).toBe(true);
    expect(await properties.getOwnedProperty(propertyId, null)).toBeNull();
  });

  it("refuses a viewer and another agent, leaving the row in place", async () => {
    expect(await properties.remove(propertyId, scopeOf(VIEWER))).toBe(false);
    expect(await properties.remove(propertyId, scopeOf(AGENT_B))).toBe(false);
    expect(await properties.getOwnedProperty(propertyId, AGENT_A.id)).not.toBeNull();
  });

  it("lets an admin delete any owner's listing", async () => {
    expect(await properties.remove(propertyId, scopeOf(ADMIN))).toBe(true);
    expect(await properties.getOwnedProperty(propertyId, null)).toBeNull();
  });

  it("clears the property's R2 prefix and its media rows", async () => {
    await worker.r2.put(`properties/${propertyId}/media/one`, new Uint8Array([1, 2, 3]));
    await seedProperty(worker, { id: "other-property", ownerId: AGENT_A.id });
    await worker.r2.put("properties/other-property/media/keep", new Uint8Array([4]));

    expect(await properties.remove(propertyId, scopeOf(AGENT_A))).toBe(true);

    expect((await worker.r2.list({ prefix: `properties/${propertyId}/media/` })).objects).toEqual([]);
    expect((await worker.r2.list({ prefix: "properties/other-property/media/" })).objects).toHaveLength(1);
  });
});

describe("owner-scoped reads", () => {
  it("lists only the given owner's rows, newest edit first", async () => {
    await seedProperty(worker, { id: "a-old", ownerId: AGENT_A.id, status: "draft", createdAt: 1_000 });
    await seedProperty(worker, { id: "a-new", ownerId: AGENT_A.id, status: "sold", createdAt: 2_000 });
    await seedProperty(worker, { id: "b", ownerId: AGENT_B.id, status: "active" });

    expect((await properties.listByOwner(AGENT_A.id)).map((item) => item.property.id).sort()).toEqual([
      "a-new",
      "a-old",
    ]);
    expect((await properties.listByOwner(null)).map((item) => item.property.id)).toHaveLength(3);
  });

  it("returns an owned property on any status and nothing for a foreign id", async () => {
    const id = await seedProperty(worker, { id: "a-draft", ownerId: AGENT_A.id, status: "draft" });

    expect((await properties.getOwnedProperty(id, AGENT_A.id))?.property.id).toBe("a-draft");
    expect(await properties.getOwnedProperty(id, AGENT_B.id)).toBeNull();
  });
});
