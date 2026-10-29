import { bumpListVersion, cacheDelete, propertyDetailKey } from "@/lib/kv";

export const propertyEventNames = [
  "property.created",
  "property.updated",
  "property.deleted",
] as const;

export type PropertyEventName = (typeof propertyEventNames)[number];

export type PropertyEventPayload = {
  propertyId: string;
  ownerId: string;
  addressChanged?: boolean;
};

/**
 * Events are in-process cache invalidation, not a queue: every emitter bumps the list version
 * and drops the detail entry. Failures are logged and swallowed so a KV outage cannot roll back
 * a write that D1 already accepted.
 */
export async function emitPropertyEvent(
  name: PropertyEventName,
  payload: PropertyEventPayload,
): Promise<void> {
  try {
    await bumpListVersion();
    if (name !== "property.created") {
      await cacheDelete(propertyDetailKey(payload.propertyId));
    }
  } catch (error) {
    console.error(`[events/${name}]`, error);
  }
}
