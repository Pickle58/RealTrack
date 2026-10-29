"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { fail, ok } from "@/lib/action-result";
import { AuthError, requireUser } from "@/lib/auth/current-user";
import { canWriteListings, getFreshRole, ownerScope } from "@/lib/auth/guards";
import { consumeRateLimit } from "@/lib/kv";
import {
  MEDIA_UPLOAD_RATE_LIMIT_MAX,
  MEDIA_UPLOAD_RATE_LIMIT_SCOPE,
  MEDIA_UPLOAD_RATE_LIMIT_WINDOW_SECONDS,
  MediaError,
  type MediaErrorCode,
} from "@/services/media";
import * as mediaService from "@/services/media";
import type { MediaItem } from "@/types/media";
import { mediaAltSchema } from "@/validations/media";

const FORBIDDEN = "You do not have permission to change media.";
const SIGNED_OUT = "Your session expired. Sign in again to continue.";
const GENERIC = "Could not save the media change. Please try again.";
const RATE_LIMITED =
  "You have reached the upload limit (60 files an hour). Try again later or delete a file you no longer need.";

const MEDIA_MESSAGES: Record<MediaErrorCode, string> = {
  not_found: "That media file could not be found.",
  empty_file: "That file is empty.",
  unsupported_type: "Use a JPEG, PNG, WebP, or PDF file.",
  too_large: "Files must be 10 MB or smaller.",
  limit_reached: "A property can have up to 20 files. Delete one before uploading more.",
  storage_failed: "Could not store the file. Please try again.",
  not_an_image: "Only photos can be the cover.",
};

function revalidateMedia(propertyId: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/edit`);
}

export async function uploadMedia(
  propertyId: string,
  formData: FormData,
): Promise<ActionResult<MediaItem>> {
  try {
    const user = await requireUser();
    if (!canWriteListings(user.role)) return fail(FORBIDDEN);

    const allowed = await consumeRateLimit(
      MEDIA_UPLOAD_RATE_LIMIT_SCOPE,
      user.id,
      MEDIA_UPLOAD_RATE_LIMIT_MAX,
      MEDIA_UPLOAD_RATE_LIMIT_WINDOW_SECONDS,
    );
    if (!allowed) return fail(RATE_LIMITED);

    const file = formData.get("file");
    if (!file || typeof file === "string") return fail("Choose a file to upload.");

    const item = await mediaService.upload(propertyId, ownerScope(user), file);
    revalidateMedia(propertyId);
    return ok(item);
  } catch (error) {
    if (error instanceof AuthError) return fail(SIGNED_OUT);
    if (error instanceof MediaError) return fail(MEDIA_MESSAGES[error.code]);
    console.error("[actions/media/uploadMedia]", error);
    return fail(GENERIC);
  }
}

export async function updateMediaAlt(mediaId: string, altText: string): Promise<ActionResult<MediaItem>> {
  try {
    const user = await requireUser();
    if (!canWriteListings(user.role)) return fail(FORBIDDEN);

    const parsed = mediaAltSchema.safeParse(altText);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "That alt text is not valid.");
    }

    const item = await mediaService.updateAlt(mediaId, ownerScope(user), parsed.data);
    revalidateMedia(item.propertyId);
    return ok(item);
  } catch (error) {
    if (error instanceof AuthError) return fail(SIGNED_OUT);
    if (error instanceof MediaError) return fail(MEDIA_MESSAGES[error.code]);
    console.error("[actions/media/updateMediaAlt]", error);
    return fail(GENERIC);
  }
}

export async function setCover(mediaId: string): Promise<ActionResult<{ propertyId: string }>> {
  try {
    const user = await requireUser();
    if (!canWriteListings(user.role)) return fail(FORBIDDEN);

    const propertyId = await mediaService.setCover(mediaId, ownerScope(user));
    revalidateMedia(propertyId);
    return ok({ propertyId });
  } catch (error) {
    if (error instanceof AuthError) return fail(SIGNED_OUT);
    if (error instanceof MediaError) return fail(MEDIA_MESSAGES[error.code]);
    console.error("[actions/media/setCover]", error);
    return fail(GENERIC);
  }
}

export async function deleteMedia(mediaId: string): Promise<ActionResult<{ propertyId: string }>> {
  try {
    const user = await requireUser();
    // Re-read the role from Clerk: the session claim can lag behind a role change.
    const role = await getFreshRole(user.id);
    if (!canWriteListings(role)) return fail(FORBIDDEN);

    const propertyId = await mediaService.remove(mediaId, ownerScope({ id: user.id, role }));
    revalidateMedia(propertyId);
    return ok({ propertyId });
  } catch (error) {
    if (error instanceof AuthError) return fail(SIGNED_OUT);
    if (error instanceof MediaError) return fail(MEDIA_MESSAGES[error.code]);
    console.error("[actions/media/deleteMedia]", error);
    return fail(GENERIC);
  }
}
