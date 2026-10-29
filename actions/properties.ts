"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { fail, ok } from "@/lib/action-result";
import { AuthError, requireUser } from "@/lib/auth/current-user";
import { canWriteListings, getFreshRole, ownerScope } from "@/lib/auth/guards";
import * as propertiesService from "@/services/properties";
import { propertyInputSchema } from "@/validations/property";

const FORBIDDEN = "You do not have permission to change listings.";
const SIGNED_OUT = "Your session expired. Sign in again to continue.";
const GEOCODE_RATE_LIMITED =
  "Saved, but the location was not verified because you reached the geocoding limit. Add the coordinates later by saving the address again.";

function revalidateListings(): void {
  revalidatePath("/dashboard");
  revalidatePath("/properties");
}

/** Only the quota failure deserves its own message; other misses keep the "Location not verified" note. */
function geocodeWarning(status: propertiesService.GeocodeStatus): string | undefined {
  return status === "rate_limited" ? GEOCODE_RATE_LIMITED : undefined;
}

export async function createProperty(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    if (!canWriteListings(user.role)) return fail(FORBIDDEN);
    const parsed = propertyInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return fail("Please fix the highlighted fields.", parsed.error.flatten().fieldErrors);
    }

    const created = await propertiesService.create(parsed.data, user.id);
    revalidateListings();
    return ok({ id: created.id }, geocodeWarning(created.geocode));
  } catch (error) {
    if (error instanceof AuthError) return fail(SIGNED_OUT);
    console.error("[actions/properties/createProperty]", error);
    return fail("Could not save the property. Please try again.");
  }
}

export async function updateProperty(
  id: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    if (!canWriteListings(user.role)) return fail(FORBIDDEN);
    const parsed = propertyInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return fail("Please fix the highlighted fields.", parsed.error.flatten().fieldErrors);
    }

    const updated = await propertiesService.update(id, parsed.data, ownerScope(user), user.id);
    if (!updated.updated) return fail("That property could not be found.");
    revalidateListings();
    revalidatePath(`/properties/${id}`);
    return ok({ id }, geocodeWarning(updated.geocode));
  } catch (error) {
    if (error instanceof AuthError) return fail(SIGNED_OUT);
    console.error("[actions/properties/updateProperty]", error);
    return fail("Could not save the property. Please try again.");
  }
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    // Re-read the role from Clerk: the session claim can lag behind a role change.
    const role = await getFreshRole(user.id);
    if (!canWriteListings(role)) return fail(FORBIDDEN);
    const removed = await propertiesService.remove(id, ownerScope({ id: user.id, role }));
    if (!removed) return fail("That property could not be found.");
    revalidateListings();
    return ok(undefined);
  } catch (error) {
    if (error instanceof AuthError) return fail(SIGNED_OUT);
    console.error("[actions/properties/deleteProperty]", error);
    return fail("Could not delete the property. Please try again.");
  }
}
