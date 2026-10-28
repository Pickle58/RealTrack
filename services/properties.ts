import { mockProperties, type MockProperty } from "@/lib/mock-data";
import type {
  Property,
  PropertyDetail,
  PropertyListItem,
  PropertySearchResult,
} from "@/types/property";
import {
  defaultPropertySearch,
  type PropertySearchInput,
} from "@/validations/property-search";

export const FEATURED_PROPERTY_LIMIT = 6;

function toListItem(property: MockProperty): PropertyListItem {
  return { property, coverImage: property.images[0] ?? null };
}

function matchesSearch(property: Property, search: PropertySearchInput): boolean {
  if (search.q) {
    const needle = search.q.toLowerCase();
    const haystack = [
      property.addressLine1,
      property.addressLine2 ?? "",
      property.city,
      property.stateProvince,
      property.postalCode,
    ]
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(needle)) return false;
  }

  if (search.minPrice !== undefined && property.priceCents < search.minPrice * 100) return false;
  if (search.maxPrice !== undefined && property.priceCents > search.maxPrice * 100) return false;
  if (search.minBedrooms !== undefined && property.bedrooms < search.minBedrooms) return false;
  if (search.minBathrooms !== undefined && property.bathrooms < search.minBathrooms) return false;

  return true;
}

function compareBySort(a: Property, b: Property, sort: PropertySearchInput["sort"]): number {
  if (sort === "price_asc") return a.priceCents - b.priceCents;
  if (sort === "price_desc") return b.priceCents - a.priceCents;
  return b.createdAt - a.createdAt;
}

// Phase 1 reads the mock module; Phase 2 swaps the body for D1 without changing the signature.
export async function searchActiveProperties(
  search: PropertySearchInput,
): Promise<PropertySearchResult> {
  const matches = mockProperties.filter(
    (property) => property.status === "active" && matchesSearch(property, search),
  );

  const sorted = [...matches].sort(
    (a, b) => compareBySort(a, b, search.sort) || a.id.localeCompare(b.id),
  );

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / search.pageSize));
  const page = Math.min(search.page, pageCount);
  const start = (page - 1) * search.pageSize;
  const items = sorted.slice(start, start + search.pageSize).map(toListItem);

  return { items, total, page, pageSize: search.pageSize, pageCount };
}

export async function getActivePropertyById(id: string): Promise<PropertyDetail | null> {
  const property = mockProperties.find((item) => item.id === id && item.status === "active");
  if (!property) return null;

  return { property, images: property.images };
}

export async function getFeaturedProperties(
  limit = FEATURED_PROPERTY_LIMIT,
): Promise<PropertyListItem[]> {
  const result = await searchActiveProperties({ ...defaultPropertySearch, pageSize: limit });
  return result.items;
}

// Phase 1 dashboard preview: every status, newest edit first. Phase 2 scopes this to the signed-in owner.
export async function listDashboardProperties(): Promise<PropertyListItem[]> {
  return [...mockProperties]
    .sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id))
    .map(toListItem);
}

// Any status, so the edit form can prefill drafts, sold and off-market listings.
export async function getPropertyForEdit(id: string): Promise<PropertyDetail | null> {
  const property = mockProperties.find((item) => item.id === id);
  if (!property) return null;

  return { property, images: property.images };
}
