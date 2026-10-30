import { describe, expect, it } from "vitest";
import type { Property } from "@/types/property";
import {
  MEDIA_ACCEPT,
  MEDIA_MIME_TYPES,
  MAX_ALT_TEXT_LENGTH,
  isAllowedMediaType,
  isImageMedia,
  mediaAltSchema,
} from "@/validations/media";
import {
  emptyPropertyFormValues,
  propertyInputSchema,
  propertyToFormValues,
  type PropertyInput,
} from "@/validations/property";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  defaultPropertySearch,
  parsePropertySearch,
  propertySearchToParams,
} from "@/validations/property-search";

const validFormValues = {
  addressLine1: "  900 NW 8th Ave  ",
  addressLine2: "",
  city: " Miami ",
  stateProvince: "FL",
  postalCode: "33136",
  country: "us",
  bedrooms: "4",
  bathrooms: "2.5",
  septic: "tank",
  water: "well",
  price: "1250000",
  status: "active",
};

const validPropertyInput: PropertyInput = {
  addressLine1: "900 NW 8th Ave",
  addressLine2: "",
  city: "Miami",
  stateProvince: "FL",
  postalCode: "33136",
  country: "US",
  bedrooms: 4,
  bathrooms: 2.5,
  septic: "tank",
  water: "well",
  price: 1_250_000,
  status: "active",
};

function firstIssueMessage(input: Record<string, string>): string | undefined {
  const parsed = propertyInputSchema.safeParse(input);
  return parsed.success ? undefined : parsed.error.issues[0]?.message;
}

describe("propertyInputSchema", () => {
  it("trims text, upper-cases the country and converts the numeric strings", () => {
    const parsed = propertyInputSchema.parse(validFormValues);

    expect(parsed).toEqual({
      addressLine1: "900 NW 8th Ave",
      addressLine2: "",
      city: "Miami",
      stateProvince: "FL",
      postalCode: "33136",
      country: "US",
      bedrooms: 4,
      bathrooms: 2.5,
      septic: "tank",
      water: "well",
      price: 1_250_000,
      status: "active",
    });
  });

  it("rejects blank required text", () => {
    expect(firstIssueMessage({ ...validFormValues, addressLine1: "   " })).toBe("Address line 1 is required.");
    expect(firstIssueMessage({ ...validFormValues, city: "" })).toBe("City is required.");
  });

  it("rejects an address line and a postal code longer than the column allows", () => {
    const longAddress = propertyInputSchema.safeParse({
      ...validFormValues,
      addressLine1: "a".repeat(201),
    });
    expect(longAddress.success).toBe(false);
    expect(longAddress.error?.issues[0]?.message).toBe("Address line 1 is too long.");

    expect(firstIssueMessage({ ...validFormValues, postalCode: "1" })).toBe("Postal code is required.");
  });

  it("accepts only a two-letter country code", () => {
    expect(firstIssueMessage({ ...validFormValues, country: "USA" })).toBe("Use a two-letter country code.");
    expect(firstIssueMessage({ ...validFormValues, country: "12" })).toBe("Use a two-letter country code.");
  });

  it("rejects fractional bedrooms and out-of-range counts", () => {
    expect(firstIssueMessage({ ...validFormValues, bedrooms: "2.5" })).toBe(
      "Enter bedrooms as a whole number.",
    );
    expect(firstIssueMessage({ ...validFormValues, bedrooms: "-1" })).toBe("Bedrooms must be between 0 and 50.");
    expect(firstIssueMessage({ ...validFormValues, bedrooms: "51" })).toBe("Bedrooms must be between 0 and 50.");
  });

  it("accepts half-bath increments only", () => {
    expect(propertyInputSchema.parse({ ...validFormValues, bathrooms: "3" }).bathrooms).toBe(3);
    expect(propertyInputSchema.parse({ ...validFormValues, bathrooms: "2.5" }).bathrooms).toBe(2.5);
    expect(firstIssueMessage({ ...validFormValues, bathrooms: "2.7" })).toBe(
      "Use half-bath increments (0.5).",
    );
  });

  it("rejects a price outside the stored range", () => {
    expect(firstIssueMessage({ ...validFormValues, price: "-1" })).toBe(
      "Price must be between 0 and 1000000000.",
    );
    expect(firstIssueMessage({ ...validFormValues, price: "1000000001" })).toBe(
      "Price must be between 0 and 1000000000.",
    );
    expect(firstIssueMessage({ ...validFormValues, price: "1.5" })).toBe(
      "Enter price as a whole number.",
    );
  });

  it("accepts city/tank for septic and city/well for water, with blank meaning not specified", () => {
    expect(propertyInputSchema.parse({ ...validFormValues, septic: "city", water: "city" })).toMatchObject({
      septic: "city",
      water: "city",
    });
    expect(propertyInputSchema.parse({ ...validFormValues, septic: "", water: "" })).toMatchObject({
      septic: null,
      water: null,
    });
    expect(firstIssueMessage({ ...validFormValues, septic: "well" })).toBe("Choose city or tank.");
    expect(firstIssueMessage({ ...validFormValues, water: "tank" })).toBe("Choose city or well.");
  });

  it("accepts only the four stored statuses", () => {
    for (const status of ["draft", "active", "sold", "off_market"]) {
      expect(propertyInputSchema.parse({ ...validFormValues, status }).status).toBe(status);
    }
    expect(firstIssueMessage({ ...validFormValues, status: "pending" })).toBe("Choose a status.");
  });

  it("treats empty numeric fields as missing, not as zero", () => {
    expect(firstIssueMessage({ ...validFormValues, bedrooms: "" })).toBe("Bedrooms is required.");
    expect(firstIssueMessage({ ...validFormValues, price: "   " })).toBe("Price is required.");
  });

  it("converts a stored property back into form strings, with price in dollars", () => {
    const property: Property = {
      id: "0b1e1c9e-90c4-4b4c-8f0a-1c3f4c09b7d1",
      addressLine1: "900 NW 8th Ave",
      addressLine2: null,
      city: "Miami",
      stateProvince: "FL",
      postalCode: "33136",
      country: "US",
      latitude: 25.785,
      longitude: -80.2,
      bedrooms: 4,
      bathrooms: 2.5,
      septic: "tank",
      water: "well",
      priceCents: 125_000_050,
      currency: "USD",
      status: "active",
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000,
    };

    expect(propertyToFormValues(property)).toEqual({
      ...validFormValues,
      addressLine1: "900 NW 8th Ave",
      city: "Miami",
      addressLine2: "",
      country: "US",
      price: "1250001",
    });
  });

  it("starts a new form on a draft with a US country and no numeric values", () => {
    expect(emptyPropertyFormValues).toMatchObject({ country: "US", status: "draft", price: "", bedrooms: "" });
  });

  it("round-trips the parsed input back through the form values", () => {
    const formValues = propertyToFormValues({
      ...validPropertyInput,
      addressLine2: null,
      id: "id",
      latitude: null,
      longitude: null,
      priceCents: validPropertyInput.price * 100,
      currency: "USD",
      createdAt: 0,
      updatedAt: 0,
    });

    expect(propertyInputSchema.parse(formValues)).toEqual(validPropertyInput);
  });
});

describe("propertySearchSchema", () => {
  it("falls back to the defaults for an empty query string", () => {
    expect(defaultPropertySearch).toEqual({
      q: "",
      minPrice: undefined,
      maxPrice: undefined,
      minBedrooms: undefined,
      minBathrooms: undefined,
      sort: "newest",
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it("coerces a valid query string", () => {
    expect(
      parsePropertySearch({
        q: "  miami  ",
        minPrice: "100000",
        maxPrice: "900000",
        minBedrooms: "2",
        minBathrooms: "1.5",
        sort: "price_asc",
        page: "3",
        pageSize: "12",
      }),
    ).toEqual({
      q: "miami",
      minPrice: 100_000,
      maxPrice: 900_000,
      minBedrooms: 2,
      minBathrooms: 1.5,
      sort: "price_asc",
      page: 3,
      pageSize: 12,
    });
  });

  it("falls back field by field instead of rejecting a junk query string", () => {
    expect(
      parsePropertySearch({
        minPrice: "not-a-price",
        minBedrooms: "-3",
        sort: "cheapest",
        page: "0",
        pageSize: "500",
      }),
    ).toMatchObject({
      minPrice: undefined,
      minBedrooms: undefined,
      sort: "newest",
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it("clamps the page size and ignores array-valued params beyond the first", () => {
    expect(parsePropertySearch({ pageSize: String(MAX_PAGE_SIZE + 1) }).pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePropertySearch({ q: ["oak", "pine"] }).q).toBe("oak");
  });

  it("ignores blank numeric params", () => {
    expect(parsePropertySearch({ minPrice: "", maxBedrooms: "", minBathrooms: "  " })).toMatchObject({
      minPrice: undefined,
      minBathrooms: undefined,
    });
  });
});

describe("propertySearchToParams", () => {
  it("omits every default so the canonical URL stays short", () => {
    expect(propertySearchToParams(defaultPropertySearch).toString()).toBe("");
  });

  it("round-trips a non-default search through the URL", () => {
    const search = {
      q: "oak",
      minPrice: 250_000,
      maxPrice: 750_000,
      minBedrooms: 2,
      minBathrooms: 1.5,
      sort: "price_desc" as const,
      page: 2,
      pageSize: 12,
    };

    const params = propertySearchToParams(search);
    expect(params.get("q")).toBe("oak");
    expect(params.get("sort")).toBe("price_desc");
    expect(parsePropertySearch(Object.fromEntries(params))).toEqual(search);
  });
});

describe("media validations", () => {
  it("allows only the four supported types", () => {
    expect(MEDIA_MIME_TYPES).toEqual(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
    expect(isAllowedMediaType("image/png")).toBe(true);
    expect(isAllowedMediaType("application/pdf")).toBe(true);
    expect(isAllowedMediaType("image/gif")).toBe(false);
    expect(isAllowedMediaType("image/svg+xml")).toBe(false);
    expect(isAllowedMediaType("text/plain")).toBe(false);
  });

  it("separates photos from documents by mime type", () => {
    expect(isImageMedia("image/webp")).toBe(true);
    expect(isImageMedia("application/pdf")).toBe(false);
  });

  it("builds the file input's accept attribute from the allow-list", () => {
    expect(MEDIA_ACCEPT).toBe("image/jpeg,image/png,image/webp,application/pdf");
  });

  it("trims alt text and caps its length", () => {
    expect(mediaAltSchema.parse("  Front porch  ")).toBe("Front porch");
    expect(mediaAltSchema.safeParse("a".repeat(MAX_ALT_TEXT_LENGTH)).success).toBe(true);
    const tooLong = mediaAltSchema.safeParse("a".repeat(MAX_ALT_TEXT_LENGTH + 1));
    expect(tooLong.success).toBe(false);
    expect(tooLong.error?.issues[0]?.message).toBe(
      `Alt text must be ${MAX_ALT_TEXT_LENGTH} characters or fewer.`,
    );
  });
});
