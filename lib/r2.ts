import { getEnv } from "@/lib/cloudflare";

export async function putMedia(key: string, body: ArrayBuffer, contentType: string): Promise<void> {
  await getEnv().MEDIA.put(key, body, { httpMetadata: { contentType } });
}

export async function getMedia(key: string): Promise<R2ObjectBody | null> {
  return getEnv().MEDIA.get(key);
}

export async function deleteMedia(key: string): Promise<void> {
  await getEnv().MEDIA.delete(key);
}

/** Removes every object under a prefix and returns how many were deleted. */
export async function deletePrefix(prefix: string): Promise<number> {
  const bucket = getEnv().MEDIA;
  let cursor: string | undefined;
  let deleted = 0;

  do {
    const page = await bucket.list({ prefix, cursor });
    if (page.objects.length > 0) {
      await bucket.delete(page.objects.map((object) => object.key));
      deleted += page.objects.length;
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  return deleted;
}
