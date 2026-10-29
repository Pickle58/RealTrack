import { z } from "zod";

export const MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
export const MAX_MEDIA_PER_PROPERTY = 20;
export const MAX_ALT_TEXT_LENGTH = 200;

/** `accept` attribute for file inputs, derived from the server-side allow-list. */
export const MEDIA_ACCEPT = MEDIA_MIME_TYPES.join(",");

export function isAllowedMediaType(mimeType: string): boolean {
  return MEDIA_MIME_TYPES.some((allowed) => allowed === mimeType);
}

export function isImageMedia(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/** Empty alt text is stored as null so "Photo of {address}" can be used as the fallback. */
export const mediaAltSchema = z
  .string()
  .trim()
  .max(MAX_ALT_TEXT_LENGTH, `Alt text must be ${MAX_ALT_TEXT_LENGTH} characters or fewer.`);
