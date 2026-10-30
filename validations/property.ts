import { z } from "zod";
import {
  propertyStatusValues,
  septicValues,
  waterValues,
  type Property,
} from "@/types/property";

const MAX_PRICE_DOLLARS = 1_000_000_000;
const MAX_COUNT = 50;

function requiredText(label: string, max: number) {
  return z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);
}

/**
 * Form controls hand back strings, so numeric fields validate as strings and transform to numbers.
 * The same schema serves Server Actions, where `FormData` values are strings too.
 */
function wholeAmount(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((value) => Number.isInteger(Number(value)), `Enter ${label.toLowerCase()} as a whole number.`)
    .refine(
      (value) => Number(value) >= min && Number(value) <= max,
      `${label} must be between ${min} and ${max}.`,
    )
    .transform(Number);
}

/**
 * An unanswered select arrives as an empty string and is stored as NULL ("not specified").
 * An omitted field means the same thing, so a form that predates the field still submits.
 */
function optionalChoice<T extends string>(values: readonly T[], message: string) {
  return z
    .string()
    .optional()
    .refine((value) => value === undefined || value === "" || values.includes(value as T), {
      message,
    })
    .transform((value) => (value === undefined || value === "" ? null : (value as T)));
}

function halfStepAmount(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((value) => Number.isFinite(Number(value)), `Enter ${label.toLowerCase()} as a number.`)
    .refine(
      (value) => Number(value) >= min && Number(value) <= max,
      `${label} must be between ${min} and ${max}.`,
    )
    .refine(
      (value) => Math.round(Number(value) * 2) === Number(value) * 2,
      "Use half-bath increments (0.5).",
    )
    .transform(Number);
}

export const propertyInputSchema = z.object({
  addressLine1: requiredText("Address line 1", 200),
  addressLine2: z.string().trim().max(200, "Address line 2 is too long."),
  city: requiredText("City", 100),
  stateProvince: requiredText("State or province", 100),
  postalCode: z.string().trim().min(2, "Postal code is required.").max(20, "Postal code is too long."),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .length(2, "Use a two-letter country code.")
    .regex(/^[A-Z]{2}$/, "Use a two-letter country code."),
  bedrooms: wholeAmount("Bedrooms", 0, MAX_COUNT),
  bathrooms: halfStepAmount("Bathrooms", 0, MAX_COUNT),
  septic: optionalChoice(septicValues, "Choose city or tank."),
  water: optionalChoice(waterValues, "Choose city or well."),
  price: wholeAmount("Price", 0, MAX_PRICE_DOLLARS),
  status: z.enum(propertyStatusValues, { error: "Choose a status." }),
});

/** Raw form values are strings; the parsed output is numeric and price stays in dollars. */
export type PropertyFormValues = z.input<typeof propertyInputSchema>;
export type PropertyInput = z.output<typeof propertyInputSchema>;

export const emptyPropertyFormValues: PropertyFormValues = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "US",
  bedrooms: "",
  bathrooms: "",
  septic: "",
  water: "",
  price: "",
  status: "draft",
};

export function propertyToFormValues(property: Property): PropertyFormValues {
  return {
    addressLine1: property.addressLine1,
    addressLine2: property.addressLine2 ?? "",
    city: property.city,
    stateProvince: property.stateProvince,
    postalCode: property.postalCode,
    country: property.country,
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    septic: property.septic ?? "",
    water: property.water ?? "",
    price: String(Math.round(property.priceCents / 100)),
    status: property.status,
  };
}
