import { getEnv } from "@/lib/cloudflare";

export const LIST_VERSION_KEY = "properties:list:version";

/** List keys carry the version so one bump orphans every older list without a prefix scan. */
export function propertyListKey(version: string, queryHash: string): string {
  return `properties:list:${version}:${queryHash}`;
}

export function propertyDetailKey(propertyId: string): string {
  return `properties:${propertyId}`;
}

/** Cache reads are best-effort: a KV failure is treated as a miss so D1 stays authoritative. */
export async function cacheGetJson<T>(key: string): Promise<T | null> {
  try {
    return await getEnv().KV.get<T>(key, "json");
  } catch (error) {
    console.error("[kv/cacheGetJson]", error);
    return null;
  }
}

export async function cachePutJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await getEnv().KV.put(key, JSON.stringify(value), { expirationTtl: Math.max(60, ttlSeconds) });
  } catch (error) {
    console.error("[kv/cachePutJson]", error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    await getEnv().KV.delete(key);
  } catch (error) {
    console.error("[kv/cacheDelete]", error);
  }
}

/**
 * The version is the only key without a TTL. A missing key is the starting namespace (`0`);
 * an unreadable one yields a per-call value, so the caller misses the list cache rather than
 * reading a version that may have been replaced.
 */
export async function getListVersion(): Promise<string> {
  try {
    return (await getEnv().KV.get(LIST_VERSION_KEY)) ?? "0";
  } catch (error) {
    console.error("[kv/getListVersion]", error);
    return crypto.randomUUID();
  }
}

export async function bumpListVersion(): Promise<void> {
  try {
    await getEnv().KV.put(LIST_VERSION_KEY, String(Date.now()));
  } catch (error) {
    console.error("[kv/bumpListVersion]", error);
  }
}

/**
 * Fixed-window counter: returns false once `limit` calls have been made in the current window.
 * Fails open, because a KV outage must not block saving a property.
 */
export async function consumeRateLimit(
  scope: string,
  subject: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const window = Math.floor(Date.now() / 1000 / windowSeconds);
    const key = `ratelimit:${scope}:${subject}:${window}`;
    const used = Number(await getEnv().KV.get(key)) || 0;
    if (used >= limit) return false;
    await getEnv().KV.put(key, String(used + 1), { expirationTtl: Math.max(60, windowSeconds) });
    return true;
  } catch (error) {
    console.error("[kv/consumeRateLimit]", error);
    return true;
  }
}

/** Cache keys hash normalized input so they are stable and never embed addresses or query strings. */
export async function sha256Hex(value: string, length = 32): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, length);
}
