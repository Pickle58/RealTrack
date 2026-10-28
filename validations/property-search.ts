import { z } from "zod";

export const propertySortValues = ["newest", "price_asc", "price_desc"] as const;

export const DEFAULT_PAGE_SIZE = 6;
export const MAX_PAGE_SIZE = 50;

const MAX_PRICE_DOLLARS = 1_000_000_000;
const MAX_COUNT = 50;

/** Search params arrive as strings (or repeat as arrays) and may be empty or junk; every field falls back instead of rejecting the whole query. */
function optionalNumberParam(max: number, integer = false) {
  const numberSchema = integer
    ? z.coerce.number().int().min(0).max(max)
    : z.coerce.number().min(0).max(max);

  return z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      numberSchema.optional(),
    )
    .catch(undefined);
}

export const propertySortSchema = z.enum(propertySortValues).catch("newest");

export const propertySearchSchema = z.object({
  q: z.string().trim().max(120).catch(""),
  minPrice: optionalNumberParam(MAX_PRICE_DOLLARS),
  maxPrice: optionalNumberParam(MAX_PRICE_DOLLARS),
  minBedrooms: optionalNumberParam(MAX_COUNT, true),
  minBathrooms: optionalNumberParam(MAX_COUNT),
  sort: propertySortSchema,
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).catch(DEFAULT_PAGE_SIZE),
});

export type PropertySearchInput = z.infer<typeof propertySearchSchema>;

export const defaultPropertySearch: PropertySearchInput = propertySearchSchema.parse({});

export function parsePropertySearch(
  raw: Record<string, string | string[] | undefined>,
): PropertySearchInput {
  const singleValues: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (typeof single === "string") singleValues[key] = single;
  }

  const parsed = propertySearchSchema.safeParse(singleValues);
  return parsed.success ? parsed.data : defaultPropertySearch;
}

export function propertySearchToParams(search: PropertySearchInput): URLSearchParams {
  const params = new URLSearchParams();

  if (search.q) params.set("q", search.q);
  if (search.minPrice !== undefined) params.set("minPrice", String(search.minPrice));
  if (search.maxPrice !== undefined) params.set("maxPrice", String(search.maxPrice));
  if (search.minBedrooms !== undefined) params.set("minBedrooms", String(search.minBedrooms));
  if (search.minBathrooms !== undefined) params.set("minBathrooms", String(search.minBathrooms));
  if (search.sort !== "newest") params.set("sort", search.sort);
  if (search.page > 1) params.set("page", String(search.page));
  if (search.pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(search.pageSize));

  return params;
}
