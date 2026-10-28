"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/current-user";
import * as propertiesService from "@/services/properties";
import { propertyInputSchema } from "@/validations/property";

function revalidateListings(): void {
  revalidatePath("/dashboard");
  revalidatePath("/properties");
}

export async function createProperty(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    const parsed = propertyInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return fail("Please fix the highlighted fields.", parsed.error.flatten().fieldErrors);
    }

    const id = await propertiesService.create(parsed.data, user.id);
    revalidateListings();
    return ok({ id });
  } catch (error) {
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
    const user = await getCurrentUser();
    const parsed = propertyInputSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return fail("Please fix the highlighted fields.", parsed.error.flatten().fieldErrors);
    }

    const updated = await propertiesService.update(id, parsed.data, user.id);
    if (!updated) return fail("That property could not be found.");
    revalidateListings();
    revalidatePath(`/properties/${id}`);
    return ok({ id });
  } catch (error) {
    console.error("[actions/properties/updateProperty]", error);
    return fail("Could not save the property. Please try again.");
  }
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const removed = await propertiesService.remove(id, user.id);
    if (!removed) return fail("That property could not be found.");
    revalidateListings();
    return ok(undefined);
  } catch (error) {
    console.error("[actions/properties/deleteProperty]", error);
    return fail("Could not delete the property. Please try again.");
  }
}
